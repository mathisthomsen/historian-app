import type { Certainty } from "@prisma/client";

import { CertaintyMarker } from "@/components/research/CertaintyMarker";

/**
 * One row of the depicted persons list: a name cell, then a birth-date cell and
 * a death-date cell, each with its own certainty marker — the layout
 * `PersonsListClient` actually renders (`DatedCell` per date column).
 *
 * Widths are arbitrary; they stand in for record text without inventing data.
 * The two markers in a row deliberately differ in most rows: one record whose
 * fields disagree is what "certainty per date, not per record" looks like.
 */
interface Row {
  name: string;
  birth: { width: string; certainty: Certainty };
  death: { width: string; certainty: Certainty };
}

const ROWS: Row[] = [
  {
    name: "78%",
    birth: { width: "70%", certainty: "PROBABLE" },
    death: { width: "62%", certainty: "CERTAIN" },
  },
  {
    name: "60%",
    birth: { width: "58%", certainty: "UNKNOWN" },
    death: { width: "66%", certainty: "POSSIBLE" },
  },
  {
    name: "86%",
    birth: { width: "66%", certainty: "CERTAIN" },
    death: { width: "66%", certainty: "CERTAIN" },
  },
  {
    name: "68%",
    birth: { width: "52%", certainty: "POSSIBLE" },
    death: { width: "74%", certainty: "PROBABLE" },
  },
  {
    name: "74%",
    birth: { width: "72%", certainty: "CERTAIN" },
    death: { width: "56%", certainty: "UNKNOWN" },
  },
];

function DateCell({ width, certainty }: { width: string; certainty: Certainty }) {
  return (
    <div data-testid="hero-cell" className="flex min-w-0 items-center gap-2">
      <span className="bg-muted h-2 min-w-0 rounded-sm" style={{ width }} />
      <CertaintyMarker certainty={certainty} />
    </div>
  );
}

export function HeroAppFrame() {
  return (
    <div
      data-testid="hero-app-frame"
      aria-hidden="true"
      className="border-border bg-card mx-auto w-full max-w-4xl overflow-hidden rounded-t-xl border shadow-lg"
    >
      <div className="border-border flex gap-1.5 border-b px-4 py-3">
        <span className="bg-border h-2 w-2 rounded-full" />
        <span className="bg-border h-2 w-2 rounded-full" />
        <span className="bg-border h-2 w-2 rounded-full" />
      </div>
      <div className="grid grid-cols-[7rem_1fr] sm:grid-cols-[10rem_1fr]">
        <div className="border-border flex flex-col gap-2 border-r p-4">
          {["70%", "88%", "60%", "76%"].map((w, i) => (
            <span
              key={w}
              className="h-2 rounded-sm"
              style={{
                width: w,
                background: i === 1 ? "var(--color-primary)" : "var(--color-muted)",
                opacity: i === 1 ? 0.2 : 1,
              }}
            />
          ))}
        </div>
        <div className="flex flex-col gap-3 p-4">
          {ROWS.map((row) => (
            <div
              key={row.name}
              data-testid="hero-row"
              className="grid grid-cols-[1.3fr_1fr_1fr] items-center gap-3 sm:gap-6"
            >
              <div data-testid="hero-cell" className="min-w-0">
                <span className="bg-muted block h-2 rounded-sm" style={{ width: row.name }} />
              </div>
              <DateCell {...row.birth} />
              <DateCell {...row.death} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
