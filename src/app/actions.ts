'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

const ALLOWED_PRIORITIES = new Set(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);
const ALLOWED_NOTE_TYPES = new Set(['NOTE', 'TAG', 'LINK']);

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

export async function toggleTaskStatus(taskId: string, currentStatus: 'TODO' | 'DONE' | string) {
    const supabase = await createClient();

    const nextStatus = currentStatus === 'DONE' ? 'TODO' : 'DONE';

    const { error } = await supabase
        .from('tasks')
        .update({ status: nextStatus })
        .eq('id', taskId);

    if (error) {
        console.error('Error updating task:', error);
        throw new Error('Failed to update task');
    }

    // Revalidate the dashboard to instantly show the new data without a full page reload
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
    const supabase = await createClient();
    const normalizedTitle = normalizeTaskTitle(title);
    const normalizedPriority = priority.toUpperCase();

    if (!ALLOWED_PRIORITIES.has(normalizedPriority)) {
        throw new Error('Invalid task priority');
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized for task creation');

    const { error } = await supabase
        .from('tasks')
        .insert({
            owner_id: user.id,
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
