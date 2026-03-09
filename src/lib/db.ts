import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

/**
 * Extended Prisma client with soft-delete filters.
 * findMany and findFirst on person, event, source, relation automatically
 * exclude records where deleted_at IS NOT NULL.
 *
 * findUnique, count, aggregate remain unfiltered by design
 * (admin restore must still see soft-deleted records).
 */
export const db = prisma.$extends({
  query: {
    person: {
      findMany({ args, query }) {
        args.where = { deleted_at: null, ...args.where };
        return query(args);
      },
      findFirst({ args, query }) {
        args.where = { deleted_at: null, ...args.where };
        return query(args);
      },
    },
    event: {
      findMany({ args, query }) {
        args.where = { deleted_at: null, ...args.where };
        return query(args);
      },
      findFirst({ args, query }) {
        args.where = { deleted_at: null, ...args.where };
        return query(args);
      },
    },
    source: {
      findMany({ args, query }) {
        args.where = { deleted_at: null, ...args.where };
        return query(args);
      },
      findFirst({ args, query }) {
        args.where = { deleted_at: null, ...args.where };
        return query(args);
      },
    },
    relation: {
      findMany({ args, query }) {
        args.where = { deleted_at: null, ...args.where };
        return query(args);
      },
      findFirst({ args, query }) {
        args.where = { deleted_at: null, ...args.where };
        return query(args);
      },
    },
  },
});

/** Measures DB round-trip latency. Returns latency_ms or throws on failure. */
export async function ping(): Promise<number> {
  const start = Date.now();
  await prisma.$queryRaw`SELECT 1`;
  return Date.now() - start;
}

/** Returns the name of the last successfully applied Prisma migration. */
export async function getLatestMigration(): Promise<string | null> {
  const rows = await prisma.$queryRaw<{ migration_name: string }[]>`
    SELECT migration_name
    FROM _prisma_migrations
    WHERE finished_at IS NOT NULL
    ORDER BY finished_at DESC
    LIMIT 1
  `;
  return rows[0]?.migration_name ?? null;
}
