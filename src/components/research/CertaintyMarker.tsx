"use client";

import type { Certainty } from "@prisma/client";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

/**
 * Distinct glyph per level, so the four values are told apart without relying on
 * colour (WCAG 1.4.1). Colour is carried by the .certainty-* utilities.
 */
const GLYPHS: Record<Certainty, string> = {
  CERTAIN: "●",
  PROBABLE: "◕",
  POSSIBLE: "◔",
  UNKNOWN: "○",
};

const UTILITY: Record<Certainty, string> = {
  CERTAIN: "certainty-certain",
  PROBABLE: "certainty-probable",
  POSSIBLE: "certainty-possible",
  UNKNOWN: "certainty-unknown",
};

interface CertaintyMarkerProps {
  certainty: Certainty;
  className?: string;
}

/**
 * Compact certainty indicator for list rows.
 *
 * The Mental Model Rule requires certainty to be visible at every level without
 * a hover or click, but the lists mapped `*_date_certainty` into their summary
 * types and then rendered bare dates, so a Possible birth year and a Certain one
 * were pixel-identical across 25 rows (issue #37). A full Badge per date is too
 * heavy at list density; this is the same token family at row scale.
 */
export function CertaintyMarker({ certainty, className }: CertaintyMarkerProps) {
  const t = useTranslations("common");
  const label = t("certaintyLabel", { level: t(`certainty.${certainty}`) });

  return (
    <span
      title={label}
      aria-label={label}
      role="img"
      className={cn(
        "inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full border text-[0.6rem] leading-none",
        UTILITY[certainty],
        className,
      )}
    >
      <span aria-hidden="true">{GLYPHS[certainty]}</span>
    </span>
  );
}
