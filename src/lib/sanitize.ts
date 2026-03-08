/**
 * Strips <script> tags from user-supplied strings before DB writes.
 * Applied at all write boundaries where user text is stored.
 *
 * NOTE: Replace with sanitize-html in Epic 2.1 when rich-text fields are introduced.
 * The upgrade is a single-line change in this file; all call sites remain unchanged.
 */
export function sanitize(input: string): string {
  return input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
}
