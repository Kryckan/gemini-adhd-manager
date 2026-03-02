import React from 'react';
import { addDays, endOfMonth, endOfWeek, format, isSameDay, isSameMonth, startOfMonth, startOfWeek } from 'date-fns';
import { Link2, CalendarClock, Globe } from 'lucide-react';
import { createClient } from '@/utils/supabase/server';
import { Sidebar } from '@/components/ui/Sidebar';

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

export default async function AdhdManagerDashboard() {
  const supabase = await createClient();

  const { data: nowTaskData } = await supabase
    .from('tasks')
    .select('*')
    .eq('is_now', true)
    .single();

  const { data: onDeckTasks } = await supabase
    .from('tasks')
    .select('*')
    .eq('is_now', false)
    .order('created_at', { ascending: false })
    .limit(4);

  const pulseDelegates = [
    { id: '1', owner: 'Erik Lindqvist', initials: 'EL', task: 'Conveyor belt motor calibration', status: 'ACTIVE', statusColor: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' },
    { id: '2', owner: 'Sarah Henriksson', initials: 'SH', task: 'Sensor board supply chain', status: 'BLOCKED', statusColor: 'text-red-400 bg-red-400/10 border-red-400/20' },
    { id: '3', owner: 'Johan Bergman', initials: 'JB', task: 'QA — packaging module v3', status: 'BUSY', statusColor: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20' },
  ];

  const timelineEvents = [
    { id: 'evt-1', date: new Date(), time: '09:00', title: 'Morning Sync', active: true, notes: [] },
    { id: 'evt-2', date: new Date(), time: '10:30', title: 'Supplier Call — Molex', notes: [{ id: 'n1', type: 'NOTE', content: 'Discuss Q3 budget limits' }, { id: 'n2', type: 'TAG', content: 'Urgent' }] },
    { id: 'evt-3', date: addDays(new Date(), 1), time: '13:00', title: '1:1 with Sarah H.', notes: [{ id: 'n3', type: 'LINK', content: 'Miro Board: Arch Review' }] },
    { id: 'evt-4', date: addDays(new Date(), 2), time: '15:00', title: 'Line 4 Status Review', notes: [] },
  ];

  const nowTask = nowTaskData || {
    title: 'Implement critical\nAPI fix for user auth',
    priority: 'HIGH',
    status: 'BLOCKED',
  };

  const gridTasks = onDeckTasks && onDeckTasks.length > 0 ? onDeckTasks : [
    { id: '#221', title: 'Safety enclosure redesign', status: 'IN_PROGRESS', color: 'bg-yellow-500' },
    { id: '#217', title: 'QA review — packaging module v3', status: 'IN_REVIEW', color: 'bg-orange-500' },
    { id: '#220', title: 'PLC firmware update', status: 'TODO', color: 'bg-neutral-600' },
  ];

  const calendarDays = buildCalendarGrid(new Date());

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-neutral-300 font-sans selection:bg-cyan-900 selection:text-cyan-50 flex overflow-hidden">
      <Sidebar />

      <main className="flex-1 grid grid-cols-[320px_1fr_350px] divide-x divide-neutral-900 overflow-hidden">
        <section className="bg-[#0f0f0f] flex flex-col overflow-y-auto w-full">
          <header className="p-6 border-b border-neutral-900 shrink-0 sticky top-0 bg-[#0f0f0f]/90 backdrop-blur z-10 flex justify-between items-end">
            <h2 className="text-[11px] font-mono text-neutral-500 uppercase tracking-widest">Calendar Layer</h2>
            <span className="text-[10px] font-mono text-[#00A3FF]">{format(new Date(), 'MMM yyyy')}</span>
          </header>

          <div className="p-6 space-y-8">
            <section>
              <div className="grid grid-cols-7 text-[10px] uppercase tracking-widest text-neutral-600 mb-3 font-mono">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day) => (
                  <span key={day} className="text-center">{day}</span>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1.5">
                {calendarDays.map((day) => {
                  const eventCount = timelineEvents.filter((event) => isSameDay(event.date, day)).length;
                  const isToday = isSameDay(day, new Date());
                  const outsideMonth = !isSameMonth(day, new Date());
                  return (
                    <button
                      key={day.toISOString()}
                      className={`h-10 text-xs rounded-md transition-colors font-mono relative focus-visible:outline-2 focus-visible:outline-blue-500 focus-visible:outline-offset-2 ${
                        isToday ? 'bg-blue-500/20 text-blue-400' : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900'
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

        <section className="bg-[#0A0A0A] flex flex-col overflow-y-auto w-full relative">
          <header className="p-6 border-b border-neutral-900 shrink-0 sticky top-0 bg-[#0A0A0A]/90 backdrop-blur z-10 flex justify-between items-end">
            <h2 className="text-[11px] font-mono text-neutral-500 uppercase tracking-widest">Execution Grid</h2>
            <span className="text-[10px] font-mono text-neutral-600">CMD+K TO ADD</span>
          </header>

          <div className="flex-1 p-10 lg:p-16 flex flex-col relative">
            <div className="mb-12 shrink-0">
              <h1 className="text-6xl font-light tracking-tight text-white mb-2 font-mono">NOW</h1>
            </div>

            <div className="max-w-3xl w-full">
              <h2 className="text-3xl lg:text-4xl font-medium text-neutral-200 leading-tight mb-6 font-mono whitespace-pre-line">
                {nowTask.title}
              </h2>

              <div className="flex gap-4 mb-8">
                <span className="px-2 py-1 bg-red-500/10 text-red-400 text-xs font-mono uppercase rounded border border-red-500/20">{nowTask.status}</span>
                <span className="px-2 py-1 bg-neutral-900 text-neutral-400 text-xs font-mono uppercase rounded border border-neutral-800">Priority {nowTask.priority}</span>
              </div>

              <button className="flex items-center justify-center gap-3 bg-[#00A3FF] hover:bg-[#33B5FF] text-black w-64 h-14 rounded font-medium text-lg transition-all shadow-[0_0_30px_rgba(0,163,255,0.4)] hover:shadow-[0_0_50px_rgba(0,163,255,0.6)] focus-visible:outline-2 focus-visible:outline-blue-500 focus-visible:outline-offset-2">
                DO THIS NOW (A)
              </button>
            </div>

            <div className="mt-20 border-t border-neutral-900 pt-8">
              <h3 className="text-[11px] font-mono text-neutral-600 uppercase tracking-widest mb-6">On Deck</h3>
              <div className="space-y-4">
                {gridTasks.map(task => (
                  <GridTaskItem key={task.id} id={String(task.id).slice(0, 5)} title={task.title} status={task.status} color={task.color || 'bg-blue-500'} />
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[#0f0f0f] flex flex-col overflow-y-auto w-full">
          <header className="p-6 border-b border-neutral-900 shrink-0 sticky top-0 bg-[#0f0f0f]/90 backdrop-blur z-10 flex justify-between items-end">
            <h2 className="text-[11px] font-mono text-neutral-500 uppercase tracking-widest">Delegated Pulse</h2>
            <span className="text-[10px] font-mono text-[#00A3FF]">{pulseDelegates.length} ACTIVE</span>
          </header>

          <div className="p-6 space-y-6">
            {pulseDelegates.map(del => (
              <DelegationItem key={del.id} owner={del.owner} initials={del.initials} task={del.task} status={del.status} statusColor={del.statusColor} />
            ))}
          </div>
        </section>
      </main>
    </div>
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

function GridTaskItem({ id, title, status, color }: { id: string, title: string, status: string, color: string }) {
  return (
    <div className="flex items-center justify-between group cursor-pointer hover:bg-neutral-900/40 p-2 -mx-2 rounded transition-colors">
      <div className="flex gap-4 items-center">
        <span className="text-[11px] font-mono text-neutral-600 w-8">{id}</span>
        <span className="text-sm text-neutral-300 group-hover:text-white transition-colors">{title}</span>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-[10px] font-mono text-neutral-500 hidden sm:block">{status}</span>
        <span className={`w-2 h-2 rounded-sm opacity-80 ${color}`} />
      </div>
    </div>
  );
}

function DelegationItem({ owner, initials, task, status, statusColor }: { owner: string, initials: string, task: string, status: string, statusColor: string }) {
  return (
    <div className="flex gap-4 items-start group cursor-pointer">
      <div className="w-8 h-8 rounded shrink-0 bg-neutral-900 border border-neutral-800 flex items-center justify-center text-xs font-mono text-neutral-400 group-hover:border-neutral-700 transition-colors">
        {initials}
      </div>
      <div className="flex flex-col gap-1 w-full border-b border-neutral-900/50 pb-5">
        <div className="flex justify-between items-center w-full">
          <span className="text-sm font-medium text-neutral-300 group-hover:text-white transition-colors">{owner}</span>
          <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${statusColor}`}>{status}</span>
        </div>
        <span className="text-xs text-neutral-500">{task}</span>
      </div>
    </div>
  );
}
