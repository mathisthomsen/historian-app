/**
 * Escaping for HTML built as a string (the email templates). React escapes JSX
 * on its own; this exists for the one place that does not go through React.
 * Contract: docs/specs/150-plain-text-storage/plan.md (T2).
 *
 * `html` is a tagged template that escapes EVERY interpolated value. The only
 * way to put markup in is an explicit `TrustedHtml`: the result of another
 * `html` call (nesting) or `trusted(...)`. So an escape cannot be forgotten at
 * a call site, it can only be waived on purpose, and the waiver is greppable.
 *
 *   html`<p>Hello ${name}</p>`            // name is escaped
 *   html`<ul>${items.map(i => html`<li>${i}</li>`)}</ul>`   // via joinHtml
 *
 * Accepted interpolations: `string` (escaped), `number` (finite, stringified)
 * and `TrustedHtml` (inserted as is). `null`, `undefined` and booleans are a
 * type error and also throw at runtime: an absent value is the caller's
 * decision (omit the fragment), not something to print as "" or "null".
 *
 * Escaping is applied once, at interpolation, and is not idempotent by design:
 * `&amp;` becomes `&amp;amp;`. Callers pass raw text, never pre-escaped text.
 */

const ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

/** Escapes `& < > " '`. Safe in HTML text nodes and in quoted attribute values. */
export function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ESCAPES[c] as string);
}

/**
 * A fragment that is already HTML and is inserted without escaping. The `#brand`
 * field makes the type nominal for the compiler, and `TrustedHtml.is` checks it
 * at runtime: neither an object literal with a `value` nor
 * `Object.create(TrustedHtml.prototype)` can pass for one.
 */
export class TrustedHtml {
  readonly #brand = true;
  readonly value: string;

  constructor(value: string) {
    this.value = value;
  }

  static is(candidate: unknown): candidate is TrustedHtml {
    return typeof candidate === "object" && candidate !== null && #brand in candidate;
  }

  toString(): string {
    return this.value;
  }
}

/**
 * Marks `markup` as already-safe HTML. Use it only for a literal written in
 * this codebase. NEVER pass a value that came from a user, the database or a
 * request: that is exactly what `html` exists to prevent.
 */
export function trusted(markup: string): TrustedHtml {
  return new TrustedHtml(markup);
}

export type HtmlValue = string | number | TrustedHtml;

function render(value: HtmlValue): string {
  if (TrustedHtml.is(value)) return value.value;
  if (typeof value === "string") return escapeHtml(value);
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  throw new TypeError(
    `html: cannot interpolate ${value === null ? "null" : typeof value}; ` +
      "pass a string, a finite number or a TrustedHtml fragment",
  );
}

/** Tagged template: the literal parts are trusted, every interpolation is escaped. */
export function html(strings: TemplateStringsArray, ...values: HtmlValue[]): TrustedHtml {
  let out = strings[0] ?? "";
  values.forEach((value, i) => {
    out += render(value) + (strings[i + 1] ?? "");
  });
  return new TrustedHtml(out);
}

/**
 * Concatenates parts: strings are escaped, fragments inserted as is. `separator`
 * is a developer-written literal and is NOT escaped.
 */
export function joinHtml(parts: readonly HtmlValue[], separator = ""): TrustedHtml {
  return new TrustedHtml(parts.map(render).join(separator));
}
