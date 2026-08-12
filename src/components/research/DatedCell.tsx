"use client";

import type { Certainty } from "@prisma/client";

import { CertaintyMarker } from "@/components/research/CertaintyMarker";

interface DatedCellProps {
  /** Already-formatted date, or the em-dash placeholder when there is none. */
  text: string;
  certainty?: Certainty | undefined;
}

/**
 * A partial date in a list row, with its certainty alongside.
 *
 * The lists mapped `*_date_certainty` into their summary types and then rendered
 * bare dates, so a researcher scanning 25 rows could not distinguish inference
 * from documented fact — the exact judgement the application exists to support
 * (issue #37). No marker is shown where there is no date to qualify.
 */
export function DatedCell({ text, certainty }: DatedCellProps) {
  const hasDate = text !== "—";

  return (
    <span className="inline-flex items-center gap-1.5">
      <span>{text}</span>
      {hasDate && certainty && <CertaintyMarker certainty={certainty} />}
    </span>
  );
}
