"use client";

import { Pencil } from "lucide-react";
import { useTranslations } from "next-intl";

import { RelationDeleteButton } from "@/components/relations/RelationDeleteButton";
import { Button } from "@/components/ui/button";
import type { RelationWithDetails } from "@/types/relations";

interface RelationRowProps {
  relation: RelationWithDetails;
  onEdit: (relation: RelationWithDetails) => void;
  onDeleted: () => void;
}

export function RelationRow({ relation, onEdit, onDeleted }: RelationRowProps) {
  const t = useTranslations("relations");

  return (
    <div className="flex items-center justify-between gap-2 rounded-md border p-3 text-sm">
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
        {relation.evidence_count > 0 && (
          <span className="shrink-0 text-xs text-muted-foreground">
            {t("evidenceCount_other", { count: relation.evidence_count })}
          </span>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-1">
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
  );
}
