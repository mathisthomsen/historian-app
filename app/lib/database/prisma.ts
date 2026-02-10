import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Ensure we have the correct database URLs
const databaseUrl = process.env.DATABASE_URL;
const databaseUrlUnpooled = process.env.DATABASE_URL_UNPOOLED;

if (!databaseUrl) {
  throw new Error('DATABASE_URL environment variable is not set');
}

if (!databaseUrlUnpooled) {
  throw new Error('DATABASE_URL_UNPOOLED environment variable is not set');
}

// Log the database URL format for debugging (only in development)
if (process.env.NODE_ENV === 'development') {
  console.log('Database URL format:', databaseUrl.substring(0, 20) + '...');
  console.log('Database URL Unpooled format:', databaseUrlUnpooled.substring(0, 20) + '...');
}

// Create Prisma client with explicit configuration
const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: databaseUrl,
    },
  },
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma 