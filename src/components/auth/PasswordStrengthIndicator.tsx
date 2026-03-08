"use client";

import { useTranslations } from "next-intl";

interface PasswordStrengthIndicatorProps {
  password: string;
}

function getStrength(password: string): {
  score: number;
  label: "weak" | "fair" | "good" | "strong" | "veryStrong";
} {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  const labels = ["weak", "weak", "fair", "good", "strong", "veryStrong"] as const;
  // score is always 0-5; non-null assertion is safe
   
  return { score, label: labels[score]! };
}

const SEGMENT_COLORS: Record<number, string[]> = {
  0: ["bg-muted", "bg-muted", "bg-muted", "bg-muted", "bg-muted"],
  1: ["bg-red-500", "bg-muted", "bg-muted", "bg-muted", "bg-muted"],
  2: ["bg-orange-500", "bg-orange-500", "bg-muted", "bg-muted", "bg-muted"],
  3: ["bg-yellow-500", "bg-yellow-500", "bg-yellow-500", "bg-muted", "bg-muted"],
  4: ["bg-lime-500", "bg-lime-500", "bg-lime-500", "bg-lime-500", "bg-muted"],
  5: ["bg-green-500", "bg-green-500", "bg-green-500", "bg-green-500", "bg-green-500"],
};

export function PasswordStrengthIndicator({ password }: PasswordStrengthIndicatorProps) {
  const t = useTranslations("auth.strength");
  const { score, label } = getStrength(password);
  // score is always 0-5; non-null assertion is safe
   
  const colors = SEGMENT_COLORS[score]!;

  return (
    <div className="space-y-1" role="group" aria-label={t("label")}>
      <div className="flex gap-1">
        {colors.map((color, i) => (
          <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${color}`} />
        ))}
      </div>
      {password.length > 0 && (
        <p className="text-xs text-muted-foreground">{t(label)}</p>
      )}
    </div>
  );
}
