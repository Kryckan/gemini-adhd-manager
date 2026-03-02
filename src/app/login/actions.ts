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
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    // STRICT ACCESS CONTROL: Only allow the predefined owner email to register.
    const allowedEmail = process.env.OWNER_EMAIL;

    if (!allowedEmail || email.toLowerCase() !== allowedEmail.toLowerCase()) {
        redirect('/login?error=Registration is currently restricted to the system owner.');
    }

    const supabase = await createClient();

    const { error } = await supabase.auth.signUp({
        email,
        password,
    });

    if (error) {
        redirect('/login?error=Could not create account');
    }

    // After signup, we also want to create the user's profile
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        const { error: profileError } = await supabase.from('profiles').insert({
            id: user.id,
            email: user.email,
        });

        if (profileError) {
            console.error('Silent failure: Profile creation failed', profileError);
            redirect('/login?error=Account created but failed to provision database profile. Contact administrator.');
        }

        // Create a dummy task for them
        const { error: taskError } = await supabase.from('tasks').insert({
            owner_id: user.id,
            title: 'Welcome to FlowState\nExplore the dashboard features',
            status: 'TODO',
            priority: 'HIGH',
            is_now: true
        });

        if (taskError) {
            console.error('Silent failure: Default task creation failed', taskError);
        }
    }

    revalidatePath('/', 'layout');
    redirect('/');
}
