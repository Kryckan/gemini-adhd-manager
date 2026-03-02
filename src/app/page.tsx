import React from 'react';
import { createClient } from '@/utils/supabase/server';
import { Sidebar } from '@/components/ui/Sidebar';
import { addTaskFromForm, completeTask, moveTaskToDeck, setNowTask } from '@/app/actions';
import { getTaskPriorityStyles, getTaskStatusStyles } from '@/lib/tasks';

type TaskRow = {
  id: string;
  title: string;
  status: string;
  priority: string;
  is_now: boolean;
};

export default async function AdhdManagerDashboard() {
  const supabase = await createClient();

  const { data: nowTaskData } = await supabase
    .from('tasks')
    .select('id,title,status,priority,is_now')
    .eq('is_now', true)
    .single<TaskRow>();

  const { data: onDeckTasks } = await supabase
    .from('tasks')
    .select('id,title,status,priority,is_now,created_at')
    .eq('is_now', false)
    .neq('status', 'DONE')
    .order('created_at', { ascending: false })
    .limit(6);

  const pulseDelegates = [
    { id: '1', owner: 'Erik Lindqvist', initials: 'EL', task: 'Conveyor belt motor calibration', status: 'ACTIVE', statusColor: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' },
    { id: '2', owner: 'Sarah Henriksson', initials: 'SH', task: 'Sensor board supply chain', status: 'BLOCKED', statusColor: 'text-red-400 bg-red-400/10 border-red-400/20' },
    { id: '3', owner: 'Johan Bergman', initials: 'JB', task: 'QA — packaging module v3', status: 'BUSY', statusColor: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20' },
  ];

  const timelineEvents = [
    { time: '09:00', title: 'Morning Sync', active: true, notes: [] },
    { time: '10:30', title: 'Supplier Call — Molex', notes: [{ id: 'n1', type: 'NOTE', content: 'Discuss Q3 budget limits' }, { id: 'n2', type: 'TAG', content: 'Urgent' }] },
    { time: '13:00', title: '1:1 with Sarah H.', notes: [{ id: 'n3', type: 'LINK', content: 'Miro Board: Arch Review' }] },
    { time: '15:00', title: 'Line 4 Status Review', notes: [] },
  ];

  const nowTask = nowTaskData || {
    id: 'fallback',
    title: 'No NOW task selected yet',
    priority: 'MEDIUM',
    status: 'TODO'
  };

  const gridTasks = onDeckTasks && onDeckTasks.length > 0 ? onDeckTasks : [
    { id: '#221', title: 'Safety enclosure redesign', status: 'IN_PROGRESS', priority: 'HIGH', is_now: false },
    { id: '#217', title: 'QA review — packaging module v3', status: 'IN_REVIEW', priority: 'MEDIUM', is_now: false },
    { id: '#220', title: 'PLC firmware update', status: 'TODO', priority: 'LOW', is_now: false }
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-neutral-300 font-sans selection:bg-cyan-900 selection:text-cyan-50 flex overflow-hidden">
      <Sidebar />

      <main className="flex-1 grid grid-cols-[300px_1fr_350px] divide-x divide-neutral-900 overflow-hidden">
        <section className="bg-[#0f0f0f] flex flex-col overflow-y-auto w-full">
          <header className="p-6 border-b border-neutral-900 shrink-0 sticky top-0 bg-[#0f0f0f]/90 backdrop-blur z-10 flex justify-between items-end">
            <h2 className="text-[11px] font-mono text-neutral-500 uppercase tracking-widest">Timeline</h2>
            <span className="text-[10px] font-mono text-[#00A3FF]">TODAY</span>
          </header>

          <div className="p-6 space-y-8">
            {timelineEvents.map((evt, idx) => (
              <TimelineItem key={idx} time={evt.time} title={evt.title} active={evt.active} notes={evt.notes} />
            ))}
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
                <span className={`px-2 py-1 text-xs font-mono uppercase rounded border ${getTaskStatusStyles(nowTask.status)}`}>{nowTask.status}</span>
                <span className={`px-2 py-1 text-xs font-mono uppercase rounded border ${getTaskPriorityStyles(nowTask.priority)}`}>Priority {nowTask.priority}</span>
              </div>

              <div className="flex items-center gap-3">
                <form action={completeTask}>
                  <input type="hidden" name="taskId" value={nowTask.id} />
                  <button disabled={nowTask.id === 'fallback'} className="flex items-center justify-center gap-3 bg-[#00A3FF] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#33B5FF] text-black w-48 h-12 rounded font-medium transition-all shadow-[0_0_30px_rgba(0,163,255,0.4)] hover:shadow-[0_0_50px_rgba(0,163,255,0.6)]">
                    Complete
                  </button>
                </form>

                <form action={moveTaskToDeck}>
                  <input type="hidden" name="taskId" value={nowTask.id} />
                  <button disabled={nowTask.id === 'fallback'} className="h-12 px-5 rounded border border-neutral-700 text-neutral-300 hover:text-white hover:border-neutral-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                    Move to Deck
                  </button>
                </form>
              </div>
            </div>

            <div className="mt-20 border-t border-neutral-900 pt-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-[11px] font-mono text-neutral-600 uppercase tracking-widest">On Deck</h3>
                <form action={addTaskFromForm} className="flex gap-2 items-center">
                  <input type="hidden" name="isNow" value="false" />
                  <input name="title" placeholder="Capture next task..." className="bg-neutral-900/70 border border-neutral-800 rounded px-3 py-1.5 text-sm text-neutral-200 placeholder:text-neutral-600" />
                  <select name="priority" className="bg-neutral-900/70 border border-neutral-800 rounded px-2 py-1.5 text-xs font-mono text-neutral-300">
                    <option>LOW</option>
                    <option defaultChecked>MEDIUM</option>
                    <option>HIGH</option>
                    <option>CRITICAL</option>
                  </select>
                  <button className="px-3 py-1.5 text-xs font-mono rounded bg-neutral-100 text-black hover:bg-white transition-colors">Add</button>
                </form>
              </div>
              <div className="space-y-4">
                {gridTasks.map(task => (
                  <GridTaskItem key={task.id} id={String(task.id).slice(0, 8)} title={task.title} status={task.status} taskId={String(task.id)} />
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

function TimelineItem({ time, title, active = false, notes = [] }: { time: string, title: string, active?: boolean, notes?: { id: string, type: string, content: string }[] }) {
  return (
    <div className={`flex flex-col gap-2 group ${active ? 'opacity-100' : 'opacity-60 hover:opacity-100'} transition-opacity`}>
      <div className="flex gap-4">
        <span className={`text-sm font-mono shrink-0 pt-0.5 ${active ? 'text-[#00A3FF]' : 'text-neutral-500'}`}>{time}</span>
        <div className={`text-sm font-sans flex items-start ${active ? 'text-white font-medium' : 'text-neutral-300'}`}>
          {active && <span className="mr-2 mt-1.5 inline-block shrink-0 w-1.5 h-1.5 bg-[#00A3FF] rounded-full animate-pulse" />}
          <span className="leading-snug">{title}</span>
        </div>
      </div>
      {notes.length > 0 && (
        <div className="ml-16 border-l border-neutral-800 pl-4 py-1 flex flex-col gap-2">
          {notes.map(note => (
            <div key={note.id} className="flex items-center gap-2">
              <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono border ${note.type === 'TAG' ? 'bg-[#00A3FF]/10 text-[#00A3FF] border-[#00A3FF]/20' : 'bg-neutral-900 text-neutral-500 border-neutral-800'}`}>
                {note.type}
              </span>
              <p className="text-xs text-neutral-500 font-sans">{note.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function GridTaskItem({ id, title, status, taskId }: { id: string, title: string, status: string, taskId: string }) {
  return (
    <div className="flex items-center justify-between group hover:bg-neutral-900/40 p-2 -mx-2 rounded transition-colors border border-transparent hover:border-neutral-800">
      <div className="flex gap-4 items-center min-w-0">
        <span className="text-[11px] font-mono text-neutral-600 w-14">{id}</span>
        <span className="text-sm text-neutral-300 group-hover:text-white transition-colors truncate">{title}</span>
      </div>
      <div className="flex items-center gap-4">
        <span className={`text-[10px] font-mono hidden sm:block px-1.5 py-0.5 rounded border ${getTaskStatusStyles(status)}`}>{status}</span>
        <form action={setNowTask}>
          <input type="hidden" name="taskId" value={taskId} />
          <button className="text-[10px] font-mono px-2 py-1 rounded border border-cyan-700/60 text-cyan-300 hover:text-cyan-200 hover:border-cyan-500 transition-colors">
            Set NOW
          </button>
        </form>
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
