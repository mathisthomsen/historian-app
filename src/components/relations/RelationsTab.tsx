"use client";

import type { EntityType } from "@prisma/client";
import { Loader2, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";

import { RelationFormDialog } from "@/components/relations/RelationFormDialog";
import { RelationRow } from "@/components/relations/RelationRow";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { RelationWithDetails } from "@/types/relations";

interface RelationsTabProps {
  projectId: string;
  entityType: EntityType;
  entityId: string;
  entityLabel: string;
  filterToEntityType?: EntityType;
  onRefresh?: () => void;
}

export function RelationsTab({
  projectId,
  entityType,
  entityId,
  entityLabel,
  filterToEntityType,
  onRefresh,
}: RelationsTabProps) {
  const t = useTranslations("relations");
  const [relations, setRelations] = useState<RelationWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRelation, setEditingRelation] = useState<RelationWithDetails | undefined>(
    undefined,
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/relations?entityType=${entityType}&entityId=${encodeURIComponent(entityId)}&projectId=${encodeURIComponent(projectId)}`,
      );
      if (res.ok) {
        // The list envelope is now uniform, so the old
        // `Array.isArray(data) ? … : data.data` normalisation is gone.
        const data = (await res.json()) as { data?: RelationWithDetails[] };
        setRelations(data.data ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, [entityType, entityId, projectId]);

  useEffect(() => {
    void load();
  }, [load]);

  const outgoing = relations
    .filter((r) => r.from_id === entityId)
    .filter((r) => !filterToEntityType || r.to_type === filterToEntityType);
  const incoming = relations
    .filter((r) => r.to_id === entityId && r.from_id !== entityId)
    .filter((r) => !filterToEntityType || r.from_type === filterToEntityType);

  function handleEdit(relation: RelationWithDetails) {
    setEditingRelation(relation);
    setDialogOpen(true);
  }

  function handleAddNew() {
    setEditingRelation(undefined);
    setDialogOpen(true);
  }

  if (loading) {
    return (
      <div className="text-muted-foreground flex items-center gap-2 py-8">
        <Loader2 className="h-4 w-4 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button type="button" size="sm" onClick={handleAddNew}>
          <Plus className="mr-1 h-4 w-4" />
          {t("add")}
        </Button>
      </div>

      {/* Outgoing relations */}
      <div className="space-y-2">
        <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
          {t("outgoing")}
        </p>
        {outgoing.length === 0 ? (
          <p className="text-muted-foreground text-sm">{t("noRelations")}</p>
        ) : (
          outgoing.map((r) => (
            <RelationRow
              key={r.id}
              relation={r}
              onEdit={handleEdit}
              onDeleted={() => {
                void load();
                onRefresh?.();
              }}
              {...(onRefresh ? { onEvidenceChange: onRefresh } : {})}
            />
          ))
        )}
      </div>

      <Separator />

      {/* Incoming relations */}
      <div className="space-y-2">
        <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
          {t("incoming")}
        </p>
        {incoming.length === 0 ? (
          <p className="text-muted-foreground text-sm">{t("noRelations")}</p>
        ) : (
          incoming.map((r) => (
            <RelationRow
              key={r.id}
              relation={r}
              onEdit={handleEdit}
              onDeleted={() => {
                void load();
                onRefresh?.();
              }}
              {...(onRefresh ? { onEvidenceChange: onRefresh } : {})}
            />
          ))
        )}
      </div>

      <RelationFormDialog
        key={editingRelation?.id ?? "new"}
        open={dialogOpen}
        onOpenChange={(o) => {
          setDialogOpen(o);
          if (!o) setEditingRelation(undefined);
        }}
        projectId={projectId}
        prefillFrom={
          editingRelation ? undefined : { type: entityType, id: entityId, label: entityLabel }
        }
        prefillToEntityType={editingRelation ? undefined : filterToEntityType}
        editRelation={editingRelation}
        onSuccess={() => {
          void load();
          onRefresh?.();
        }}
      />
    </div>
  );
}
