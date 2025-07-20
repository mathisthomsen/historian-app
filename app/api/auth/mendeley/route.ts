import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '../../../lib/requireUser';

// Mendeley OAuth configuration
const MENDELEY_CLIENT_ID = process.env.MENDELEY_CLIENT_ID;
const MENDELEY_CLIENT_SECRET = process.env.MENDELEY_CLIENT_SECRET;
const MENDELEY_REDIRECT_URI = process.env.MENDELEY_REDIRECT_URI || 'http://localhost:3000/api/auth/mendeley/callback';

// GET /api/auth/mendeley - Generate authorization URL
export async function GET(request: NextRequest) {
  const user = await requireUser();

  if (!MENDELEY_CLIENT_ID) {
    return NextResponse.json({ error: 'Mendeley OAuth not configured' }, { status: 500 });
  }

  // Generate state parameter for security
  const state = Buffer.from(JSON.stringify({ userId: user.id, timestamp: Date.now() })).toString('base64');
  
  // Store state in session/cookie for verification
  const authUrl = new URL('https://api.mendeley.com/oauth/authorize');
  authUrl.searchParams.set('client_id', MENDELEY_CLIENT_ID);
  authUrl.searchParams.set('redirect_uri', MENDELEY_REDIRECT_URI);
  authUrl.searchParams.set('scope', 'all');
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('state', state);

  // Set state in cookie for verification
  const responseWithCookie = NextResponse.json({ 
    authUrl: authUrl.toString(),
    state 
  });
  
  responseWithCookie.cookies.set('mendeley_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600 // 10 minutes
  });

  return responseWithCookie;
} 