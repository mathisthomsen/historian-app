/**
 * Shared fixtures for the "user text is stored verbatim" write-site tests
 * (#150, `docs/specs/150-plain-text-storage/plan.md`, T3).
 *
 * Every text-write route is tested UNMOCKED with these payloads and asserted
 * on the arguments handed to Prisma: what a researcher typed must reach the
 * database byte for byte. `sanitize()` used to HTML-encode `&`, `<` and `>`
 * and strip tags on write; none of that happens any more, and output
 * escaping (React, `src/lib/html.ts`) is the only defence.
 *
 * `VERBATIM_WRITE_COLUMNS` is the plan's write-site table as (table, column)
 * pairs. Route tests iterate it through `columnsOf(table)` rather than listing
 * columns by hand.
 */

/** Text that the old write path mangled: `&` encoded, `<…` truncated, tags stripped. */
export const VERBATIM_PAYLOADS = ["Müller & Söhne", "1848 < 1850", "<b>x</b>"] as const;

export const VERBATIM_WRITE_COLUMNS = [
  { table: "users", column: "name" },
  { table: "persons", column: "first_name" },
  { table: "persons", column: "last_name" },
  { table: "persons", column: "birth_place" },
  { table: "persons", column: "death_place" },
  { table: "persons", column: "notes" },
  { table: "person_names", column: "name" },
  { table: "event_types", column: "name" },
  { table: "event_types", column: "icon" },
  { table: "events", column: "title" },
  { table: "events", column: "description" },
  { table: "events", column: "location" },
  { table: "events", column: "notes" },
  { table: "sources", column: "title" },
  { table: "sources", column: "type" },
  { table: "sources", column: "author" },
  { table: "sources", column: "date" },
  { table: "sources", column: "repository" },
  { table: "sources", column: "call_number" },
  { table: "sources", column: "notes" },
  { table: "relation_types", column: "name" },
  { table: "relation_types", column: "inverse_name" },
  { table: "relation_types", column: "description" },
  { table: "relation_types", column: "icon" },
  { table: "relations", column: "notes" },
  { table: "relation_evidence", column: "notes" },
  { table: "relation_evidence", column: "page_reference" },
  { table: "relation_evidence", column: "quote" },
  { table: "property_evidence", column: "notes" },
  { table: "property_evidence", column: "page_reference" },
  { table: "property_evidence", column: "quote" },
  { table: "property_evidence", column: "raw_transcription" },
  { table: "access_requests", column: "name" },
  { table: "access_requests", column: "institution" },
  { table: "access_requests", column: "research_area" },
  { table: "access_requests", column: "tool_gap" },
] as const;

export type VerbatimTable = (typeof VERBATIM_WRITE_COLUMNS)[number]["table"];

/** The columns of one table, as `[column]` rows ready for `it.each`. */
export function columnsOf(table: VerbatimTable): string[] {
  return VERBATIM_WRITE_COLUMNS.filter((c) => c.table === table).map((c) => c.column);
}

/** `[column, payload]` rows for `it.each`: every column of the table against every payload. */
export function verbatimCases(table: VerbatimTable): Array<[string, string]> {
  return columnsOf(table).flatMap((column) =>
    VERBATIM_PAYLOADS.map((payload): [string, string] => [column, payload]),
  );
}
