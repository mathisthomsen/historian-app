"use client";

import type { EntityType } from "@prisma/client";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { EvidenceList } from "@/components/relations/EvidenceList";
import type { PropertyEvidenceItem } from "@/types/relations";

interface PropertyEvidencePanelProps {
  projectId: string;
  entityType: EntityType;
  entityId: string;
  property: string;
  onEvidenceChange?: () => void;
}

export function PropertyEvidencePanel({
  projectId,
  entityType,
  entityId,
  property,
  onEvidenceChange,
}: PropertyEvidencePanelProps) {
  const t = useTranslations("propertyEvidence");
  const [items, setItems] = useState<PropertyEvidenceItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/property-evidence?projectId=${encodeURIComponent(projectId)}&entityType=${entityType}&entityId=${encodeURIComponent(entityId)}&property=${encodeURIComponent(property)}`,
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
  }, [projectId, entityType, entityId, property]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleAdd(values: {
    source_id: string;
    source_title?: string;
    page_reference: string;
    quote: string;
    confidence: PropertyEvidenceItem["confidence"];
  }) {
    const res = await fetch("/api/property-evidence", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        project_id: projectId,
        entity_type: entityType,
        entity_id: entityId,
        property,
        source_id: values.source_id,
        page_reference: values.page_reference || null,
        quote: values.quote || null,
        confidence: values.confidence,
      }),
    });
    if (res.ok) {
      toast.success(t("saved_toast"));
      await load();
      onEvidenceChange?.();
    } else {
      throw new Error("Failed to add evidence");
    }
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/property-evidence/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Failed to delete evidence");
    await load();
    onEvidenceChange?.();
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">{t("title")}</p>
      <EvidenceList
        items={items}
        projectId={projectId}
        onAdd={handleAdd}
        onDelete={handleDelete}
        loading={loading}
      />
    </div>
  );
}
