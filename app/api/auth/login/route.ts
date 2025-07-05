import { NextRequest, NextResponse } from 'next/server';
import { WorkOS } from '@workos-inc/node';

export async function GET(request: NextRequest) {
  // Check if required environment variables are available
  const apiKey = process.env.WORKOS_API_KEY;
  const clientId = process.env.WORKOS_CLIENT_ID;
  const redirectUri = process.env.WORKOS_REDIRECT_URI;

  if (!apiKey || !clientId || !redirectUri) {
    console.error('Missing WorkOS environment variables');
    return NextResponse.json(
      { error: 'Authentication service not configured' },
      { status: 500 }
    );
  }

  const workos = new WorkOS(apiKey);
  
  const authorizationUrl = workos.userManagement.getAuthorizationUrl({
    clientId,
    redirectUri,
    provider: 'authkit',
    screenHint: 'sign-in',
  });
  
  return NextResponse.redirect(authorizationUrl);
} 