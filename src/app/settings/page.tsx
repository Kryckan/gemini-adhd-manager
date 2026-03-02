import React from 'react';
import { Sidebar } from '@/components/ui/Sidebar';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { Switch } from '@/components/ui/Switch';
import { connectGoogleCalendar, disconnectCalendar, saveWebcalFeed, setCalendarSyncEnabled } from '@/app/actions';
import { createClient } from '@/utils/supabase/server';

type CalendarConnectionRow = {
  provider: 'GOOGLE' | 'WEBCAL';
  status: 'CONNECTED' | 'DISCONNECTED';
  sync_enabled: boolean | null;
  account_label: string | null;
  webcal_url: string | null;
};

async function getCalendarConnections() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('calendar_connections')
    .select('provider,status,sync_enabled,account_label,webcal_url');

  if (error) {
    if (error.code === '42P01') {
      return { missingTable: true, rows: [] as CalendarConnectionRow[] };
    }
    throw new Error('Failed to load calendar connections');
  }

  return { missingTable: false, rows: (data ?? []) as CalendarConnectionRow[] };
}

export default async function SettingsPage() {
  const { missingTable, rows } = await getCalendarConnections();

  const google = rows.find((row) => row.provider === 'GOOGLE');
  const webcal = rows.find((row) => row.provider === 'WEBCAL');

  const googleConnected = google?.status === 'CONNECTED';
  const googleSyncEnabled = google?.sync_enabled ?? false;
  const googleAccountLabel = google?.account_label ?? 'Google Account';

  const webcalConnected = webcal?.status === 'CONNECTED';
  const webcalSyncEnabled = webcal?.sync_enabled ?? false;
  const webcalAccountLabel = webcal?.account_label ?? 'WebCal Feed';
  const webcalUrl = webcal?.webcal_url ?? '';

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-neutral-300 font-sans selection:bg-cyan-900 selection:text-cyan-50 flex overflow-hidden">
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-y-auto w-full relative">
        <header className="p-10 lg:p-16 pb-0 shrink-0 flex flex-col items-start gap-4">
          <h1 className="text-5xl font-light tracking-tight text-white font-mono">SETTINGS</h1>
          <p className="text-neutral-500 font-mono text-sm max-w-xl leading-relaxed">
            Configure system parameters. Avoid unnecessary changes. Minimal operational noise is the baseline.
          </p>
        </header>

        <section className="flex-1 p-10 lg:p-16 pt-12 flex flex-col relative max-w-4xl">
          <Tabs defaultValue="calendars" className="w-full">
            <TabsList>
              <TabsTrigger value="general">GENERAL</TabsTrigger>
              <TabsTrigger value="calendars">CALENDARS</TabsTrigger>
              <TabsTrigger value="notifications">NOTIFICATIONS</TabsTrigger>
              <TabsTrigger value="about">ABOUT</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="mt-8 space-y-12">
              <div className="space-y-4">
                <h3 className="text-xl font-mono text-white">Focus Mode</h3>
                <p className="text-sm text-neutral-500">Silence non-critical alerts implicitly.</p>
                <div className="flex items-center gap-4 mt-4">
                  <Switch defaultChecked />
                  <span className="text-xs font-mono uppercase text-neutral-400">Deep Work Enforcement</span>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="calendars" className="mt-8 space-y-10">
              <div>
                <h2 className="text-2xl font-mono text-white mb-2">Calendar Connections</h2>
                <p className="text-sm text-neutral-500">Connect or pause integrations used by the timeline calendar.</p>
              </div>

              {missingTable ? (
                <div className="rounded-lg border border-yellow-900/50 bg-yellow-950/20 p-4 text-sm text-yellow-300">
                  Calendar connections table is missing. Run your latest Supabase migrations, then reload this page.
                </div>
              ) : null}

              <article className="rounded-lg border border-neutral-900 p-5 space-y-4 bg-neutral-950/40">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-mono text-white">Google Calendar</h3>
                    <p className="text-xs font-mono text-neutral-500">{googleConnected ? googleAccountLabel : 'Not connected'}</p>
                  </div>
                  <span className={`text-[10px] font-mono uppercase px-2 py-1 rounded border ${googleConnected ? 'text-emerald-400 border-emerald-400/20 bg-emerald-400/10' : 'text-neutral-500 border-neutral-800'}`}>
                    {googleConnected ? 'Connected' : 'Disconnected'}
                  </span>
                </div>

                {!googleConnected ? (
                  <form action={connectGoogleCalendar} className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <input
                      name="accountLabel"
                      placeholder="Account label (optional)"
                      className="w-full sm:max-w-xs bg-neutral-900/70 border border-neutral-800 rounded px-3 py-2 text-sm text-neutral-200 placeholder:text-neutral-600"
                    />
                    <button className="px-4 py-2 text-xs font-mono rounded bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 transition-colors">
                      Connect Google
                    </button>
                  </form>
                ) : (
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <form action={setCalendarSyncEnabled}>
                      <input type="hidden" name="provider" value="GOOGLE" />
                      <input type="hidden" name="enabled" value={googleSyncEnabled ? 'false' : 'true'} />
                      <button className="px-4 py-2 text-xs font-mono rounded border border-neutral-700 text-neutral-300 hover:text-white hover:border-neutral-500 transition-colors">
                        {googleSyncEnabled ? 'Pause Sync' : 'Enable Sync'}
                      </button>
                    </form>
                    <form action={disconnectCalendar}>
                      <input type="hidden" name="provider" value="GOOGLE" />
                      <button className="px-4 py-2 text-xs font-mono rounded border border-red-900/50 text-red-300 hover:border-red-700 hover:text-red-200 transition-colors">
                        Disconnect
                      </button>
                    </form>
                  </div>
                )}
              </article>

              <article className="rounded-lg border border-neutral-900 p-5 space-y-4 bg-neutral-950/40">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-mono text-white">WebCal Feed</h3>
                    <p className="text-xs font-mono text-neutral-500">{webcalConnected ? webcalAccountLabel : 'Not connected'}</p>
                  </div>
                  <span className={`text-[10px] font-mono uppercase px-2 py-1 rounded border ${webcalConnected ? 'text-emerald-400 border-emerald-400/20 bg-emerald-400/10' : 'text-neutral-500 border-neutral-800'}`}>
                    {webcalConnected ? 'Connected' : 'Disconnected'}
                  </span>
                </div>

                <form action={saveWebcalFeed} className="space-y-3">
                  <input
                    name="accountLabel"
                    defaultValue={webcalConnected ? webcalAccountLabel : ''}
                    placeholder="Feed label (optional)"
                    className="w-full sm:max-w-xs bg-neutral-900/70 border border-neutral-800 rounded px-3 py-2 text-sm text-neutral-200 placeholder:text-neutral-600"
                  />
                  <input
                    name="webcalUrl"
                    defaultValue={webcalUrl}
                    placeholder="webcal://example.com/calendar.ics"
                    required
                    className="w-full bg-neutral-900/70 border border-neutral-800 rounded px-3 py-2 text-sm text-neutral-200 placeholder:text-neutral-600"
                  />
                  <button className="px-4 py-2 text-xs font-mono rounded bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 transition-colors">
                    {webcalConnected ? 'Update Feed' : 'Add WebCal URL'}
                  </button>
                </form>

                {webcalConnected ? (
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <form action={setCalendarSyncEnabled}>
                      <input type="hidden" name="provider" value="WEBCAL" />
                      <input type="hidden" name="enabled" value={webcalSyncEnabled ? 'false' : 'true'} />
                      <button className="px-4 py-2 text-xs font-mono rounded border border-neutral-700 text-neutral-300 hover:text-white hover:border-neutral-500 transition-colors">
                        {webcalSyncEnabled ? 'Pause Sync' : 'Enable Sync'}
                      </button>
                    </form>
                    <form action={disconnectCalendar}>
                      <input type="hidden" name="provider" value="WEBCAL" />
                      <button className="px-4 py-2 text-xs font-mono rounded border border-red-900/50 text-red-300 hover:border-red-700 hover:text-red-200 transition-colors">
                        Disconnect
                      </button>
                    </form>
                  </div>
                ) : null}
              </article>
            </TabsContent>

            <TabsContent value="notifications" className="mt-8 space-y-12">
              <p className="text-sm text-neutral-500">Notification preferences go here.</p>
            </TabsContent>

            <TabsContent value="about" className="mt-8 space-y-12">
              <p className="text-sm text-neutral-500">System architecture details go here.</p>
            </TabsContent>
          </Tabs>
        </section>
      </main>
    </div>
  );
}
