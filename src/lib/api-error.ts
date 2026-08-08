import type { ErrorCode } from "@/lib/api";

/**
 * Client-side reader for the unified error envelope (audit A-H4).
 *
 * Clients used to branch on `data.error` as a bare string, which meant
 * string-matching prose or i18n keys — and when no branch matched, several call
 * sites rendered the raw backend value to the user. Codes are the only thing
 * clients should key off; the copy lives in `messages/*.json`.
 */
export interface ApiErrorPayload {
  error?: { code?: string; message?: string; details?: unknown };
}

/** Extracts the machine-readable code from a failed response body. */
export function errorCode(body: unknown): string | undefined {
  if (typeof body !== "object" || body === null) return undefined;
  const { error } = body as ApiErrorPayload;
  if (typeof error !== "object" || error === null) return undefined;
  return typeof error.code === "string" ? error.code : undefined;
}

/** Extracts `error.details` for codes that carry structured context. */
export function errorDetails<T = unknown>(body: unknown): T | undefined {
  if (typeof body !== "object" || body === null) return undefined;
  const { error } = body as ApiErrorPayload;
  if (typeof error !== "object" || error === null) return undefined;
  return error.details as T | undefined;
}

/** Reads the response body without throwing on a non-JSON payload. */
export async function readErrorBody(res: Response): Promise<unknown> {
  return res.json().catch(() => ({}));
}

/**
 * Resolves an error code to translated copy.
 *
 * `map` gives a caller-specific code -> translation-key mapping; anything
 * unmapped falls back to `fallbackKey` so a user never sees a raw code.
 */
export function translateErrorCode(
  code: string | undefined,
  t: (key: string) => string,
  map: Partial<Record<ErrorCode | string, string>>,
  fallbackKey: string,
): string {
  const key = code ? map[code] : undefined;
  return t(key ?? fallbackKey);
}
