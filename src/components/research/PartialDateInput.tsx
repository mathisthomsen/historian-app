"use client";

import { useTranslations } from "next-intl";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface PartialDateInputProps {
  yearValue: number | null;
  monthValue: number | null;
  dayValue: number | null;
  onYearChange: (v: number | null) => void;
  onMonthChange: (v: number | null) => void;
  onDayChange: (v: number | null) => void;
  disabled?: boolean;
  label: string;
}

const MONTH_KEYS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;

export function PartialDateInput({
  yearValue,
  monthValue,
  dayValue,
  onYearChange,
  onMonthChange,
  onDayChange,
  disabled,
  label,
}: PartialDateInputProps) {
  const t = useTranslations("persons.date");

  function handleYearChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value;
    if (raw === "") {
      onYearChange(null);
    } else {
      const n = parseInt(raw, 10);
      if (!isNaN(n)) onYearChange(n);
    }
  }

  function handleMonthChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const raw = e.target.value;
    if (raw === "") {
      onMonthChange(null);
      onDayChange(null);
    } else {
      const n = parseInt(raw, 10);
      if (!isNaN(n)) onMonthChange(n);
    }
  }

  function handleDayChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value;
    if (raw === "") {
      onDayChange(null);
    } else {
      const n = parseInt(raw, 10);
      if (!isNaN(n)) onDayChange(n);
    }
  }

  const monthDisabled = disabled || !yearValue;
  const dayDisabled = disabled || !monthValue;

  return (
    <fieldset className="space-y-1">
      <legend className="text-sm font-medium">{label}</legend>
      <div className="flex gap-2">
        <div className="flex-1 space-y-1">
          <Label htmlFor={`${label}-year`} className="text-xs text-muted-foreground">
            {t("year")}
          </Label>
          <Input
            id={`${label}-year`}
            type="number"
            min={1}
            max={2100}
            placeholder="YYYY"
            value={yearValue ?? ""}
            onChange={handleYearChange}
            disabled={disabled}
            className="w-full"
          />
        </div>
        <div className="flex-1 space-y-1">
          <Label htmlFor={`${label}-month`} className="text-xs text-muted-foreground">
            {t("month")}
          </Label>
          <select
            id={`${label}-month`}
            value={monthValue ?? ""}
            onChange={handleMonthChange}
            disabled={monthDisabled}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="">{t("no_month")}</option>
            {MONTH_KEYS.map((m) => (
              <option key={m} value={m}>
                {t(`months.${m}`)}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1 space-y-1">
          <Label htmlFor={`${label}-day`} className="text-xs text-muted-foreground">
            {t("day")}
          </Label>
          <Input
            id={`${label}-day`}
            type="number"
            min={1}
            max={31}
            placeholder="DD"
            value={dayValue ?? ""}
            onChange={handleDayChange}
            disabled={dayDisabled}
            className="w-full"
          />
        </div>
      </div>
    </fieldset>
  );
}
