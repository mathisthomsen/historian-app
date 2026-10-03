/**
 * The decoder: the exact inverse of the encode step `sanitize-html` applies on
 * write, which emits `&amp;`, `&lt;` and `&gt;` and nothing else (plan, L6).
 *
 * Order is load-bearing: `&lt;` and `&gt;` first, `&amp;` LAST. Each pass is a
 * single `replace`, and neither of the first two produces an `&`, so no pass
 * can create a new match for a later one. `&amp;` first would turn a stored
 * `&amp;lt;` (a typed `&lt;`) into `<` instead of `&lt;`.
 *
 * Not idempotent: decoding a decoded `&amp;lt;` again yields `<`. The run-once
 * marker table is what prevents a second pass.
 */
export function decodeEntities(stored: string): string {
  return stored.split("&lt;").join("<").split("&gt;").join(">").split("&amp;").join("&");
}

/**
 * The same decoder as a Postgres expression over `expr` (a text expression).
 * `replace()` is single-pass, as `split/join` above. Keep the two in lockstep;
 * the tests compare them on every fixture pair.
 */
export function decodeSql(expr: string): string {
  return `replace(replace(replace(${expr}, '&lt;', '<'), '&gt;', '>'), '&amp;', '&')`;
}

/** A value that the backfill would change: contains an encoded entity. */
export const ENTITY_PATTERN_SQL = "&(amp|lt|gt);";
