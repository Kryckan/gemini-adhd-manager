import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

type GoogleTokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
};

type GoogleUserInfoResponse = {
  email?: string;
  name?: string;
};

function getGoogleConfig() {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error('Missing Google OAuth credentials');
  }
  return { clientId, clientSecret };
}

async function exchangeCodeForToken(code: string, redirectUri: string): Promise<GoogleTokenResponse> {
  const { clientId, clientSecret } = getGoogleConfig();
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error('Failed to exchange Google auth code');
  }

  return response.json() as Promise<GoogleTokenResponse>;
}

async function fetchGoogleUserInfo(accessToken: string): Promise<GoogleUserInfoResponse> {
  const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: 'no-store',
  });
  if (!response.ok) {
    return {};
  }
  return response.json() as Promise<GoogleUserInfoResponse>;
}

export async function GET(request: NextRequest) {
  const state = request.nextUrl.searchParams.get('state');
  const code = request.nextUrl.searchParams.get('code');
  const error = request.nextUrl.searchParams.get('error');
  const storedState = request.cookies.get('google_calendar_oauth_state')?.value;

  const redirectToSettings = (message?: string) => {
    const url = new URL('/settings', request.url);
    if (message) {
      url.searchParams.set('calendarMessage', message);
    }
    const response = NextResponse.redirect(url);
    response.cookies.delete('google_calendar_oauth_state');
    return response;
  };

  if (error) {
    return redirectToSettings('Google authorization was cancelled.');
  }
  if (!code || !state || !storedState || state !== storedState) {
    return redirectToSettings('Invalid Google authorization state. Please retry.');
  }

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.redirect(new URL('/login?error=Please sign in first.', request.url));
    }

    const callbackUrl = new URL('/api/calendar/google/callback', request.url);
    const token = await exchangeCodeForToken(code, callbackUrl.toString());
    const profile = await fetchGoogleUserInfo(token.access_token);

    const tokenExpiresAt = new Date(Date.now() + token.expires_in * 1000).toISOString();

    const { error: upsertError } = await supabase
      .from('calendar_connections')
      .upsert(
        {
          owner_id: user.id,
          provider: 'GOOGLE',
          status: 'CONNECTED',
          sync_enabled: true,
          account_label: profile.email ?? profile.name ?? 'Google Account',
          access_token: token.access_token,
          refresh_token: token.refresh_token ?? null,
          token_expires_at: tokenExpiresAt,
          last_sync_error: null,
        },
        { onConflict: 'owner_id,provider' },
      );

    if (upsertError) {
      throw new Error('Failed to persist Google connection');
    }

    return redirectToSettings('Google Calendar connected. You can sync now.');
  } catch {
    return redirectToSettings('Google connection failed. Check credentials and retry.');
  }
}
