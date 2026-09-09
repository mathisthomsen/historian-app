"use client";

import type { Certainty } from "@prisma/client";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

/**
 * Fraction of the circle filled per level. This IS the shape distinction
 * (WCAG 1.4.1) — the four levels differ by wedge size, not colour alone, so
 * they stay legible for colour-blind users and in a screenshot desaturated
 * to greyscale.
 */
const FRACTIONS: Record<Certainty, number> = {
  CERTAIN: 1,
  PROBABLE: 0.75,
  POSSIBLE: 0.25,
  UNKNOWN: 0,
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
const RADIUS = CENTER - 1.1; // leaves room for the outline stroke
const STROKE_WIDTH = 1.25;

/** Point on the circle at `angleDeg` clockwise from 12 o'clock. */
function pointOnCircle(angleDeg: number): readonly [number, number] {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return [CENTER + RADIUS * Math.cos(rad), CENTER + RADIUS * Math.sin(rad)];
}

/** SVG path for a pie wedge sweeping clockwise from 12 o'clock, or null for 0%. */
function wedgePath(fraction: number): string | null {
  if (fraction <= 0) return null;
  const endAngle = 360 * fraction;
  const largeArc = fraction > 0.5 ? 1 : 0;
  const [sx, sy] = pointOnCircle(0);
  const [ex, ey] = pointOnCircle(endAngle);
  return `M ${CENTER} ${CENTER} L ${sx} ${sy} A ${RADIUS} ${RADIUS} 0 ${largeArc} 1 ${ex} ${ey} Z`;
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
 * Originally a glyph (`● ◕ ◔ ○`) in a bordered, filled ring — but a small
 * filled dot inside a larger ring reads as a selected radio button, and at
 * 9.6px `◕` and `◔` are not reliably distinguishable (issue #71). This is a
 * purpose-drawn "pie": a circle outline plus a filled wedge for the level's
 * fraction, no enclosing chip/border/background. Two more reasons beyond the
 * reported symptom: font coverage for `◕`/`◔` is not guaranteed across
 * platforms (an SVG is deterministic where a glyph can fall back to tofu),
 * and the wedge IS the quantity, so the quarter/three-quarter/full reading
 * survives at 14-16px where a centred glyph does not.
 */
export function CertaintyMarker({ certainty, className }: CertaintyMarkerProps) {
  const t = useTranslations("common");
  const label = t("certaintyLabel", { level: t(`certainty.${certainty}`) });
  const fraction = FRACTIONS[certainty];
  const color = TOKEN[certainty];
  const path = wedgePath(fraction);

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
      >
        {fraction >= 1 ? (
          // 100%: a full wedge and the outline would coincide, so just fill the disc.
          <circle cx={CENTER} cy={CENTER} r={RADIUS} style={{ fill: color }} />
        ) : (
          <>
            {path && <path d={path} style={{ fill: color }} />}
            <circle
              cx={CENTER}
              cy={CENTER}
              r={RADIUS}
              style={{ stroke: color, fill: "none" }}
              strokeWidth={STROKE_WIDTH}
            />
          </>
        )}
      </svg>
    </span>
  );
}
