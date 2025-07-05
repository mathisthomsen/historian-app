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
      WORKOS_API_KEY: process.env.WORKOS_API_KEY ? 'SET' : 'NOT SET',
      WORKOS_CLIENT_ID: process.env.WORKOS_CLIENT_ID ? 'SET' : 'NOT SET',
      WORKOS_REDIRECT_URI: process.env.WORKOS_REDIRECT_URI ? 'SET' : 'NOT SET',
      WORKOS_COOKIE_PASSWORD: process.env.WORKOS_COOKIE_PASSWORD ? 'SET' : 'NOT SET',
      AUTHKIT_REDIRECT_URI: process.env.AUTHKIT_REDIRECT_URI ? 'SET' : 'NOT SET',
    }
  });
} 