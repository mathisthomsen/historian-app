"use client";

import type { Certainty } from "@prisma/client";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

/**
 * The shape drawn per level. Each is a distinct *categorical* treatment of one
 * circle — filled, thick ring, thin ring, dashed ring — not a quantity of it.
 *
 * This is deliberately NOT a proportional fill. An earlier version of this
 * marker drew a pie wedge at 100/75/25/0%, which put a number on the claim that
 * the model does not contain: README §2 records that decimal confidence scores
 * were tried and rejected, because "researchers cannot meaningfully distinguish
 * 0.7 from 0.75, and a number implies a statistical basis that does not exist."
 * A 75% wedge asserts exactly that basis visually, so it is gone. What survives
 * is the ordering, which is real — CERTAIN outranks PROBABLE outranks POSSIBLE
 * — carried as decreasing ink rather than as a measured fraction.
 *
 * The four also differ by shape, not colour alone (WCAG 1.4.1), so they stay
 * readable when desaturated.
 */
type MarkerShape = "filled" | "thick-ring" | "thin-ring" | "dashed-ring";

const SHAPE: Record<Certainty, MarkerShape> = {
  CERTAIN: "filled",
  PROBABLE: "thick-ring",
  POSSIBLE: "thin-ring",
  UNKNOWN: "dashed-ring",
};

/**
 * The level's colour, from the `--color-certainty-*` token family (light and
 * dark values are both defined in globals.css). This is the base token, not
 * the pill's `-background`/`-border`/`-foreground` triad — there is no pill
 * here, just a stroke and a fill.
 */
const TOKEN: Record<Certainty, string> = {
  CERTAIN: "var(--color-certainty-certain)",
  PROBABLE: "var(--color-certainty-probable)",
  POSSIBLE: "var(--color-certainty-possible)",
  UNKNOWN: "var(--color-certainty-unknown)",
};

const SIZE = 15;
const CENTER = SIZE / 2;
const THICK_STROKE = 3.5;
const THIN_STROKE = 1.5;

/** Radius is measured to the stroke's centreline, so it shrinks as the stroke thickens. */
function radiusFor(strokeWidth: number): number {
  return CENTER - strokeWidth / 2 - 0.5;
}

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
 *
 * Originally a glyph (`● ◕ ◔ ○`) in a bordered, filled ring. That read as a
 * selected radio button, and at 9.6px `◕` and `◔` were not distinguishable
 * (issue #71); glyph coverage for them is not guaranteed across platforms
 * either, so the marker could render as tofu. Drawn as an SVG it is
 * deterministic — see SHAPE above for why the shapes are categorical rather
 * than proportional.
 */
export function CertaintyMarker({ certainty, className }: CertaintyMarkerProps) {
  const t = useTranslations("common");
  const label = t("certaintyLabel", { level: t(`certainty.${certainty}`) });
  const shape = SHAPE[certainty];
  const color = TOKEN[certainty];

  const strokeWidth = shape === "thick-ring" ? THICK_STROKE : THIN_STROKE;
  const radius = shape === "filled" ? CENTER - 1 : radiusFor(strokeWidth);

  return (
    <span
      title={label}
      aria-label={label}
      role="img"
      className={cn("inline-flex h-4 w-4 shrink-0 items-center justify-center", className)}
    >
      <svg
        aria-hidden="true"
        width={SIZE}
        height={SIZE}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="shrink-0"
        data-shape={shape}
      >
        <circle
          cx={CENTER}
          cy={CENTER}
          r={radius}
          style={
            shape === "filled"
              ? { fill: color }
              : {
                  stroke: color,
                  fill: "none",
                  strokeWidth,
                  ...(shape === "dashed-ring" ? { strokeDasharray: "2 2" } : {}),
                }
          }
        />
      </svg>
    </span>
  );
}
