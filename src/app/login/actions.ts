'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';

function getStringField(formData: FormData, key: string): string {
    const value = formData.get(key);
    return typeof value === 'string' ? value.trim() : '';
}

function isSignupEnabled(): boolean {
    return process.env.ENABLE_SIGNUP === 'true';
}

export async function login(formData: FormData) {
    const supabase = await createClient();
    const email = getStringField(formData, 'email').toLowerCase();
    const password = getStringField(formData, 'password');

    if (!email || !password) {
        redirect('/login?error=Email and password are required');
    }

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
    if (!isSignupEnabled()) {
        redirect('/login?error=Registration is disabled. Contact the system owner.');
    }

    const email = getStringField(formData, 'email').toLowerCase();
    const password = getStringField(formData, 'password');
    const signupSecret = getStringField(formData, 'signupSecret');

    // STRICT ACCESS CONTROL: Only allow the predefined owner email to register.
    const allowedEmail = process.env.OWNER_EMAIL?.toLowerCase();
    const expectedSignupSecret = process.env.OWNER_SIGNUP_SECRET;

    if (!email || !password) {
        redirect('/login?error=Email and password are required');
    }

    if (!allowedEmail || email !== allowedEmail) {
        redirect('/login?error=Registration is currently restricted to the system owner.');
    }

    if (expectedSignupSecret && signupSecret !== expectedSignupSecret) {
        redirect('/login?error=Invalid registration access code');
    }

    const supabase = await createClient();

    const { data, error } = await supabase.auth.signUp({
        email,
        password,
    });

    if (error) {
        redirect('/login?error=Could not create account');
    }

    const user = data.user;

    if (!user) {
        redirect('/login?error=Account created. Please verify your email before signing in.');
    }

    // If your Supabase project requires email verification, there is no active session yet.
    // In that case we stop here and ask the user to verify before first sign-in.
    if (!data.session) {
        redirect('/login?error=Account created. Check your inbox to verify email, then sign in.');
    }

    const { error: profileError } = await supabase.from('profiles').insert({
        id: user.id,
        email: user.email,
    });

    if (profileError) {
        console.error('Profile creation failed during signup provisioning', profileError);
        redirect('/login?error=Account created but profile provisioning failed. Contact administrator.');
    }

    const { error: taskError } = await supabase.from('tasks').insert({
        owner_id: user.id,
        title: 'Welcome to FlowState\nExplore the dashboard features',
        status: 'TODO',
        priority: 'HIGH',
        is_now: true
    });

    if (taskError) {
        console.error('Default task creation failed during signup provisioning', taskError);
        redirect('/login?error=Account created but starter task provisioning failed. Contact administrator.');
    }

    revalidatePath('/', 'layout');
    redirect('/');
}
