"use client";

import type { EntityType } from "@prisma/client";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";

import type { PropertyEvidenceItem } from "@/types/relations";

interface EntityEvidenceTabProps {
  projectId: string;
  entityType: EntityType;
  entityId: string;
}

// Map property keys to persons.fields translation keys
const FIELD_LABEL_KEYS: Record<string, string> = {
  first_name: "first_name",
  last_name: "last_name",
  birth_year: "birth_date",
  birth_month: "birth_date",
  birth_day: "birth_date",
  birth_place: "birth_place",
  birth_date_certainty: "birth_date_certainty",
  death_year: "death_date",
  death_month: "death_date",
  death_day: "death_date",
  death_place: "death_place",
  death_date_certainty: "death_date_certainty",
  notes: "notes",
};

export function EntityEvidenceTab({ projectId, entityType, entityId }: EntityEvidenceTabProps) {
  const t = useTranslations("persons.fields");
  const [items, setItems] = useState<PropertyEvidenceItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/property-evidence?projectId=${encodeURIComponent(projectId)}&entityType=${entityType}&entityId=${encodeURIComponent(entityId)}`,
      );
      if (res.ok) {
        const data = (await res.json()) as {
          data?: (PropertyEvidenceItem & { source?: { title?: string } })[];
        };
        const raw = data.data ?? [];
        setItems(
          raw.map((r) => {
            const title = r.source?.title ?? r.source_title;
            return title !== undefined ? { ...r, source_title: title } : { ...r };
          }),
        );
      }
    } finally {
      setLoading(false);
    }
  }, [projectId, entityType, entityId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-8 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">Keine Nachweise für diese Person vorhanden.</p>
    );
  }

  // Group by property
  const grouped = new Map<string, PropertyEvidenceItem[]>();
  for (const item of items) {
    const group = grouped.get(item.property) ?? [];
    group.push(item);
    grouped.set(item.property, group);
  }

  return (
    <div className="space-y-6">
      {Array.from(grouped.entries()).map(([property, fieldItems]) => {
        const labelKey = FIELD_LABEL_KEYS[property];
        const label = labelKey ? t(labelKey as Parameters<typeof t>[0]) : property;

        return (
          <div key={property} className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {label}
            </p>
            <div className="space-y-2">
              {fieldItems.map((item) => (
                <div key={item.id} className="rounded-md border p-3 text-sm">
                  <p className="font-medium">{item.source_title ?? item.source_id}</p>
                  {item.page_reference && (
                    <p className="text-muted-foreground">{item.page_reference}</p>
                  )}
                  {item.quote && (
                    <p className="italic text-muted-foreground">&ldquo;{item.quote}&rdquo;</p>
                  )}
                  <p className="mt-1 text-xs text-muted-foreground">{item.confidence}</p>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
