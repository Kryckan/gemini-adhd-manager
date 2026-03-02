'use client';

import React, { useMemo, useState } from 'react';
import { addDays, endOfMonth, endOfWeek, format, isSameDay, isSameMonth, startOfMonth, startOfWeek, subDays } from 'date-fns';
import { CalendarClock, Globe, Link2 } from 'lucide-react';

type TimelineEventNote = { id: string; type: string; content: string };

type TimelineEvent = {
  id: string;
  date: string;
  time: string;
  title: string;
  notes: TimelineEventNote[];
};

const CALENDAR_CONNECTIONS = [
  {
    id: 'google-calendar',
    name: 'Google Calendar',
    description: 'Two-way sync for meetings, deep work blocks, and reminders.',
    status: 'Not Connected',
    icon: CalendarClock,
    cta: 'Connect Google',
  },
  {
    id: 'webcal-feed',
    name: 'WebCal Feed',
    description: 'Subscribe to shared schedules, school calendars, or team feeds.',
    status: 'Ready to Import',
    icon: Globe,
    cta: 'Add WebCal URL',
  },
] as const;

const UPCOMING_EXTERNAL_EVENTS = [
  { id: 'ext-1', source: 'Google (preview)', time: 'Tomorrow · 08:30', title: 'Design review — automation board', tag: 'MEETING' },
  { id: 'ext-2', source: 'WebCal (preview)', time: 'Thu · 16:00', title: 'Community parent session', tag: 'PERSONAL' },
];

export function CalendarPanel({ events }: { events: TimelineEvent[] }) {
  const today = useMemo(() => new Date(), []);
  const [view, setView] = useState<'day' | 'month'>('day');
  const [selectedDate, setSelectedDate] = useState(today);

  const calendarDays = useMemo(() => buildCalendarGrid(selectedDate), [selectedDate]);

  const eventsWithDate = useMemo(
    () => events.map((event) => ({ ...event, dateObj: new Date(event.date) })),
    [events],
  );

  const selectedDayEvents = eventsWithDate.filter((event) => isSameDay(event.dateObj, selectedDate));

  return (
    <section className="bg-[#0f0f0f] flex flex-col overflow-y-auto w-full">
      <header className="p-6 border-b border-neutral-900 shrink-0 sticky top-0 bg-[#0f0f0f]/90 backdrop-blur z-10 space-y-4">
        <div className="flex justify-between items-end">
          <h2 className="text-[11px] font-mono text-neutral-500 uppercase tracking-widest">Calendar Layer</h2>
          <span className="text-[10px] font-mono text-[#00A3FF]">{format(selectedDate, view === 'day' ? 'EEE, MMM d' : 'MMM yyyy')}</span>
        </div>

        <div className="flex gap-2">
          <ViewSwitchButton active={view === 'day'} onClick={() => setView('day')} label="Day" />
          <ViewSwitchButton active={view === 'month'} onClick={() => setView('month')} label="Month" />
        </div>
      </header>

      <div className="p-6 space-y-8">
        {view === 'day' ? (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setSelectedDate((prev) => subDays(prev, 1))}
                className="text-[10px] font-mono uppercase tracking-widest text-neutral-500 hover:text-neutral-300 focus-visible:outline-2 focus-visible:outline-blue-500 focus-visible:outline-offset-2 rounded px-2 py-1"
              >
                Prev
              </button>
              <button
                type="button"
                onClick={() => setSelectedDate(today)}
                className="text-[10px] font-mono uppercase tracking-widest text-blue-400 hover:text-blue-300 focus-visible:outline-2 focus-visible:outline-blue-500 focus-visible:outline-offset-2 rounded px-2 py-1"
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => setSelectedDate((prev) => addDays(prev, 1))}
                className="text-[10px] font-mono uppercase tracking-widest text-neutral-500 hover:text-neutral-300 focus-visible:outline-2 focus-visible:outline-blue-500 focus-visible:outline-offset-2 rounded px-2 py-1"
              >
                Next
              </button>
            </div>

            {selectedDayEvents.length > 0 ? (
              <div className="space-y-4">
                {selectedDayEvents.map((event) => (
                  <div key={event.id} className="space-y-1.5">
                    <p className="text-[10px] font-mono uppercase tracking-widest text-blue-400">{event.time}</p>
                    <p className="text-sm text-neutral-200">{event.title}</p>
                    {event.notes.length > 0 && (
                      <p className="text-xs text-neutral-500">{event.notes[0].content}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-neutral-500">No events scheduled for this day.</p>
            )}
          </section>
        ) : (
          <section>
            <div className="grid grid-cols-7 text-[10px] uppercase tracking-widest text-neutral-600 mb-3 font-mono">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day) => (
                <span key={day} className="text-center">{day}</span>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1.5">
              {calendarDays.map((day) => {
                const eventCount = eventsWithDate.filter((event) => isSameDay(event.dateObj, day)).length;
                const isToday = isSameDay(day, today);
                const outsideMonth = !isSameMonth(day, selectedDate);
                const isSelected = isSameDay(day, selectedDate);
                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => setSelectedDate(day)}
                    className={`h-10 text-xs rounded-md transition-colors font-mono relative focus-visible:outline-2 focus-visible:outline-blue-500 focus-visible:outline-offset-2 ${
                      isToday || isSelected ? 'bg-blue-500/20 text-blue-400' : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900'
                    } ${outsideMonth ? 'opacity-40' : ''}`}
                    type="button"
                  >
                    {format(day, 'd')}
                    {eventCount > 0 && <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#00A3FF]" />}
                  </button>
                );
              })}
            </div>
          </section>
        )}

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-[11px] font-mono text-neutral-500 uppercase tracking-widest">External Connections</h3>
            <Link2 size={14} className="text-blue-400" />
          </div>
          {CALENDAR_CONNECTIONS.map((connection) => (
            <ConnectionCard key={connection.id} {...connection} />
          ))}
        </section>

        <section className="space-y-3 border-t border-neutral-900 pt-6">
          <h3 className="text-[11px] font-mono text-neutral-500 uppercase tracking-widest">Imported Preview</h3>
          {UPCOMING_EXTERNAL_EVENTS.map((event) => (
            <div key={event.id} className="space-y-1">
              <p className="text-[10px] font-mono uppercase text-neutral-600 tracking-wide">{event.source} · {event.time}</p>
              <p className="text-sm text-neutral-300">{event.title}</p>
              <span className="inline-flex px-1.5 py-0.5 rounded text-[9px] font-mono border border-neutral-800 text-neutral-500">{event.tag}</span>
            </div>
          ))}
        </section>
      </div>
    </section>
  );
}

function buildCalendarGrid(referenceDate: Date) {
  const monthStart = startOfMonth(referenceDate);
  const monthEnd = endOfMonth(referenceDate);
  const gridStart = startOfWeek(monthStart);
  const gridEnd = endOfWeek(monthEnd);

  const days: Date[] = [];
  let currentDay = gridStart;

  while (currentDay <= gridEnd) {
    days.push(currentDay);
    currentDay = addDays(currentDay, 1);
  }

  return days;
}

function ConnectionCard({
  name,
  description,
  status,
  icon: Icon,
  cta,
}: {
  name: string;
  description: string;
  status: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  cta: string;
}) {
  return (
    <article className="bg-neutral-950/50 rounded-lg p-4 space-y-3 border border-neutral-900">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <h4 className="text-sm text-neutral-200 font-medium">{name}</h4>
          <p className="text-xs text-neutral-500 leading-relaxed">{description}</p>
        </div>
        <Icon size={16} className="text-blue-400 shrink-0 mt-0.5" />
      </div>
      <div className="flex items-center justify-between gap-3">
        <span className="text-[10px] uppercase tracking-wide font-mono text-neutral-500">{status}</span>
        <button
          type="button"
          className="text-xs font-mono px-2.5 py-1.5 rounded bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors focus-visible:outline-2 focus-visible:outline-blue-500 focus-visible:outline-offset-2"
        >
          {cta}
        </button>
      </div>
    </article>
  );
}

function ViewSwitchButton({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-[10px] font-mono uppercase tracking-widest px-2.5 py-1.5 rounded transition-colors focus-visible:outline-2 focus-visible:outline-blue-500 focus-visible:outline-offset-2 ${
        active ? 'bg-blue-500/20 text-blue-400' : 'text-neutral-500 hover:text-neutral-300 hover:bg-neutral-900'
      }`}
    >
      {label}
    </button>
  );
}
