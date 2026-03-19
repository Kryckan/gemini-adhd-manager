import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

function getGoogleClientId(): string {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  if (!clientId) {
    throw new Error('Missing GOOGLE_OAUTH_CLIENT_ID');
  }
  return clientId;
}

function randomState(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL('/login?error=Please sign in first.', request.url));
  }

  const state = randomState();
  const callbackUrl = new URL('/api/calendar/google/callback', request.url);

  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.set('client_id', getGoogleClientId());
  authUrl.searchParams.set('redirect_uri', callbackUrl.toString());
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', [
    'openid',
    'email',
    'https://www.googleapis.com/auth/calendar.readonly',
  ].join(' '));
  authUrl.searchParams.set('access_type', 'offline');
  authUrl.searchParams.set('prompt', 'consent');
  authUrl.searchParams.set('include_granted_scopes', 'true');
  authUrl.searchParams.set('state', state);

  const response = NextResponse.redirect(authUrl);
  response.cookies.set('google_calendar_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 10,
  });
  return response;
}
