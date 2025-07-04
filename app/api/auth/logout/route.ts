import { NextRequest, NextResponse } from 'next/server';
import { signOut } from '@workos-inc/authkit-nextjs';

export async function GET(request: NextRequest) {
  try {
    // Use AuthKit's signOut function - it will handle the redirect automatically
    await signOut();
  } catch (error: any) {
    // If signOut fails, redirect to our custom confirmation page
    console.error('Logout error:', error);
    return NextResponse.redirect(new URL('/auth/logout-confirmation', request.url));
  }
}

export async function POST(request: NextRequest) {
  try {
    // Use AuthKit's signOut function - it will handle the redirect automatically
    await signOut();
  } catch (error: any) {
    // If signOut fails, redirect to our custom confirmation page
    console.error('Logout error:', error);
    return NextResponse.redirect(new URL('/auth/logout-confirmation', request.url));
  }
} 