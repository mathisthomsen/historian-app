"use client";

import type { EntityType } from "@prisma/client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";

import type { RelationTypeItem } from "@/types/relations";

interface RelationTypeSelectorProps {
  allTypes: RelationTypeItem[];
  fromType: EntityType | null;
  toType: EntityType | null;
  value: string | null;
  onChange: (id: string | null) => void;
  disabled?: boolean;
}

export function RelationTypeSelector({
  allTypes,
  fromType,
  toType,
  value,
  onChange,
  disabled,
}: RelationTypeSelectorProps) {
  const t = useTranslations("relations");
  const params = useParams<{ locale: string }>();
  const locale = params?.locale ?? "de";

  const filtered =
    fromType && toType
      ? allTypes.filter(
          (rt) =>
            rt.valid_from_types.includes(fromType) && rt.valid_to_types.includes(toType),
        )
      : allTypes;

  if (fromType && toType && filtered.length === 0) {
    return (
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">{t("noTypeForCombination")}</p>
        <Link
          href={`/${locale}/settings/relation-types`}
          className="text-xs text-primary underline hover:text-primary/80"
        >
          {t("manageTypes")}
        </Link>
      </div>
    );
  }

  return (
    <select
      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value || null)}
      disabled={disabled}
    >
      <option value="">{t("fields.relationType")}</option>
      {filtered.map((rt) => (
        <option key={rt.id} value={rt.id}>
          {rt.name}
          {rt.inverse_name ? ` / ${rt.inverse_name}` : ""}
        </option>
      ))}
    </select>
  );
}
