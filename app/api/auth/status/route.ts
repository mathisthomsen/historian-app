import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '../../../lib/api-helpers';

export async function GET(request: NextRequest) {
  try {
    const { user, response } = await getAuthenticatedUser(request);

    if (!user) {
      return NextResponse.json({ 
        authenticated: false, 
        user: null 
      });
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        emailVerified: user.emailVerified
      }
    });
  } catch (error) {
    console.error('Auth status check error:', error);
    return NextResponse.json({ 
      authenticated: false, 
      user: null 
    });
  }
} 