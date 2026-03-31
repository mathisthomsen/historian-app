import sanitizeHtml from "sanitize-html";

/**
 * Strips all HTML from user-supplied strings before DB writes.
 * Configured for plain-text-only fields (no HTML allowed).
 * Applied at all write boundaries where user text is stored.
 */
export function sanitize(input: string): string {
  return sanitizeHtml(input, { allowedTags: [], allowedAttributes: {} });
}
