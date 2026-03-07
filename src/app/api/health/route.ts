import { NextResponse } from "next/server";

import { getLatestMigration, ping } from "@/lib/db";

import pkg from "../../../../package.json";

export async function GET() {
  const app = {
    version: pkg.version,
    environment: process.env.NODE_ENV ?? "unknown",
  };

  try {
    const latency_ms = await ping();
    const migration_version = await getLatestMigration();

    return NextResponse.json(
      {
        status: "ok",
        db: { status: "ok", latency_ms, migration_version },
        app,
        timestamp: new Date().toISOString(),
      },
      { status: 200, headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      {
        status: "error",
        db: { status: "error", latency_ms: -1, migration_version: null },
        app,
        timestamp: new Date().toISOString(),
      },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
