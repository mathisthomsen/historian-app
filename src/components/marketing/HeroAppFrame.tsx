import type { Certainty } from "@prisma/client";

import { CertaintyMarker } from "@/components/research/CertaintyMarker";

/** Row widths are arbitrary; they stand in for record text without inventing data. */
const ROWS: { width: string; certainty: Certainty }[] = [
  { width: "58%", certainty: "PROBABLE" },
  { width: "76%", certainty: "CERTAIN" },
  { width: "44%", certainty: "UNKNOWN" },
  { width: "66%", certainty: "POSSIBLE" },
  { width: "82%", certainty: "CERTAIN" },
];

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
            <div key={row.width} className="flex items-center gap-3">
              <span className="bg-muted h-2 rounded-sm" style={{ width: row.width }} />
              <CertaintyMarker certainty={row.certainty} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
