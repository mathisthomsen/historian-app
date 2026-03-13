import { type Prisma } from "@prisma/client";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireUser } from "@/lib/auth-guard";
import { cache } from "@/lib/cache";
import { db, prisma } from "@/lib/db";
import { sanitize } from "@/lib/sanitize";

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
  search: z.string().optional(),
  reliability: z.string().optional(),
  type: z.string().optional(),
  sort: z.enum(["title", "author", "created_at"]).default("created_at"),
  order: z.enum(["asc", "desc"]).default("desc"),
  projectId: z.string().optional(),
});

const createSourceSchema = z.object({
  project_id: z.string().min(1),
  title: z.string().min(1),
  type: z.string().min(1),
  author: z.string().optional().nullable(),
  date: z.string().optional().nullable(),
  repository: z.string().optional().nullable(),
  call_number: z.string().optional().nullable(),
  url: z
    .union([z.string().url(), z.literal(""), z.null()])
    .optional()
    .transform((v) => (v === "" ? null : (v ?? null))),
  reliability: z.enum(["HIGH", "MEDIUM", "LOW", "UNKNOWN"]).optional(),
  notes: z.string().optional().nullable(),
});

function buildSourceSummary(source: {
  id: string;
  title: string;
  type: string;
  author: string | null;
  reliability: string;
  created_at: Date;
}) {
  return {
    id: source.id,
    title: source.title,
    type: source.type,
    author: source.author,
    reliability: source.reliability as "HIGH" | "MEDIUM" | "LOW" | "UNKNOWN",
    created_at: source.created_at.toISOString(),
  };
}

export async function GET(request: NextRequest) {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }

  const { searchParams } = request.nextUrl;
  const parsed = listQuerySchema.safeParse(Object.fromEntries(searchParams));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid query params", details: parsed.error.flatten() },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const { page, pageSize, search, sort, order } = parsed.data;
  const projectId = parsed.data.projectId ?? user.projectId;
  if (!projectId) {
    return NextResponse.json(
      { error: "No project" },
      { status: 403, headers: { "Cache-Control": "no-store" } },
    );
  }

  const reliabilityValues = parsed.data.reliability
    ? parsed.data.reliability.split(",").filter(Boolean)
    : [];
  const typeFilter = parsed.data.type;

  const cacheKey = `source-list:${projectId}:${page}:${pageSize}:${search ?? ""}:${sort}:${order}:${reliabilityValues.join(",")}:${encodeURIComponent(typeFilter ?? "")}`;
  const cached = await cache.get(cacheKey);
  if (cached) {
    return NextResponse.json(cached, { status: 200, headers: { "Cache-Control": "no-store" } });
  }

  const where: Prisma.SourceWhereInput = {
    project_id: projectId,
  };

  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { author: { contains: search, mode: "insensitive" } },
    ];
  }

  if (reliabilityValues.length > 0) {
    where.reliability = { in: reliabilityValues as ("HIGH" | "MEDIUM" | "LOW" | "UNKNOWN")[] };
  }

  if (typeFilter) {
    where.type = { equals: typeFilter, mode: "insensitive" };
  }

  const [sources, total] = await Promise.all([
    db.source.findMany({
      where,
      orderBy: { [sort]: order },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.source.count({ where: { ...where, deleted_at: null } }),
  ]);

  const body = {
    data: sources.map(buildSourceSummary),
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  };

  await cache.set(cacheKey, body, 60);

  return NextResponse.json(body, { status: 200, headers: { "Cache-Control": "no-store" } });
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

  const parsed = createSourceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const data = parsed.data;

  const membership = await prisma.userProject.findFirst({
    where: { user_id: user.id, project_id: data.project_id, role: { in: ["OWNER", "EDITOR"] } },
  });
  if (!membership) {
    return NextResponse.json(
      { error: "Forbidden" },
      { status: 403, headers: { "Cache-Control": "no-store" } },
    );
  }

  const source = await prisma.source.create({
    data: {
      project_id: data.project_id,
      created_by_id: user.id,
      title: sanitize(data.title),
      type: sanitize(data.type),
      author: data.author ? sanitize(data.author) : null,
      date: data.date ? sanitize(data.date) : null,
      repository: data.repository ? sanitize(data.repository) : null,
      call_number: data.call_number ? sanitize(data.call_number) : null,
      url: data.url ?? null,
      reliability: data.reliability ?? "UNKNOWN",
      notes: data.notes ? sanitize(data.notes) : null,
    },
    include: {
      _count: {
        select: {
          relation_evidence: true,
          property_evidence: true,
        },
      },
    },
  });

  await cache.invalidateByPrefix(`source-list:${data.project_id}:`);

  const responseBody = {
    id: source.id,
    title: source.title,
    type: source.type,
    author: source.author,
    date: source.date,
    repository: source.repository,
    call_number: source.call_number,
    url: source.url,
    reliability: source.reliability as "HIGH" | "MEDIUM" | "LOW" | "UNKNOWN",
    notes: source.notes,
    created_by_id: source.created_by_id,
    created_at: source.created_at.toISOString(),
    updated_at: source.updated_at.toISOString(),
    _count: {
      relation_evidence: source._count.relation_evidence,
      property_evidence: source._count.property_evidence,
    },
  };

  return NextResponse.json(responseBody, { status: 201, headers: { "Cache-Control": "no-store" } });
}
