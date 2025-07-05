import { NextRequest, NextResponse } from 'next/server';
import { requireUser, getOrCreateLocalUser } from '../../../../lib/requireUser';
import prisma from '../../../../libs/prisma';

// Mendeley OAuth configuration
const MENDELEY_CLIENT_ID = process.env.MENDELEY_CLIENT_ID;
const MENDELEY_CLIENT_SECRET = process.env.MENDELEY_CLIENT_SECRET;
const MENDELEY_REDIRECT_URI = process.env.MENDELEY_REDIRECT_URI || 'http://localhost:3000/api/auth/mendeley/callback';

// GET /api/auth/mendeley/callback - Handle OAuth callback
export async function GET(request: NextRequest) {
  const workosUser = await requireUser();
  const user = await getOrCreateLocalUser(workosUser);

  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  // Check for OAuth errors
  if (error) {
    console.error('Mendeley OAuth error:', error);
    return NextResponse.redirect(new URL('/bibliography-sync?error=oauth_failed', request.url));
  }

  // Verify state parameter
  const storedState = request.cookies.get('mendeley_oauth_state')?.value;
  if (!state || !storedState || state !== storedState) {
    console.error('Invalid OAuth state parameter');
    return NextResponse.redirect(new URL('/bibliography-sync?error=invalid_state', request.url));
  }

  if (!code) {
    return NextResponse.redirect(new URL('/bibliography-sync?error=no_code', request.url));
  }

  try {
    // Exchange authorization code for access token
    const tokenResponse = await fetch('https://api.mendeley.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: MENDELEY_CLIENT_ID!,
        client_secret: MENDELEY_CLIENT_SECRET!,
        code: code,
        redirect_uri: MENDELEY_REDIRECT_URI,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Token exchange failed:', errorText);
      return NextResponse.redirect(new URL('/bibliography-sync?error=token_exchange_failed', request.url));
    }

    const tokenData = await tokenResponse.json();
    console.log('Token exchange successful, storing tokens...');
    
    // Store tokens in database
    await prisma.bibliographySync.upsert({
      where: { userId_service: { userId: user.id, service: 'Mendeley' } },
      update: {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        tokenExpiresAt: tokenData.expires_in ? new Date(Date.now() + tokenData.expires_in * 1000) : null,
        isActive: true,
      },
      create: {
        userId: user.id,
        service: 'Mendeley',
        name: 'Mendeley',
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        tokenExpiresAt: tokenData.expires_in ? new Date(Date.now() + tokenData.expires_in * 1000) : null,
        isActive: true,
      },
    });

    console.log('Tokens stored successfully');

    // Clear the OAuth state cookie
    const redirectResponse = NextResponse.redirect(new URL('/bibliography-sync?success=oauth_completed', request.url));
    redirectResponse.cookies.delete('mendeley_oauth_state');
    
    return redirectResponse;

  } catch (error) {
    console.error('Error processing Mendeley OAuth callback:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      user: user?.id,
      code: code ? 'present' : 'missing',
      state: state ? 'present' : 'missing'
    });
    return NextResponse.redirect(new URL('/bibliography-sync?error=callback_failed', request.url));
  }
}

console.log('DEBUG: Available Prisma models:', Object.keys(prisma)); 