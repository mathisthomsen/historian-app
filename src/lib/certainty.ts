import type { Certainty } from "@prisma/client";

/**
 * Certainty qualifies an assertion. With no assertion there is nothing to
 * qualify, so a stored level on an empty field is incoherent data.
 *
 * The API accepted that combination in both directions: a record created with
 * `birth_place: null, birth_place_certainty: "CERTAIN"`, and an existing place
 * cleared while its selector kept CERTAIN. Both were measured against a running
 * server before this guard existed. Two consequences, neither visible to the
 * person who caused them:
 *
 * - The detail page rendered "— · Unbelegt": an unevidenced-claim warning
 *   beside an em-dash, warning about a claim nobody made.
 * - The stale level survived, so a place entered later silently inherited a
 *   confidence that had been asserted about a different value entirely.
 *
 * `AGENTS.md` asks that changes inventing precision be flagged; storing
 * certainty for an absent value invents the assertion it qualifies.
 *
 * Applied on create and update alike, since either can produce the state.
 */
export function certaintyForValue(
  value: string | null | undefined,
  certainty: Certainty | undefined,
): Certainty | undefined {
  if (certainty === undefined) return undefined;
  const hasValue = typeof value === "string" && value.trim().length > 0;
  return hasValue ? certainty : "UNKNOWN";
}
