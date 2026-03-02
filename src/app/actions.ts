'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export async function toggleTaskStatus(taskId: string, currentStatus: string) {
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

    const { error } = await supabase
        .from('timeline_notes')
        .insert({
            event_id: eventId,
            content,
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

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized for task creation');

    const { error } = await supabase
        .from('tasks')
        .insert({
            owner_id: user.id,
            title,
            status: 'TODO',
            priority,
            is_now: isNow
        });

    if (error) {
        console.error('Error inserting task:', error);
        throw new Error('Failed to create task');
    }

    revalidatePath('/');
}
