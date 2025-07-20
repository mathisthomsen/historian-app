import { NextResponse } from 'next/server';

export async function GET() {
  const databaseUrl = process.env.DATABASE_URL;
  const databaseUrlUnpooled = process.env.DATABASE_URL_UNPOOLED;
  const hasDatabaseUrl = !!databaseUrl;
  const hasDatabaseUrlUnpooled = !!databaseUrlUnpooled;
  const databaseUrlStartsWithPostgres = databaseUrl?.startsWith('postgresql://');
  const databaseUrlUnpooledStartsWithPostgres = databaseUrlUnpooled?.startsWith('postgresql://');
  
  return NextResponse.json({
    hasDatabaseUrl,
    hasDatabaseUrlUnpooled,
    databaseUrlStartsWithPostgres,
    databaseUrlUnpooledStartsWithPostgres,
    databaseUrlPreview: databaseUrl ? `${databaseUrl.substring(0, 20)}...` : 'NOT SET',
    databaseUrlUnpooledPreview: databaseUrlUnpooled ? `${databaseUrlUnpooled.substring(0, 20)}...` : 'NOT SET',
    nodeEnv: process.env.NODE_ENV,
    allEnvVars: {
      DATABASE_URL: hasDatabaseUrl ? 'SET' : 'NOT SET',
      DATABASE_URL_UNPOOLED: hasDatabaseUrlUnpooled ? 'SET' : 'NOT SET',
      NEXTAUTH_URL: process.env.NEXTAUTH_URL ? 'SET' : 'NOT SET',
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? 'SET' : 'NOT SET',
      RESEND_API_KEY: process.env.RESEND_API_KEY ? 'SET' : 'NOT SET',
      EMAIL_FROM: process.env.EMAIL_FROM ? 'SET' : 'NOT SET',
      MENDELEY_CLIENT_ID: process.env.MENDELEY_CLIENT_ID ? 'SET' : 'NOT SET',
      MENDELEY_CLIENT_SECRET: process.env.MENDELEY_CLIENT_SECRET ? 'SET' : 'NOT SET',
    }
  });
} 