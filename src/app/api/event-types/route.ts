import { type Prisma } from "@prisma/client";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireUser } from "@/lib/auth-guard";
import { prisma } from "@/lib/db";
import { sanitize } from "@/lib/sanitize";

const COLOR_PALETTE = [
  "#dc2626",
  "#ea580c",
  "#d97706",
  "#ca8a04",
  "#16a34a",
  "#0d9488",
  "#0891b2",
  "#2563eb",
  "#4338ca",
  "#7c3aed",
  "#db2777",
  "#4b5563",
] as const;

const createEventTypeSchema = z.object({
  name: z.string().min(1),
  color: z.enum(COLOR_PALETTE).optional().nullable(),
  icon: z.string().optional().nullable(),
  project_id: z.string().min(1),
});

export async function GET(request: NextRequest) {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }

  const { searchParams } = request.nextUrl;
  const projectId = searchParams.get("projectId") ?? user.projectId;
  if (!projectId) {
    return NextResponse.json(
      { error: "No project" },
      { status: 403, headers: { "Cache-Control": "no-store" } },
    );
  }

  // Check project membership
  const membership = await prisma.userProject.findFirst({
    where: { user_id: user.id, project_id: projectId },
  });
  if (!membership) {
    return NextResponse.json(
      { error: "Forbidden" },
      { status: 403, headers: { "Cache-Control": "no-store" } },
    );
  }

  const eventTypes = await prisma.eventType.findMany({
    where: { project_id: projectId },
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: { events: { where: { deleted_at: null } } },
      },
    },
  });

  const data = eventTypes.map((et) => ({
    id: et.id,
    name: et.name,
    color: et.color,
    icon: et.icon,
    event_count: et._count.events,
  }));

  return NextResponse.json({ data }, { status: 200, headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: NextRequest) {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON" },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const parsed = createEventTypeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const data = parsed.data;

  // Verify user is a member of the project with OWNER/EDITOR role
  const membership = await prisma.userProject.findFirst({
    where: { user_id: user.id, project_id: data.project_id, role: { in: ["OWNER", "EDITOR"] } },
  });
  if (!membership) {
    return NextResponse.json(
      { error: "Forbidden" },
      { status: 403, headers: { "Cache-Control": "no-store" } },
    );
  }

  let eventType: Prisma.EventTypeGetPayload<Record<string, never>>;
  try {
    eventType = await prisma.eventType.create({
      data: {
        project_id: data.project_id,
        name: sanitize(data.name),
        color: data.color ?? null,
        icon: data.icon ? sanitize(data.icon) : null,
      },
    });
  } catch (err) {
    // Handle @@unique([project_id, name]) violation
    if (
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      (err as { code: string }).code === "P2002"
    ) {
      return NextResponse.json(
        { error: "DUPLICATE_NAME" },
        { status: 409, headers: { "Cache-Control": "no-store" } },
      );
    }
    throw err;
  }

  return NextResponse.json(
    {
      id: eventType.id,
      name: eventType.name,
      color: eventType.color,
      icon: eventType.icon,
      event_count: 0,
    },
    { status: 201, headers: { "Cache-Control": "no-store" } },
  );
}
