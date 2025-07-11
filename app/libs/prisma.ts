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

// Create Prisma client with minimal logging for faster dev builds
const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: ['error'],
  datasources: {
    db: {
      url: databaseUrl,
    },
  },
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma