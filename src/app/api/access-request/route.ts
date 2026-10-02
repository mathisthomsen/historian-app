import type { NextResponse } from "next/server";
import { z } from "zod";

import { isExpired } from "@/lib/access-retention";
import { json, jsonError, parseJsonBody } from "@/lib/api";
import { prisma } from "@/lib/db";
import { sendAccessRequestNotification } from "@/lib/email";
import { checkRateLimit } from "@/lib/rate-limit";
import { sanitize } from "@/lib/sanitize";
import { anonymizeIp } from "@/lib/security";

const HOUR_MS = 60 * 60 * 1000;
/** A form submitted sooner than this after it mounted was not filled in by a person (§4.1 step 4). */
const MIN_FILL_TIME_MS = 2_000;

// The messages are i18n keys under `access.errors.*` (the register route's
// convention): the client maps them, the server never ships prose.
const accessRequestSchema = z.object({
  // Trim and lowercase BEFORE the format check, so a padded address is accepted
  // and stored the way the register route will later compare it.
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("access.errors.emailInvalid")
    .max(254, "access.errors.emailTooLong"),
  name: z
    .string()
    .trim()
    .min(1, "access.errors.nameRequired")
    .max(100, "access.errors.nameTooLong"),
  institution: z.string().trim().max(200, "access.errors.institutionTooLong").optional(),
  research_area: z.string().trim().max(200, "access.errors.researchAreaTooLong").optional(),
  tool_gap: z.string().trim().max(2000, "access.errors.toolGapTooLong").optional(),
  locale: z.enum(["de", "en"], { message: "access.errors.invalid" }),
  consent: z.literal(true, { message: "access.errors.consentRequired" }),
  // Deliberately NOT length-limited by Zod: a bot that fills the honeypot must
  // get the success body, not a field error naming the field to leave blank
  // (§4.1 step 4). Checked in code, below.
  company: z.string().optional(),
  rendered_at: z.number({ message: "access.errors.invalid" }),
});

/**
 * The one answer for every accepted case — trap, existing user, new request,
 * existing request (I5). A single helper so no branch can drift to a different
 * body, status or header.
 */
function accepted(): NextResponse {
  return json({ ok: true });
}

/** `P2002` on `access_requests.email` — the unique constraint's only non-id column (Q6). */
function isEmailConflict(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code: string }).code === "P2002"
  );
}

/** Sanitised, or `null` when absent or empty after sanitising. */
function cleanOptional(value: string | undefined): string | null {
  if (!value) return null;
  const clean = sanitize(value);
  return clean.trim() === "" ? null : clean;
}

/**
 * POST /api/access-request — public (spec §4.1). Nothing here may reveal
 * whether an address belongs to a user or to an earlier request: every
 * accepted case returns the same body (I5).
 */
export async function POST(request: Request): Promise<NextResponse> {
  const ipRaw =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "127.0.0.1";
  const ip = anonymizeIp(ipRaw);

  // Step 2 — both limiters run before the body is read or Prisma is touched (I4).
  // Every 429 is logged with the limiter's name and nothing else, so a spam
  // burst is visible without the log holding an address (Q9).
  const limiters = [
    { name: "ip", key: `access-request:${ip}`, limit: 3 },
    { name: "global", key: "access-request:global", limit: 30 },
  ] as const;
  for (const limiter of limiters) {
    const limited = await checkRateLimit(limiter.key, limiter.limit, HOUR_MS);
    if (limited) {
      if (limited.status === 429) {
        console.warn("[access-request] rate limited", { limiter: limiter.name });
      }
      return limited;
    }
  }

  // Step 3 — parse and validate.
  const parsedBody = await parseJsonBody(request);
  if (!parsedBody.ok) return parsedBody.response;

  const parsed = accessRequestSchema.safeParse(parsedBody.data);
  if (!parsed.success) {
    const fields: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0]?.toString() ?? "unknown";
      fields[field] ??= issue.message;
    }
    return jsonError(400, "VALIDATION_FAILED", { details: { fields } });
  }
  const data = parsed.data;

  // Step 4 — trap: a filled honeypot, or a form submitted faster than a person
  // can fill it (a `rendered_at` in the future also fails this). Same body as
  // success, nothing written, nothing sent.
  const now = new Date();
  if (
    (data.company !== undefined && data.company !== "") ||
    now.getTime() - data.rendered_at < MIN_FILL_TIME_MS
  ) {
    return accepted();
  }

  // Step 5 — an address that already has an account: same body, nothing written.
  const existingUser = await prisma.user.findUnique({
    where: { email: data.email },
    select: { id: true },
  });
  if (existingUser) return accepted();

  // Step 6 — every stranger-supplied text field is sanitised BEFORE it is
  // stored. The operator notification interpolates these into HTML text nodes
  // without escaping them (`email.ts`) and relies on exactly this.
  const name = sanitize(data.name);
  if (name.trim() === "") {
    // Markup only: nothing left to show an operator.
    return jsonError(400, "VALIDATION_FAILED", {
      details: { fields: { name: "access.errors.nameRequired" } },
    });
  }
  const fields = {
    name,
    institution: cleanOptional(data.institution),
    research_area: cleanOptional(data.research_area),
    tool_gap: cleanOptional(data.tool_gap),
    locale: data.locale,
    consent_at: now,
    ip_hash: ip,
  };

  // Step 7 — an expired row counts as absent (I6): delete it, then treat the
  // request as new.
  let existing = await prisma.accessRequest.findUnique({
    where: { email: data.email },
    include: { invites: { select: { used_at: true, expires_at: true } } },
  });
  if (existing && isExpired(existing, now)) {
    await prisma.accessRequest.deleteMany({ where: { id: existing.id } });
    existing = null;
  }

  let notifyId: string | null = null;
  let statusChangedAt = now;

  if (!existing) {
    try {
      const row = await prisma.accessRequest.create({
        data: { email: data.email, status: "PENDING", ...fields },
      });
      notifyId = row.id;
      statusChangedAt = row.status_changed_at;
    } catch (err) {
      // Two first requests for one new email raced on the unique column: the
      // other one won and notified. Treat this as an existing PENDING row —
      // uniform 200, and no second notification (Q6).
      if (!isEmailConflict(err)) throw err;
    }
  } else if (existing.status === "PENDING") {
    // A field update. `status_changed_at` is the retention clock and moves only
    // on a status change, so resubmitting does not extend the row's life (I6).
    await prisma.accessRequest.update({ where: { id: existing.id }, data: fields });
  } else if (existing.status === "INVITED" && existing.invites.some((i) => isLive(i, now))) {
    // A live invite is already out: change nothing.
  } else {
    // DECLINED, or INVITED with no live invite. The second is unreachable
    // through `isExpired` above (an INVITED row with no live invite counts as
    // expired and was deleted), and is kept as a defensive branch so that if
    // that definition ever changes the request is re-opened rather than
    // silently ignored.
    await prisma.accessRequest.update({
      where: { id: existing.id },
      data: {
        ...fields,
        status: "PENDING",
        status_changed_at: now,
        reviewed_at: null,
        reviewed_by_id: null,
      },
    });
    notifyId = existing.id;
  }

  // Step 8 — a notification failure is logged (request id only, no PII) and
  // does not change the response (I12).
  if (notifyId !== null) {
    try {
      await sendAccessRequestNotification({
        requestId: notifyId,
        name: fields.name,
        email: data.email,
        institution: fields.institution,
        researchArea: fields.research_area,
        toolGap: fields.tool_gap,
        locale: fields.locale,
        statusChangedAt,
      });
    } catch {
      console.error("[access-request] notification failed", { requestId: notifyId });
    }
  }

  return accepted();
}

/** An invite is live when it is unused and expires strictly in the future (I3). */
function isLive(invite: { used_at: Date | null; expires_at: Date }, now: Date): boolean {
  return invite.used_at === null && invite.expires_at.getTime() > now.getTime();
}
