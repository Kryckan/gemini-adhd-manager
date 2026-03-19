'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { syncProviderForCurrentUser } from '@/lib/calendars/sync';

const ALLOWED_PRIORITIES = new Set(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);
const ALLOWED_NOTE_TYPES = new Set(['NOTE', 'TAG', 'LINK']);
const ALLOWED_CALENDAR_PROVIDERS = new Set(['GOOGLE', 'WEBCAL']);

function normalizeTaskTitle(title: string): string {
    const normalized = title.trim();
    if (!normalized) {
        throw new Error('Task title cannot be empty');
    }
    if (normalized.length > 280) {
        throw new Error('Task title is too long');
    }
    return normalized;
}

async function getAuthenticatedUserId() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error('Unauthorized');
    }

    return { supabase, userId: user.id };
}

export async function toggleTaskStatus(taskId: string, currentStatus: 'TODO' | 'DONE' | string) {
    const { supabase, userId } = await getAuthenticatedUserId();

    const nextStatus = currentStatus === 'DONE' ? 'TODO' : 'DONE';

    const { error } = await supabase
        .from('tasks')
        .update({ status: nextStatus })
        .eq('id', taskId)
        .eq('owner_id', userId);

    if (error) {
        console.error('Error updating task:', error);
        throw new Error('Failed to update task');
    }

    revalidatePath('/');
}

export async function addTimelineNote(eventId: string, content: string, type: 'NOTE' | 'TAG' | 'LINK' = 'NOTE') {
    const supabase = await createClient();
    const normalizedContent = content.trim();

    if (!normalizedContent) {
        throw new Error('Note content cannot be empty');
    }
    if (!ALLOWED_NOTE_TYPES.has(type)) {
        throw new Error('Invalid note type');
    }

    const { error } = await supabase
        .from('timeline_notes')
        .insert({
            event_id: eventId,
            content: normalizedContent,
            type
        });

    if (error) {
        console.error('Error adding note:', error);
        throw new Error('Failed to add attached note');
    }

    revalidatePath('/');
}

export async function addTask(title: string, priority: string = 'MEDIUM', isNow: boolean = true) {
    const { supabase, userId } = await getAuthenticatedUserId();
    const normalizedTitle = normalizeTaskTitle(title);
    const normalizedPriority = priority.toUpperCase();

    if (!ALLOWED_PRIORITIES.has(normalizedPriority)) {
        throw new Error('Invalid task priority');
    }

    const { error } = await supabase
        .from('tasks')
        .insert({
            owner_id: userId,
            title: normalizedTitle,
            status: 'TODO',
            priority: normalizedPriority,
            is_now: isNow
        });

    if (error) {
        console.error('Error inserting task:', error);
        throw new Error('Failed to create task');
    }

    revalidatePath('/');
}

export async function addTaskFromForm(formData: FormData) {
    const title = String(formData.get('title') ?? '');
    const priority = String(formData.get('priority') ?? 'MEDIUM');
    const isNowValue = String(formData.get('isNow') ?? 'false');
    const isNow = isNowValue === 'true';

    await addTask(title, priority, isNow);
}

export async function setNowTask(taskId: string | FormData) {
    if (taskId instanceof FormData) {
        taskId = String(taskId.get('taskId') ?? '');
    }

    const { supabase, userId } = await getAuthenticatedUserId();

    const { error: clearError } = await supabase
        .from('tasks')
        .update({ is_now: false })
        .eq('owner_id', userId)
        .eq('is_now', true);

    if (clearError) {
        console.error('Error clearing existing NOW task:', clearError);
        throw new Error('Failed to update NOW task');
    }

    const { error: setError } = await supabase
        .from('tasks')
        .update({ is_now: true, status: 'IN_PROGRESS' })
        .eq('id', taskId)
        .eq('owner_id', userId);

    if (setError) {
        console.error('Error setting NOW task:', setError);
        throw new Error('Failed to set NOW task');
    }

    revalidatePath('/');
}

export async function completeTask(taskId: string | FormData) {
    if (taskId instanceof FormData) {
        taskId = String(taskId.get('taskId') ?? '');
    }

    const { supabase, userId } = await getAuthenticatedUserId();

    const { error } = await supabase
        .from('tasks')
        .update({ status: 'DONE', is_now: false })
        .eq('id', taskId)
        .eq('owner_id', userId);

    if (error) {
        console.error('Error completing task:', error);
        throw new Error('Failed to complete task');
    }

    revalidatePath('/');
}

export async function moveTaskToDeck(taskId: string | FormData) {
    if (taskId instanceof FormData) {
        taskId = String(taskId.get('taskId') ?? '');
    }

    const { supabase, userId } = await getAuthenticatedUserId();

    const { error } = await supabase
        .from('tasks')
        .update({ is_now: false, status: 'TODO' })
        .eq('id', taskId)
        .eq('owner_id', userId);

    if (error) {
        console.error('Error moving task to deck:', error);
        throw new Error('Failed to move task to deck');
    }

    revalidatePath('/');
}

function normalizeProvider(input: string): 'GOOGLE' | 'WEBCAL' {
    const provider = input.trim().toUpperCase();
    if (!ALLOWED_CALENDAR_PROVIDERS.has(provider)) {
        throw new Error('Invalid calendar provider');
    }
    return provider as 'GOOGLE' | 'WEBCAL';
}

function normalizeOptionalLabel(input: FormDataEntryValue | null): string | null {
    if (typeof input !== 'string') {
        return null;
    }
    const value = input.trim();
    return value.length > 0 ? value.slice(0, 160) : null;
}

function normalizeWebcalUrl(input: FormDataEntryValue | null): string | null {
    if (typeof input !== 'string') {
        return null;
    }

    const raw = input.trim();
    if (!raw) {
        return null;
    }

    const normalizedRaw = raw.startsWith('webcal://') ? raw.replace(/^webcal:\/\//, 'https://') : raw;

    try {
        const parsed = new URL(normalizedRaw);
        if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
            return null;
        }
        return parsed.toString();
    } catch {
        return null;
    }
}

async function upsertCalendarConnection(
    provider: 'GOOGLE' | 'WEBCAL',
    updates: {
        status?: 'CONNECTED' | 'DISCONNECTED';
        account_label?: string | null;
        webcal_url?: string | null;
        selected_calendar_ids?: string[];
        sync_enabled?: boolean;
        access_token?: string | null;
        refresh_token?: string | null;
        token_expires_at?: string | null;
        last_synced_at?: string | null;
        last_sync_error?: string | null;
    }
) {
    const { supabase, userId } = await getAuthenticatedUserId();

    const { error } = await supabase
        .from('calendar_connections')
        .upsert(
            {
                owner_id: userId,
                provider,
                ...updates,
            },
            { onConflict: 'owner_id,provider' }
        );

    if (error) {
        console.error('Error upserting calendar connection:', error);
        throw new Error('Failed to update calendar connection');
    }

    revalidatePath('/');
    revalidatePath('/settings');
}

export async function connectGoogleCalendar(formData: FormData) {
    const accountLabel = normalizeOptionalLabel(formData.get('accountLabel')) ?? 'Google Account';

    await upsertCalendarConnection('GOOGLE', {
        status: 'CONNECTED',
        account_label: accountLabel,
        sync_enabled: true,
        last_sync_error: null,
    });
}

export async function disconnectCalendar(formData: FormData) {
    const provider = normalizeProvider(String(formData.get('provider') ?? ''));

    await upsertCalendarConnection(provider, {
        status: 'DISCONNECTED',
        sync_enabled: false,
        webcal_url: null,
        selected_calendar_ids: [],
        access_token: null,
        refresh_token: null,
        token_expires_at: null,
    });
}

function normalizeCalendarIdSelections(input: FormDataEntryValue | null): string[] {
    if (typeof input !== 'string') {
        return [];
    }

    return input
        .split('\n')
        .map((id) => id.trim())
        .filter((id, index, array) => id.length > 0 && array.indexOf(id) === index)
        .slice(0, 100);
}

export async function saveGoogleCalendarSelection(formData: FormData) {
    const selectedCalendarIds = normalizeCalendarIdSelections(formData.get('selectedCalendarIds'));

    await upsertCalendarConnection('GOOGLE', {
        selected_calendar_ids: selectedCalendarIds,
    });
}

export async function saveWebcalFeed(formData: FormData) {
    const webcalUrl = normalizeWebcalUrl(formData.get('webcalUrl'));
    if (!webcalUrl) {
        throw new Error('Invalid WebCal URL');
    }

    const accountLabel = normalizeOptionalLabel(formData.get('accountLabel')) ?? 'WebCal Feed';

    await upsertCalendarConnection('WEBCAL', {
        status: 'CONNECTED',
        account_label: accountLabel,
        webcal_url: webcalUrl,
        sync_enabled: true,
        last_sync_error: null,
    });
}

export async function setCalendarSyncEnabled(formData: FormData) {
    const provider = normalizeProvider(String(formData.get('provider') ?? ''));
    const enabled = String(formData.get('enabled') ?? 'false') === 'true';

    await upsertCalendarConnection(provider, {
        sync_enabled: enabled,
    });
}

export async function syncCalendarProvider(formData: FormData) {
    const provider = normalizeProvider(String(formData.get('provider') ?? ''));
    await syncProviderForCurrentUser(provider);
    revalidatePath('/');
    revalidatePath('/settings');
}
