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

export function CertaintySelector({ value, onChange, disabled, label }: CertaintySelectorProps) {
  const t = useTranslations("persons.certainty");

  return (
    <div className="space-y-1">
      {label && <span className="text-sm font-medium">{label}</span>}
      <div className="flex gap-1" role="group">
        {CERTAINTIES.map((c) => (
          <button
            key={c}
            type="button"
            aria-pressed={value === c}
            disabled={disabled}
            onClick={() => onChange(c)}
            className={[
              "rounded-md border px-3 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
              value === c
                ? "border-primary bg-primary text-primary-foreground"
                : "border-input bg-background text-foreground hover:bg-accent hover:text-accent-foreground",
            ].join(" ")}
          >
            {t(c)}
          </button>
        ))}
      </div>
    </div>
  );
}
