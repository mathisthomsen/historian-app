import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    DATABASE_URL: process.env.DATABASE_URL,
    PRISMA_DATABASE_URL: process.env.PRISMA_DATABASE_URL,
    DIRECT_URL: process.env.DIRECT_URL,
  });
}