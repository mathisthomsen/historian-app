import { NextRequest, NextResponse } from 'next/server';
import { WorkOS } from '@workos-inc/node';

const workos = new WorkOS(process.env.WORKOS_API_KEY!);
const clientId = process.env.WORKOS_CLIENT_ID!;
const redirectUri = process.env.WORKOS_REDIRECT_URI!;

export async function GET(request: NextRequest) {
  const authorizationUrl = workos.userManagement.getAuthorizationUrl({
    clientId,
    redirectUri,
    provider: 'GoogleOAuth',
  });
  return NextResponse.redirect(authorizationUrl);
} 