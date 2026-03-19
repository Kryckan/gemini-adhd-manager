import { createClient } from '@/utils/supabase/server';
import { parseIcsEvents } from '@/lib/calendars/ics';
import type { CalendarConnection, CalendarProvider, SyncedCalendarEvent } from '@/lib/calendars/types';

type SyncResult = {
  importedCount: number;
  message: string;
};

type GoogleTokenRefreshResponse = {
  access_token: string;
  expires_in: number;
};

type GoogleCalendarListResponse = {
  items?: Array<{
    id: string;
    summary?: string;
    primary?: boolean;
  }>;
};

type GoogleEventsResponse = {
  items?: Array<{
    id: string;
    summary?: string;
    description?: string;
    location?: string;
    status?: string;
    start?: { date?: string; dateTime?: string };
    end?: { date?: string; dateTime?: string };
  }>;
};

function mustGetGoogleConfig() {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Google OAuth env vars are missing');
  }

  return { clientId, clientSecret };
}

function toIsoIfValid(input: string | undefined): string | null {
  if (!input) return null;
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

function computeAllDay(dateValue: string | undefined, dateTimeValue: string | undefined): boolean {
  return Boolean(dateValue && !dateTimeValue);
}

function normalizeGoogleEventTimes(event: NonNullable<GoogleEventsResponse['items']>[number]): { startsAt: string; endsAt: string; isAllDay: boolean } | null {
  const startsAt = toIsoIfValid(event.start?.dateTime ?? event.start?.date);
  const endsAt = toIsoIfValid(event.end?.dateTime ?? event.end?.date);
  if (!startsAt || !endsAt) return null;
  return {
    startsAt,
    endsAt,
    isAllDay: computeAllDay(event.start?.date, event.start?.dateTime),
  };
}

async function getConnection(userId: string, provider: CalendarProvider): Promise<CalendarConnection | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('calendar_connections')
    .select('id,owner_id,provider,status,sync_enabled,account_label,webcal_url,selected_calendar_ids,access_token,refresh_token,token_expires_at')
    .eq('owner_id', userId)
    .eq('provider', provider)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load ${provider} connection`);
  }

  return (data as CalendarConnection | null) ?? null;
}

async function saveConnectionMeta(
  connectionId: string,
  updates: Partial<Pick<CalendarConnection, 'access_token' | 'refresh_token' | 'token_expires_at'>> & {
    last_synced_at?: string | null;
    last_sync_error?: string | null;
  }
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('calendar_connections')
    .update(updates)
    .eq('id', connectionId);

  if (error) {
    throw new Error('Failed to persist calendar connection metadata');
  }
}

async function upsertEvents(connection: CalendarConnection, events: SyncedCalendarEvent[]) {
  const supabase = await createClient();

  const { error: deleteError } = await supabase
    .from('calendar_events')
    .delete()
    .eq('connection_id', connection.id);

  if (deleteError) {
    throw new Error('Failed to clear previous synced events');
  }

  if (events.length === 0) {
    return;
  }

  const { error: upsertError } = await supabase
    .from('calendar_events')
    .insert(events);

  if (upsertError) {
    throw new Error('Failed to store synced calendar events');
  }
}

async function refreshGoogleAccessToken(connection: CalendarConnection): Promise<{ accessToken: string; tokenExpiresAt: string }> {
  if (!connection.refresh_token) {
    throw new Error('Google refresh token is missing. Reconnect Google Calendar.');
  }

  const { clientId, clientSecret } = mustGetGoogleConfig();

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: connection.refresh_token,
      grant_type: 'refresh_token',
    }),
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error('Google token refresh failed');
  }

  const payload = (await response.json()) as GoogleTokenRefreshResponse;
  const tokenExpiresAt = new Date(Date.now() + payload.expires_in * 1000).toISOString();

  await saveConnectionMeta(connection.id, {
    access_token: payload.access_token,
    token_expires_at: tokenExpiresAt,
  });

  return { accessToken: payload.access_token, tokenExpiresAt };
}

async function getValidGoogleAccessToken(connection: CalendarConnection): Promise<string> {
  const expiresAt = connection.token_expires_at ? new Date(connection.token_expires_at).getTime() : 0;
  const expiresSoon = Date.now() + 60_000 > expiresAt;
  if (connection.access_token && !expiresSoon) {
    return connection.access_token;
  }
  const refreshed = await refreshGoogleAccessToken(connection);
  return refreshed.accessToken;
}

async function listGoogleCalendars(accessToken: string): Promise<GoogleCalendarListResponse['items']> {
  const response = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch Google calendar list');
  }

  const payload = (await response.json()) as GoogleCalendarListResponse;
  return payload.items ?? [];
}

async function listGoogleEvents(accessToken: string, calendarId: string): Promise<GoogleEventsResponse['items']> {
  const url = new URL(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`);
  url.searchParams.set('singleEvents', 'true');
  url.searchParams.set('orderBy', 'startTime');
  url.searchParams.set('maxResults', '250');
  url.searchParams.set('timeMin', new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString());
  url.searchParams.set('timeMax', new Date(Date.now() + 1000 * 60 * 60 * 24 * 180).toISOString());

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch Google events for ${calendarId}`);
  }

  const payload = (await response.json()) as GoogleEventsResponse;
  return payload.items ?? [];
}

async function syncGoogleConnection(userId: string): Promise<SyncResult> {
  const connection = await getConnection(userId, 'GOOGLE');
  if (!connection || connection.status !== 'CONNECTED') {
    throw new Error('Google Calendar is not connected');
  }
  if (!connection.sync_enabled) {
    return { importedCount: 0, message: 'Google sync is paused' };
  }

  const accessToken = await getValidGoogleAccessToken(connection);
  const calendars = (await listGoogleCalendars(accessToken)) ?? [];

  const selectedIds = (connection.selected_calendar_ids ?? []).filter(Boolean);
  const targetCalendars = selectedIds.length > 0
    ? calendars.filter((calendar) => selectedIds.includes(calendar.id))
    : calendars;

  const events: SyncedCalendarEvent[] = [];

  for (const calendar of targetCalendars) {
    const calendarEvents = (await listGoogleEvents(accessToken, calendar.id)) ?? [];
    for (const googleEvent of calendarEvents) {
      if (!googleEvent.id) continue;
      if (googleEvent.status === 'cancelled') continue;

      const times = normalizeGoogleEventTimes(googleEvent);
      if (!times) continue;

      events.push({
        owner_id: userId,
        connection_id: connection.id,
        provider: 'GOOGLE',
        external_event_id: `${calendar.id}:${googleEvent.id}`,
        title: googleEvent.summary?.trim() || 'Untitled event',
        description: googleEvent.description?.trim() || null,
        location: googleEvent.location?.trim() || null,
        starts_at: times.startsAt,
        ends_at: times.endsAt,
        is_all_day: times.isAllDay,
        source_calendar_id: calendar.id,
        source_calendar_name: calendar.summary?.trim() || calendar.id,
        raw_payload: googleEvent as unknown as Record<string, unknown>,
      });
    }
  }

  await upsertEvents(connection, events);
  await saveConnectionMeta(connection.id, {
    last_synced_at: new Date().toISOString(),
    last_sync_error: null,
  });

  return { importedCount: events.length, message: 'Google calendars synced' };
}

async function syncWebcalConnection(userId: string): Promise<SyncResult> {
  const connection = await getConnection(userId, 'WEBCAL');
  if (!connection || connection.status !== 'CONNECTED') {
    throw new Error('WebCal feed is not connected');
  }
  if (!connection.sync_enabled) {
    return { importedCount: 0, message: 'WebCal sync is paused' };
  }
  if (!connection.webcal_url) {
    throw new Error('WebCal URL is missing');
  }

  const response = await fetch(connection.webcal_url, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error('Failed to fetch WebCal feed');
  }

  const content = await response.text();
  const parsedEvents = parseIcsEvents(content);

  const events: SyncedCalendarEvent[] = parsedEvents.map((event) => ({
    owner_id: userId,
    connection_id: connection.id,
    provider: 'WEBCAL',
    external_event_id: event.uid,
    title: event.summary || 'Untitled event',
    description: event.description,
    location: event.location,
    starts_at: event.startsAt,
    ends_at: event.endsAt,
    is_all_day: event.isAllDay,
    source_calendar_id: connection.webcal_url,
    source_calendar_name: connection.account_label ?? 'WebCal Feed',
    raw_payload: { uid: event.uid },
  }));

  await upsertEvents(connection, events);
  await saveConnectionMeta(connection.id, {
    last_synced_at: new Date().toISOString(),
    last_sync_error: null,
  });

  return { importedCount: events.length, message: 'WebCal feed synced' };
}

export async function syncProviderForCurrentUser(provider: CalendarProvider): Promise<SyncResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Unauthorized');
  }

  try {
    if (provider === 'GOOGLE') {
      return await syncGoogleConnection(user.id);
    }
    return await syncWebcalConnection(user.id);
  } catch (error) {
    const connection = await getConnection(user.id, provider);
    if (connection) {
      await saveConnectionMeta(connection.id, {
        last_sync_error: error instanceof Error ? error.message : 'Unknown sync error',
      });
    }
    throw error;
  }
}
