/**
 * Distinguishable sign-in failure codes.
 *
 * `authorize()` used to return `null` for rate-limit exhaustion, the 30-minute
 * account lockout, an unknown email and a wrong password alike, so all four
 * surfaced as "E-Mail oder Passwort ungültig." — advice that cannot work for the
 * first two. The `email_not_verified` branch threw a plain Error, which
 * @auth/core wraps as a non-client-safe `CallbackRouteError`, so the client saw
 * `"Configuration"` and told verified-pending users their credentials were wrong
 * (issue #48).
 *
 * `CredentialsSignin.code` is propagated to the client as `signIn(...).code`.
 * It travels in a URL, so it must not carry anything sensitive.
 */
export const SIGN_IN_CODES = {
  /** Wrong password, or no account with that email. Deliberately merged. */
  invalidCredentials: "invalid_credentials",
  /** The IP+email login bucket is exhausted. Says nothing about the account. */
  rateLimited: "rate_limited",
  /**
   * The account is temporarily locked after repeated failures.
   *
   * This does confirm the account exists. That is a deliberate trade: reaching
   * it takes 10 failed attempts against a known address, so an attacker already
   * has that signal, while a locked-out legitimate user otherwise has no way to
   * learn why nothing they type works for half an hour.
   */
  accountLocked: "account_locked",
  /** Credentials were correct but the address is unconfirmed. */
  emailNotVerified: "email_not_verified",
} as const;

export type SignInCode = (typeof SIGN_IN_CODES)[keyof typeof SIGN_IN_CODES];

/**
 * Rate-limit windows, in minutes, shared between each route's limiter and the copy
 * that reports it. RegisterForm used to hardcode "15" against a 60-minute window,
 * so a user who waited exactly as long as they were told was still blocked
 * (issue #48). These are fallbacks only: prefer the response's `Retry-After`.
 */
export const LOGIN_RATE_LIMIT_MINUTES = 15;
export const REGISTER_RATE_LIMIT_MINUTES = 60;
export const FORGOT_PASSWORD_RATE_LIMIT_MINUTES = 60;
export const RESET_PASSWORD_RATE_LIMIT_MINUTES = 15;
export const VERIFY_EMAIL_RATE_LIMIT_MINUTES = 15;
export const RESEND_VERIFICATION_RATE_LIMIT_MINUTES = 60;

/** Lockout duration, in minutes. Shared so copy cannot drift from `auth.ts`. */
export const ACCOUNT_LOCKOUT_MINUTES = 30;

/*
 * The CredentialsSignin subclasses that carry these codes live in `auth.ts`.
 * They must not be constructed here: importing `next-auth` drags in its
 * Next-server env module, which the client components and their jsdom tests
 * cannot resolve. This module stays dependency-free so both sides can share it.
 */
