import { NextResponse } from "next/server";

import { cache } from "@/lib/cache";
import { getLatestMigration, ping } from "@/lib/db";
import { redis } from "@/lib/redis";

import pkg from "../../../../package.json";

const CACHE_TTL_SECONDS = 30;
const CACHE_KEY = "health";

interface HealthResponse {
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

export async function GET() {
  // Server-side cache: avoid hammering DB + Redis on every monitoring poll
  const cached = await cache.get<HealthResponse>(CACHE_KEY);
  if (cached) {
    return NextResponse.json(cached, {
      status: 200,
      headers: { "Cache-Control": "no-store" },
    });
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

  const body: HealthResponse = {
    status,
    version: pkg.version,
    db: { status: dbStatus, latencyMs: dbLatencyMs, migration },
    redis: { status: redisStatus, latencyMs: redisLatencyMs },
    timestamp: new Date().toISOString(),
  };

  // Cache for 30s server-side (HTTP header still says no-store)
  await cache.set(CACHE_KEY, body, CACHE_TTL_SECONDS);

  return NextResponse.json(body, {
    status: 200,
    headers: { "Cache-Control": "no-store" },
  });
}
