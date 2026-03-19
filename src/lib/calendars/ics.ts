type ParsedRawEvent = Record<string, string[]>;

export type ParsedIcsEvent = {
  uid: string;
  summary: string;
  description: string | null;
  location: string | null;
  startsAt: string;
  endsAt: string;
  isAllDay: boolean;
};

function unfoldIcsLines(content: string): string[] {
  return content
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .reduce<string[]>((lines, line) => {
      if ((line.startsWith(' ') || line.startsWith('\t')) && lines.length > 0) {
        lines[lines.length - 1] += line.slice(1);
        return lines;
      }
      lines.push(line);
      return lines;
    }, []);
}

function decodeIcsText(value: string): string {
  return value
    .replace(/\\n/gi, '\n')
    .replace(/\\,/g, ',')
    .replace(/\\;/g, ';')
    .replace(/\\\\/g, '\\');
}

function parseDateTime(rawValue: string, allDay: boolean): string | null {
  if (allDay) {
    if (!/^\d{8}$/.test(rawValue)) return null;
    const year = Number(rawValue.slice(0, 4));
    const month = Number(rawValue.slice(4, 6));
    const day = Number(rawValue.slice(6, 8));
    return new Date(Date.UTC(year, month - 1, day, 0, 0, 0)).toISOString();
  }

  if (/^\d{8}T\d{6}Z$/.test(rawValue)) {
    const year = Number(rawValue.slice(0, 4));
    const month = Number(rawValue.slice(4, 6));
    const day = Number(rawValue.slice(6, 8));
    const hour = Number(rawValue.slice(9, 11));
    const minute = Number(rawValue.slice(11, 13));
    const second = Number(rawValue.slice(13, 15));
    return new Date(Date.UTC(year, month - 1, day, hour, minute, second)).toISOString();
  }

  if (/^\d{8}T\d{6}$/.test(rawValue)) {
    const year = Number(rawValue.slice(0, 4));
    const month = Number(rawValue.slice(4, 6));
    const day = Number(rawValue.slice(6, 8));
    const hour = Number(rawValue.slice(9, 11));
    const minute = Number(rawValue.slice(11, 13));
    const second = Number(rawValue.slice(13, 15));
    return new Date(year, month - 1, day, hour, minute, second).toISOString();
  }

  const fallback = new Date(rawValue);
  if (Number.isNaN(fallback.getTime())) return null;
  return fallback.toISOString();
}

function parseFieldKey(line: string): { key: string; isAllDay: boolean; value: string } | null {
  const separatorIndex = line.indexOf(':');
  if (separatorIndex < 0) return null;
  const left = line.slice(0, separatorIndex);
  const right = line.slice(separatorIndex + 1);
  const [rawKey, ...params] = left.split(';');
  const key = rawKey.toUpperCase();
  const isAllDay = params.some((param) => param.toUpperCase() === 'VALUE=DATE');
  return { key, isAllDay, value: right };
}

function collectRawEvents(lines: string[]): ParsedRawEvent[] {
  const events: ParsedRawEvent[] = [];
  let current: ParsedRawEvent | null = null;

  for (const line of lines) {
    if (line === 'BEGIN:VEVENT') {
      current = {};
      continue;
    }
    if (line === 'END:VEVENT') {
      if (current) events.push(current);
      current = null;
      continue;
    }
    if (!current) continue;

    const parsed = parseFieldKey(line);
    if (!parsed) continue;
    if (!current[parsed.key]) current[parsed.key] = [];
    current[parsed.key].push(`${parsed.isAllDay ? 'DATE|' : 'DATETIME|'}${parsed.value}`);
  }

  return events;
}

function extractDateTime(rawField: string | undefined): { iso: string; isAllDay: boolean } | null {
  if (!rawField) return null;
  const [kind, value] = rawField.split('|');
  const isAllDay = kind === 'DATE';
  const parsed = parseDateTime(value, isAllDay);
  if (!parsed) return null;
  return { iso: parsed, isAllDay };
}

export function parseIcsEvents(content: string): ParsedIcsEvent[] {
  const lines = unfoldIcsLines(content);
  const rawEvents = collectRawEvents(lines);

  return rawEvents
    .map((event) => {
      const uid = event.UID?.[0]?.split('|')[1]?.trim();
      const summaryRaw = event.SUMMARY?.[0]?.split('|')[1] ?? '';
      const starts = extractDateTime(event.DTSTART?.[0]);
      const ends = extractDateTime(event.DTEND?.[0]);

      if (!uid || !starts) return null;

      const summary = decodeIcsText(summaryRaw || 'Untitled event');
      const description = event.DESCRIPTION?.[0] ? decodeIcsText(event.DESCRIPTION[0].split('|')[1] ?? '') : null;
      const location = event.LOCATION?.[0] ? decodeIcsText(event.LOCATION[0].split('|')[1] ?? '') : null;

      let endsAt = ends?.iso;
      if (!endsAt) {
        const startDate = new Date(starts.iso);
        startDate.setMinutes(startDate.getMinutes() + (starts.isAllDay ? 24 * 60 : 60));
        endsAt = startDate.toISOString();
      }

      return {
        uid,
        summary,
        description: description || null,
        location: location || null,
        startsAt: starts.iso,
        endsAt,
        isAllDay: starts.isAllDay,
      } satisfies ParsedIcsEvent;
    })
    .filter((event): event is ParsedIcsEvent => Boolean(event));
}
