"use client";

import { Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface NameEntry {
  name: string;
  language?: string | null | undefined;
  is_primary?: boolean | undefined;
}

interface PersonNameListProps {
  value: NameEntry[];
  onChange: (value: NameEntry[]) => void;
  disabled?: boolean;
}

export function PersonNameList({ value, onChange, disabled }: PersonNameListProps) {
  const t = useTranslations("persons.names");

  function addName() {
    onChange([...value, { name: "", language: null, is_primary: false }]);
  }

  function removeName(index: number) {
    const next = value.filter((_, i) => i !== index);
    onChange(next);
  }

  function updateName(index: number, field: keyof NameEntry, fieldValue: string | boolean | null) {
    const next = value.map((entry, i) => {
      if (i !== index) return entry;
      return { ...entry, [field]: fieldValue };
    });
    onChange(next);
  }

  function setPrimary(index: number) {
    const next = value.map((entry, i) => ({ ...entry, is_primary: i === index }));
    onChange(next);
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium">{t("section_title")}</p>
      {value.map((entry, i) => (
        <div key={i} className="flex items-end gap-2 rounded-md border p-3">
          <div className="flex-1 space-y-1">
            <Label htmlFor={`name-${i}`} className="text-xs text-muted-foreground">
              {t("name_placeholder")}
            </Label>
            <Input
              id={`name-${i}`}
              type="text"
              placeholder={t("name_placeholder")}
              value={entry.name}
              onChange={(e) => updateName(i, "name", e.target.value)}
              disabled={disabled}
            />
          </div>
          <div className="w-28 space-y-1">
            <Label htmlFor={`lang-${i}`} className="text-xs text-muted-foreground">
              {t("language")}
            </Label>
            <Input
              id={`lang-${i}`}
              type="text"
              placeholder={t("language_placeholder")}
              value={entry.language ?? ""}
              onChange={(e) => updateName(i, "language", e.target.value || null)}
              disabled={disabled}
            />
          </div>
          <div className="flex flex-col items-center gap-1 pb-1">
            <span className="text-xs text-muted-foreground">{t("is_primary")}</span>
            <input
              type="radio"
              name="primary-name"
              checked={entry.is_primary}
              onChange={() => setPrimary(i)}
              disabled={disabled}
              aria-label={t("is_primary")}
              className="h-4 w-4"
            />
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => removeName(i)}
            disabled={disabled}
            aria-label={t("remove")}
            className="mb-0.5 shrink-0"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={addName} disabled={disabled}>
        {t("add")}
      </Button>
    </div>
  );
}
