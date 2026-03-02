'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';

export async function login(formData: FormData) {
    const supabase = await createClient();
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) {
        redirect('/login?error=Could not authenticate user');
    }

    revalidatePath('/', 'layout');
    redirect('/');
}

export async function signup(formData: FormData) {
    const supabase = await createClient();
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    const { error } = await supabase.auth.signUp({
        email,
        password,
    });

    if (error) {
        redirect('/login?error=Could not authenticate user');
    }

    // After signup, we also want to create the user's profile
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        await supabase.from('profiles').insert({
            id: user.id,
            email: user.email,
        });

        // Create a dummy task for them
        await supabase.from('tasks').insert({
            owner_id: user.id,
            title: 'Welcome to FlowState\nExplore the dashboard features',
            status: 'TODO',
            priority: 'HIGH',
            is_now: true
        });
    }

    revalidatePath('/', 'layout');
    redirect('/');
}
