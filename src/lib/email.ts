import { Resend } from "resend";

import { env } from "@/lib/env";

const resend = new Resend(env.RESEND_API_KEY);

export async function sendVerificationEmail(params: {
  to: string;
  name: string;
  token: string;
  locale: string;
}): Promise<void> {
  const { to, name, token, locale } = params;
  const ctaUrl = `${env.AUTH_URL}/${locale}/auth/verify?token=${token}`;
  const isDE = locale === "de";

  const subject = isDE ? "Bestätige deine E-Mail-Adresse" : "Confirm your email address";
  const greeting = isDE ? `Hallo ${name},` : `Hello ${name},`;
  const body = isDE
    ? `bitte bestätige deine E-Mail-Adresse, indem du auf den folgenden Link klickst:`
    : `please confirm your email address by clicking the link below:`;
  const expiry = isDE ? "Dieser Link ist 24 Stunden gültig." : "This link is valid for 24 hours.";
  const btnLabel = isDE ? "E-Mail bestätigen" : "Confirm email";

  const html = `<!DOCTYPE html><html><body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
<p>${greeting}</p>
<p>${body}</p>
<p><a href="${ctaUrl}" style="display:inline-block;padding:12px 24px;background:#4f46e5;color:#fff;text-decoration:none;border-radius:6px">${btnLabel}</a></p>
<p>${expiry}</p>
<p style="color:#888;font-size:12px">URL: ${ctaUrl}</p>
</body></html>`;

  const text = `${greeting}\n\n${body}\n\n${ctaUrl}\n\n${expiry}`;

  await resend.emails.send({ from: env.RESEND_FROM_EMAIL, to, subject, html, text });
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
    ? `klicke auf den folgenden Link, um dein Passwort zurückzusetzen:`
    : `click the link below to reset your password:`;
  const expiry = isDE ? "Dieser Link ist 1 Stunde gültig." : "This link is valid for 1 hour.";
  const btnLabel = isDE ? "Passwort zurücksetzen" : "Reset password";

  const html = `<!DOCTYPE html><html><body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
<p>${greeting}</p>
<p>${body}</p>
<p><a href="${ctaUrl}" style="display:inline-block;padding:12px 24px;background:#4f46e5;color:#fff;text-decoration:none;border-radius:6px">${btnLabel}</a></p>
<p>${expiry}</p>
<p style="color:#888;font-size:12px">URL: ${ctaUrl}</p>
</body></html>`;

  const text = `${greeting}\n\n${body}\n\n${ctaUrl}\n\n${expiry}`;

  await resend.emails.send({ from: env.RESEND_FROM_EMAIL, to, subject, html, text });
}
