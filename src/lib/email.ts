import { Resend, type CreateEmailOptions } from "resend";

import { pendingDeadline } from "@/lib/access-retention";
import { env } from "@/lib/env";
import { html, joinHtml } from "@/lib/html";
import { operatorEmails } from "@/lib/operators";

const EMAIL_SEND_TIMEOUT_MS = 5_000;

let resend: Resend | undefined;

function getResend(): Resend {
  resend ??= new Resend(env.RESEND_API_KEY);
  return resend;
}

function assertStubIsSafe(): void {
  const hostname = new URL(env.AUTH_URL).hostname;
  const isLocalhost = hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]";

  if (process.env.VERCEL || !isLocalhost) {
    throw new Error("The email transport stub is only permitted for local development.");
  }
}

/**
 * The send deadline elapsed. Unlike a provider error this is NOT a definite
 * failure: the provider request may still complete, so a caller must not treat
 * the mail as undelivered.
 */
export class EmailDeadlineError extends Error {
  constructor() {
    super("Email delivery request timed out.");
    this.name = "EmailDeadlineError";
  }
}

// Resend v4 does not expose an AbortSignal on emails.send. This bounds how long
// the caller waits; the provider request can still complete after the deadline.
async function withDeadline<T>(operation: Promise<T>): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<never>((_, reject) => {
    timeout = setTimeout(() => reject(new EmailDeadlineError()), EMAIL_SEND_TIMEOUT_MS);
  });

  try {
    return await Promise.race([operation, deadline]);
  } finally {
    if (timeout !== undefined) {
      clearTimeout(timeout);
    }
  }
}

async function sendEmail(message: CreateEmailOptions): Promise<void> {
  if (env.EMAIL_TRANSPORT === "stub") {
    assertStubIsSafe();
    return;
  }

  const result = await withDeadline(getResend().emails.send(message));
  if (result.error) {
    throw new Error(result.error.message);
  }
}

export async function sendVerificationEmail(params: {
  to: string;
  name: string;
  token: string;
  locale: string;
}): Promise<void> {
  const { to, name, token, locale } = params;
  const ctaUrl = `${env.AUTH_URL}/${locale}/auth/verify?token=${token}`;
  const isDE = locale === "de";

  const subject = isDE ? "Bestätigen Sie Ihre E-Mail-Adresse" : "Confirm your email address";
  const greeting = isDE ? `Hallo ${name},` : `Hello ${name},`;
  const body = isDE
    ? `bitte bestätigen Sie Ihre E-Mail-Adresse, indem Sie auf den folgenden Link klicken:`
    : `please confirm your email address by clicking the link below:`;
  const expiry = isDE ? "Dieser Link ist 24 Stunden gültig." : "This link is valid for 24 hours.";
  const btnLabel = isDE ? "E-Mail bestätigen" : "Confirm email";

  // Every interpolation is escaped by `html`. Prettier would re-indent the markup and
  // change the mail's whitespace, so it is told to leave the template alone.
  // prettier-ignore
  const htmlBody = html`<!DOCTYPE html><html><body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
<p>${greeting}</p>
<p>${body}</p>
<p><a href="${ctaUrl}" style="display:inline-block;padding:12px 24px;background:#4f46e5;color:#fff;text-decoration:none;border-radius:6px">${btnLabel}</a></p>
<p>${expiry}</p>
<p style="color:#888;font-size:12px">URL: ${ctaUrl}</p>
</body></html>`.toString();

  const text = `${greeting}\n\n${body}\n\n${ctaUrl}\n\n${expiry}`;

  await sendEmail({ from: env.RESEND_FROM_EMAIL, to, subject, html: htmlBody, text });
}

export async function sendPasswordResetEmail(params: {
  to: string;
  name: string;
  token: string;
  locale: string;
}): Promise<void> {
  const { to, name, token, locale } = params;
  const ctaUrl = `${env.AUTH_URL}/${locale}/auth/reset-password?token=${token}`;
  const isDE = locale === "de";

  const subject = isDE ? "Passwort zurücksetzen" : "Reset your password";
  const greeting = isDE ? `Hallo ${name},` : `Hello ${name},`;
  const body = isDE
    ? `klicken Sie auf den folgenden Link, um Ihr Passwort zurückzusetzen:`
    : `click the link below to reset your password:`;
  const expiry = isDE ? "Dieser Link ist 1 Stunde gültig." : "This link is valid for 1 hour.";
  const btnLabel = isDE ? "Passwort zurücksetzen" : "Reset password";

  // Every interpolation is escaped by `html`. Prettier would re-indent the markup and
  // change the mail's whitespace, so it is told to leave the template alone.
  // prettier-ignore
  const htmlBody = html`<!DOCTYPE html><html><body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
<p>${greeting}</p>
<p>${body}</p>
<p><a href="${ctaUrl}" style="display:inline-block;padding:12px 24px;background:#4f46e5;color:#fff;text-decoration:none;border-radius:6px">${btnLabel}</a></p>
<p>${expiry}</p>
<p style="color:#888;font-size:12px">URL: ${ctaUrl}</p>
</body></html>`.toString();

  const text = `${greeting}\n\n${body}\n\n${ctaUrl}\n\n${expiry}`;

  await sendEmail({ from: env.RESEND_FROM_EMAIL, to, subject, html: htmlBody, text });
}

const BERLIN_CLOCK = new Intl.DateTimeFormat("de-DE", {
  timeZone: "Europe/Berlin",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23", // "00:05", never "24:05"
});

/** Free text from a requester belongs on one line in a subject. */
function singleLine(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

/**
 * Operator notification about a new access request (spec §7.1). German only.
 *
 * `name`, `institution`, `researchArea` and `toolGap` come from a stranger.
 * Callers pass them RAW. The HTML part escapes every interpolation through
 * `html` (`src/lib/html.ts`), so the text is inert in text nodes and in
 * attributes alike (P8, see `email.test.ts`); the plain-text part and the
 * subject are not HTML and carry the text verbatim. Do not escape before
 * calling: that would show `&amp;` literally. See
 * `docs/specs/150-plain-text-storage/plan.md`.
 *
 * Rejects only when no operator could be reached at all; the caller treats a
 * rejection as non-fatal (§4.1 step 8).
 */
export async function sendAccessRequestNotification(params: {
  requestId: string;
  name: string;
  email: string;
  institution: string | null;
  researchArea: string | null;
  toolGap: string | null;
  locale: string;
  /** `status_changed_at` of the request — the retention clock's start (§4.6). */
  statusChangedAt: Date;
}): Promise<void> {
  const { requestId, name, email, institution, researchArea, toolGap, locale, statusChangedAt } =
    params;

  const operators = await operatorEmails();
  if (operators.length === 0) {
    console.error("[access-request] no operator to notify", { requestId });
    return;
  }

  const deadline = BERLIN_CLOCK.format(pendingDeadline(statusChangedAt));
  const ctaUrl = `${env.AUTH_URL}/de/admin/access-requests/${requestId}`;
  const subject = singleLine(`Neue Zugangsanfrage: ${name} — verfällt ${deadline}`);
  const signIn = "Falls Sie nicht angemeldet sind: erst anmelden, dann diesen Link erneut öffnen.";
  const intro = `Neue Zugangsanfrage. Sie verfällt um ${deadline} Uhr (Europe/Berlin), wenn sie bis dahin nicht entschieden ist.`;

  const fields: [label: string, value: string, multiline?: boolean][] = [
    ["Name", name],
    ["E-Mail", email],
  ];
  if (institution) fields.push(["Institution", institution]);
  if (researchArea) fields.push(["Forschungsgebiet", researchArea]);
  if (toolGap) fields.push(["Was das bisherige Werkzeug nicht beantwortet", toolGap, true]);
  fields.push(["Sprache", locale]);

  // prettier-ignore
  const rows = joinHtml(
    fields.map(([label, value, multiline]) =>
      html`<p style="margin:0 0 8px"><strong>${label}:</strong> ${multiline ? html`<span style="white-space:pre-wrap">${value}</span>` : value}</p>`),
    "\n",
  );

  // prettier-ignore
  const htmlBody = html`<!DOCTYPE html><html><body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
<p>${intro}</p>
${rows}
<p><a href="${ctaUrl}" style="display:inline-block;padding:12px 24px;background:#4f46e5;color:#fff;text-decoration:none;border-radius:6px">Anfrage ansehen</a></p>
<p>${signIn}</p>
<p style="color:#888;font-size:12px">URL: ${ctaUrl}</p>
</body></html>`.toString();

  const text = [
    intro,
    "",
    ...fields.map(([label, value]) => `${label}: ${value}`),
    "",
    ctaUrl,
    "",
    signIn,
  ].join("\n");

  const results = await Promise.allSettled(
    operators.map((to) =>
      sendEmail({ from: env.RESEND_FROM_EMAIL, to, subject, html: htmlBody, text }),
    ),
  );
  const failed = results.filter((r): r is PromiseRejectedResult => r.status === "rejected");

  if (failed.length === results.length) {
    throw failed[0]?.reason;
  }
  if (failed.length > 0) {
    console.error("[access-request] notification failed for some operators", {
      requestId,
      failed: failed.length,
      total: results.length,
    });
  }
}

/**
 * Invitation to register (spec §7.2), in the request's locale. `token` is the
 * raw invite token — it appears only in this link. `name` is passed raw; the
 * HTML part escapes it (see `sendAccessRequestNotification`).
 */
export async function sendInviteEmail(params: {
  to: string;
  name: string;
  token: string;
  locale: string;
}): Promise<void> {
  const { to, name, token } = params;
  const isDE = params.locale === "de";
  // Only the two supported locales ever reach the path.
  const ctaUrl = `${env.AUTH_URL}/${isDE ? "de" : "en"}/auth/register?invite=${encodeURIComponent(token)}`;

  const subject = isDE ? "Ihre Einladung zu Evidoxa" : "Your invitation to Evidoxa";
  const greeting = isDE ? `Hallo ${name},` : `Hello ${name},`;
  const body = isDE
    ? "Sie wurden zu Evidoxa eingeladen. Über den folgenden Link legen Sie Ihr Konto an:"
    : "you have been invited to Evidoxa. Use the link below to create your account:";
  const expiry = isDE
    ? "Die Einladung ist 14 Tage gültig. Sie gilt nur für diese E-Mail-Adresse; die Adresse kann nicht geändert werden."
    : "This invitation is valid for 14 days. It is bound to this email address, which cannot be changed.";
  const btnLabel = isDE ? "Konto anlegen" : "Create account";

  // Every interpolation is escaped by `html`. Prettier would re-indent the markup and
  // change the mail's whitespace, so it is told to leave the template alone.
  // prettier-ignore
  const htmlBody = html`<!DOCTYPE html><html><body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
<p>${greeting}</p>
<p>${body}</p>
<p><a href="${ctaUrl}" style="display:inline-block;padding:12px 24px;background:#4f46e5;color:#fff;text-decoration:none;border-radius:6px">${btnLabel}</a></p>
<p>${expiry}</p>
<p style="color:#888;font-size:12px">URL: ${ctaUrl}</p>
</body></html>`.toString();

  const text = `${greeting}\n\n${body}\n\n${ctaUrl}\n\n${expiry}`;

  await sendEmail({ from: env.RESEND_FROM_EMAIL, to, subject, html: htmlBody, text });
}

/**
 * Sent when someone submits the public access-request form with an address that
 * already has an account (#163). The submitter and the owner of the mailbox may
 * be different people, so the mail carries NO text from the form: not the name,
 * not any other field. It takes only the recipient and the locale on purpose.
 *
 * Links come from `AUTH_URL`. The caller throttles per recipient; this function
 * does not.
 */
export async function sendExistingAccountNotice(params: {
  to: string;
  locale: string;
}): Promise<void> {
  const { to } = params;
  const isDE = params.locale === "de";
  // Only the two supported locales ever reach the path.
  const loc = isDE ? "de" : "en";
  const loginUrl = `${env.AUTH_URL}/${loc}/auth/login`;
  const resetUrl = `${env.AUTH_URL}/${loc}/auth/forgot-password`;

  const subject = isDE
    ? "Ein Konto mit dieser E-Mail-Adresse existiert bereits"
    : "An account with this email address already exists";
  const body = isDE
    ? "Ein Konto mit dieser E-Mail-Adresse existiert bereits bei Evidoxa. Sie können sich direkt anmelden oder Ihr Passwort zurücksetzen, falls Sie es vergessen haben."
    : "An account with this email address already exists at Evidoxa. You can log in directly, or reset your password if you have forgotten it.";
  const loginLabel = isDE ? "Anmelden" : "Log in";
  const resetLabel = isDE ? "Passwort zurücksetzen" : "Reset password";
  const ignore = isDE
    ? "Falls Sie dies nicht angefragt haben, können Sie diese E-Mail ignorieren."
    : "If you did not request this, you can ignore this email.";

  // Every interpolation is escaped by `html`. Prettier would re-indent the markup and
  // change the mail's whitespace, so it is told to leave the template alone.
  // prettier-ignore
  const htmlBody = html`<!DOCTYPE html><html><body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
<p>${body}</p>
<p><a href="${loginUrl}" style="display:inline-block;padding:12px 24px;background:#4f46e5;color:#fff;text-decoration:none;border-radius:6px">${loginLabel}</a></p>
<p><a href="${resetUrl}">${resetLabel}</a></p>
<p>${ignore}</p>
<p style="color:#888;font-size:12px">URL: ${loginUrl}</p>
</body></html>`.toString();

  const text = `${body}\n\n${loginLabel}: ${loginUrl}\n${resetLabel}: ${resetUrl}\n\n${ignore}`;

  await sendEmail({ from: env.RESEND_FROM_EMAIL, to, subject, html: htmlBody, text });
}
