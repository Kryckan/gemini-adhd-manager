export type CalendarProvider = 'GOOGLE' | 'WEBCAL';

export type CalendarConnection = {
  id: string;
  owner_id: string;
  provider: CalendarProvider;
  status: 'CONNECTED' | 'DISCONNECTED';
  sync_enabled: boolean;
  account_label: string | null;
  webcal_url: string | null;
  selected_calendar_ids: string[] | null;
  access_token: string | null;
  refresh_token: string | null;
  token_expires_at: string | null;
};

export type SyncedCalendarEvent = {
  owner_id: string;
  connection_id: string;
  provider: CalendarProvider;
  external_event_id: string;
  title: string;
  description: string | null;
  location: string | null;
  starts_at: string;
  ends_at: string;
  is_all_day: boolean;
  source_calendar_id: string | null;
  source_calendar_name: string | null;
  raw_payload: Record<string, unknown>;
};
