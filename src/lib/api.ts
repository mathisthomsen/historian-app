import type { ProjectRole } from "@prisma/client";
import { NextResponse } from "next/server";
import type { z } from "zod";

import { prisma } from "./db";

/**
 * Shared helpers for API route handlers.
 *
 * Every data route repeated the same five blocks: the 401 guard, the
 * `Cache-Control: no-store` literal, the `Invalid JSON` try/catch, the Zod
 * validation payload, and the project-membership check (audit X-H-a). Centralising
 * them keeps the wire format identical while removing ~300 duplicated lines and
 * giving one place to evolve the error contract (audit A-H4).
 */

const NO_STORE = { "Cache-Control": "no-store" };

/** JSON response that is never cached. Use instead of `NextResponse.json`. */
export function json<T>(
  data: T,
  init?: { status?: number; headers?: Record<string, string> },
): NextResponse {
  return NextResponse.json(data, {
    status: init?.status ?? 200,
    headers: { ...NO_STORE, ...init?.headers },
  });
}

/** Pagination block shared by every list endpoint. */
export interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

/** The single list envelope: `{ data, pagination }`. */
export interface PaginatedBody<T> {
  data: T[];
  pagination: Pagination;
}

/**
 * Builds the one list envelope (audit A-H2).
 *
 * Three endpoints returned `{ data, pagination: {…} }` while relations and
 * activity returned a flat `{ data, total, page, pageSize }`. Clients coped
 * with defensive `Array.isArray(data) ? … : data.data` branches, which is a
 * sign the contract — not the client — was wrong.
 *
 * Standardising matters before Epic 5.1: the export format would otherwise
 * freeze both shapes permanently.
 */
export function paginated<T>(
  data: T[],
  init: { page: number; pageSize: number; total: number },
): PaginatedBody<T> {
  return {
    data,
    pagination: {
      page: init.page,
      pageSize: init.pageSize,
      total: init.total,
      totalPages: Math.ceil(init.total / init.pageSize),
    },
  };
}

/**
 * Machine-readable error codes (audit A-H4 / X-H-d).
 *
 * The `error` field previously carried three incompatible conventions at once —
 * prose ("Entity not found"), SCREAMING codes ("ENTITY_NOT_FOUND"), and i18n
 * keys ("auth.errors.tokenExpired") — and the same condition got different
 * codes in different families (`IN_USE` vs `TYPE_IN_USE`). Clients had no
 * reliable way to branch on a failure, so they either string-matched or gave up
 * and showed the raw value to the user.
 *
 * Codes are stable API surface: rename one and you break clients. Human copy
 * belongs in `messages/*.json`, keyed off the code — never in the response.
 */
export const ERROR_CODES = [
  // auth / access
  "UNAUTHORIZED",
  "FORBIDDEN",
  "NO_PROJECT",
  "RATE_LIMITED",
  "SERVICE_UNAVAILABLE",
  // request shape
  "INVALID_JSON",
  "VALIDATION_FAILED",
  "INVALID_QUERY_PARAMS",
  // resource
  "NOT_FOUND",
  "ENTITY_NOT_FOUND",
  // conflicts
  "IN_USE",
  "IN_USE_BY_DELETED",
  "DUPLICATE_NAME",
  "DUPLICATE_EVIDENCE",
  "HAS_SUB_EVENTS",
  // references / domain rules
  "INVALID_REFERENCE",
  "INVALID_FROM_TYPE",
  "INVALID_TO_TYPE",
  "INVALID_PROPERTY",
  "INVALID_ENTITY_TYPE",
  "DEPTH_LIMIT_EXCEEDED",
  // auth flows
  "TOKEN_EXPIRED",
  "TOKEN_INVALID",
  "EMAIL_TAKEN",
] as const;

export type ErrorCode = (typeof ERROR_CODES)[number];

/** The single error envelope every route emits. */
export interface ApiErrorBody {
  error: {
    code: ErrorCode;
    /** Developer-facing detail. Never rendered to users — clients key off `code`. */
    message?: string;
    /** Structured payload: Zod `flatten()`, conflict counts, filter URLs, … */
    details?: unknown;
  };
}

/** Error response in the unified `{ error: { code, message?, details? } }` envelope. */
export function jsonError(
  status: number,
  code: ErrorCode,
  init?: { message?: string; details?: unknown },
): NextResponse {
  const error: ApiErrorBody["error"] = { code };
  if (init?.message !== undefined) error.message = init.message;
  if (init?.details !== undefined) error.details = init.details;
  return json({ error }, { status });
}

export const unauthorized = (): NextResponse => jsonError(401, "UNAUTHORIZED");
export const forbidden = (): NextResponse => jsonError(403, "FORBIDDEN");
export const notFoundError = (code: ErrorCode = "NOT_FOUND", message?: string): NextResponse =>
  jsonError(404, code, message === undefined ? undefined : { message });

/**
 * Reads and JSON-parses a request body.
 *
 * Returns a discriminated union rather than throwing so callers keep a flat
 * control flow: `if (!parsed.ok) return parsed.response;`
 */
export async function parseJsonBody(
  request: Request,
): Promise<{ ok: true; data: unknown } | { ok: false; response: NextResponse }> {
  try {
    return { ok: true, data: (await request.json()) as unknown };
  } catch {
    return { ok: false, response: jsonError(400, "INVALID_JSON") };
  }
}

/**
 * Validates `body` against `schema`, emitting the standard 400 payload
 * (`{ error: { code: "VALIDATION_FAILED", details: flatten() } }`) on failure.
 */
export function validateBody<S extends z.ZodTypeAny>(
  schema: S,
  body: unknown,
): { ok: true; data: z.infer<S> } | { ok: false; response: NextResponse } {
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return {
      ok: false,
      response: jsonError(400, "VALIDATION_FAILED", { details: parsed.error.flatten() }),
    };
  }
  return { ok: true, data: parsed.data as z.infer<S> };
}

/**
 * True when `userId` belongs to `projectId`.
 *
 * `roles` narrows to write-capable membership. Omitting it checks read access.
 * Call this before any cache lookup — serving a cached response ahead of the
 * check is exactly how the C1 IDOR leaked cross-tenant data.
 */
export async function requireProjectMembership(
  userId: string,
  projectId: string,
  roles?: ProjectRole[],
): Promise<boolean> {
  const membership = await prisma.userProject.findFirst({
    where: {
      user_id: userId,
      project_id: projectId,
      ...(roles ? { role: { in: roles } } : {}),
    },
    select: { id: true },
  });
  return membership !== null;
}

/** Roles allowed to mutate project data. */
export const WRITE_ROLES: ProjectRole[] = ["OWNER", "EDITOR"];
