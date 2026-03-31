"use client";

import type { Certainty } from "@prisma/client";
import { ChevronDown, ChevronUp, Pencil } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { EvidenceList } from "@/components/relations/EvidenceList";
import { RelationDeleteButton } from "@/components/relations/RelationDeleteButton";
import { Button } from "@/components/ui/button";
import type { PropertyEvidenceItem, RelationWithDetails } from "@/types/relations";

interface RelationRowProps {
  relation: RelationWithDetails;
  onEdit: (relation: RelationWithDetails) => void;
  onDeleted: () => void;
  onEvidenceChange?: () => void;
}

interface RelationEvidenceItem {
  id: string;
  relation_id: string;
  source_id: string;
  source: { id: string; title: string; type: string };
  notes: string | null;
  page_reference: string | null;
  quote: string | null;
  confidence: string;
  created_at: string;
}

export function RelationRow({ relation, onEdit, onDeleted, onEvidenceChange }: RelationRowProps) {
  const t = useTranslations("relations");

  const fromYear = relation.valid_from_year;
  const toYear = relation.valid_to_year;
  let validityString: string | null = null;
  if (fromYear && toYear) {
    validityString = t("validity.range", { from: fromYear, to: toYear });
  } else if (fromYear) {
    validityString = t("validity.from_only", { year: fromYear });
  } else if (toYear) {
    validityString = t("validity.to_only", { year: toYear });
  }
  const [evidenceOpen, setEvidenceOpen] = useState(false);
  const [evidenceItems, setEvidenceItems] = useState<PropertyEvidenceItem[]>([]);
  const [evidenceLoading, setEvidenceLoading] = useState(false);
  const [evidenceCount, setEvidenceCount] = useState(relation.evidence_count);

  const loadEvidence = useCallback(async () => {
    setEvidenceLoading(true);
    try {
      const res = await fetch(`/api/relations/${relation.id}/evidence`);
      if (res.ok) {
        const data = (await res.json()) as { data?: RelationEvidenceItem[] };
        const raw = data.data ?? [];
        setEvidenceItems(
          raw.map((e) => ({
            id: e.id,
            project_id: relation.project_id,
            entity_type: relation.from_type,
            entity_id: relation.from_id,
            property: "evidence",
            source_id: e.source_id,
            source_title: e.source.title,
            notes: e.notes,
            page_reference: e.page_reference,
            quote: e.quote,
            raw_transcription: null,
            confidence: e.confidence as Certainty,
            created_at: e.created_at,
          })),
        );
        setEvidenceCount(raw.length);
      }
    } finally {
      setEvidenceLoading(false);
    }
  }, [relation.id, relation.project_id, relation.from_type, relation.from_id]);

  useEffect(() => {
    if (evidenceOpen) {
      void loadEvidence();
    }
  }, [evidenceOpen, loadEvidence]);

  async function handleAddEvidence(values: {
    source_id: string;
    source_title?: string;
    page_reference: string;
    quote: string;
    confidence: PropertyEvidenceItem["confidence"];
  }) {
    const res = await fetch(`/api/relations/${relation.id}/evidence`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        source_id: values.source_id,
        page_reference: values.page_reference || null,
        quote: values.quote || null,
        confidence: values.confidence,
      }),
    });
    if (res.ok) {
      toast.success(t("saved_toast"));
      await loadEvidence();
      onEvidenceChange?.();
    } else {
      throw new Error("Failed to add evidence");
    }
  }

  async function handleDeleteEvidence(evidenceId: string) {
    const res = await fetch(`/api/relations/${relation.id}/evidence/${evidenceId}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("Failed to delete evidence");
    await loadEvidence();
    onEvidenceChange?.();
  }

  const countLabel =
    evidenceCount === 1
      ? t("evidenceCount_one", { count: evidenceCount })
      : t("evidenceCount_other", { count: evidenceCount });

  return (
    <div className="rounded-md border text-sm">
      <div className="flex items-center justify-between gap-2 p-3">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          {relation.relation_type.color && (
            <span
              className="h-3 w-3 shrink-0 rounded-full"
              style={{ backgroundColor: relation.relation_type.color }}
            />
          )}
          <span className="truncate font-medium">{relation.from_label}</span>
          <span className="shrink-0 text-muted-foreground">→</span>
          <span className="shrink-0 text-muted-foreground">{relation.relation_type.name}</span>
          <span className="shrink-0 text-muted-foreground">→</span>
          <span className="truncate font-medium">{relation.to_label}</span>
          <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
            {relation.certainty}
          </span>
          {validityString && (
            <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
              {validityString}
            </span>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            className="flex items-center gap-1 rounded px-2 py-0.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
            onClick={() => setEvidenceOpen((prev) => !prev)}
            aria-expanded={evidenceOpen}
          >
            {countLabel}
            {evidenceOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => onEdit(relation)}
            aria-label={t("edit")}
          >
            <Pencil className="h-3 w-3" />
          </Button>
          <RelationDeleteButton relationId={relation.id} onDeleted={onDeleted} />
        </div>
      </div>

      {evidenceOpen && (
        <div className="border-t px-3 py-3">
          <EvidenceList
            items={evidenceItems}
            projectId={relation.project_id}
            onAdd={handleAddEvidence}
            onDelete={handleDeleteEvidence}
            loading={evidenceLoading}
          />
        </div>
      )}
    </div>
  );
}
