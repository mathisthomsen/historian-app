"use client";

import { useTranslations } from "next-intl";

import type { Certainty } from "@/types/person";

interface CertaintySelectorProps {
  value: Certainty;
  onChange: (value: Certainty) => void;
  disabled?: boolean;
  label?: string;
}

const CERTAINTIES: Certainty[] = ["CERTAIN", "PROBABLE", "POSSIBLE", "UNKNOWN"];

const ACTIVE_CLASSES: Record<Certainty, string> = {
  CERTAIN: "certainty-certain",
  PROBABLE: "certainty-probable",
  POSSIBLE: "certainty-possible",
  UNKNOWN: "certainty-unknown",
};

export function CertaintySelector({ value, onChange, disabled, label }: CertaintySelectorProps) {
  const t = useTranslations("persons.certainty");

  return (
    <div className="space-y-1">
      {label && <span className="text-sm font-medium">{label}</span>}
      <div className="flex gap-1" role="radiogroup" aria-label={label ?? "Certainty"}>
        {CERTAINTIES.map((c) => (
          <button
            key={c}
            type="button"
            role="radio"
            aria-checked={value === c}
            disabled={disabled}
            onClick={() => onChange(c)}
            className={[
              "focus-visible:ring-ring rounded-md border px-3 py-1.5 text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50",
              value === c
                ? ACTIVE_CLASSES[c]
                : "border-border bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground",
            ].join(" ")}
          >
            {t(c)}
          </button>
        ))}
      </div>
    </div>
  );
}
