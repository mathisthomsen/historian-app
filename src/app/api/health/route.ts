import { NextResponse } from "next/server";

import { cache } from "@/lib/cache";
import { getLatestMigration, ping } from "@/lib/db";
import { redis } from "@/lib/redis";

import pkg from "../../../../package.json";

const CACHE_TTL_SECONDS = 30;
const CACHE_KEY = "health";

// What is stored in the shared Redis cache. Deliberately has no `commit`: Redis
// is shared across deployments, so anything cached here is served by whichever
// deployment reads it next, including an older one.
interface CachedHealth {
  status: "ok" | "degraded" | "error";
  version: string;
  db: {
    status: "ok" | "error";
    latencyMs: number;
    migration: string | null;
  };
  redis: {
    status: "ok" | "error";
    latencyMs: number;
  };
  timestamp: string;
}

// What is returned to the caller: the cached body plus the commit that THIS
// deployment was built from. It is attached after the cache read, on both
// paths, so it always describes the instance answering the request. CI's live
// check (.github/workflows/ci.yml) relies on that to prove the public domain
// serves the commit it just deployed.
interface HealthResponse extends CachedHealth {
  commit: string | null;
}

// APP_COMMIT_SHA is passed explicitly by CI (`vercel deploy --env`); the Vercel
// system variable is a fallback. Read per request, not at module load.
function currentCommit(): string | null {
  return process.env.APP_COMMIT_SHA ?? process.env.VERCEL_GIT_COMMIT_SHA ?? null;
}

function respond(body: CachedHealth) {
  const response: HealthResponse = { ...body, commit: currentCommit() };
  return NextResponse.json(response, {
    status: 200,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function GET() {
  // Server-side cache: avoid hammering DB + Redis on every monitoring poll
  const cached = await cache.get<CachedHealth>(CACHE_KEY);
  if (cached) {
    return respond(cached);
  }

  // DB check
  let dbStatus: "ok" | "error" = "error";
  let dbLatencyMs = -1;
  let migration: string | null = null;

  try {
    dbLatencyMs = await ping();
    migration = await getLatestMigration();
    dbStatus = "ok";
  } catch {}

  // Redis check
  const redisStart = Date.now();
  let redisStatus: "ok" | "error" = "error";
  try {
    const pong = await redis.ping();
    if (pong === "PONG") redisStatus = "ok";
  } catch {}
  const redisLatencyMs = Date.now() - redisStart;

  // Derive overall status
  let status: "ok" | "degraded" | "error";
  if (dbStatus === "ok" && redisStatus === "ok") {
    status = "ok";
  } else if (dbStatus === "error" && redisStatus === "error") {
    status = "error";
  } else {
    status = "degraded";
  }

  const body: CachedHealth = {
    status,
    version: pkg.version,
    db: { status: dbStatus, latencyMs: dbLatencyMs, migration },
    redis: { status: redisStatus, latencyMs: redisLatencyMs },
    timestamp: new Date().toISOString(),
  };

  // Cache for 30s server-side (HTTP header still says no-store)
  await cache.set(CACHE_KEY, body, CACHE_TTL_SECONDS);

  return respond(body);
}
