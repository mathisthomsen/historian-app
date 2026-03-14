"use client";

import { Loader2, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";

import { RelationFormDialog } from "@/components/relations/RelationFormDialog";
import { RelationRow } from "@/components/relations/RelationRow";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { RelationWithDetails } from "@/types/relations";

interface RelationsDataTableProps {
  projectId: string;
}

const PAGE_SIZE = 20;

export function RelationsDataTable({ projectId }: RelationsDataTableProps) {
  const t = useTranslations("relations");
  const [relations, setRelations] = useState<RelationWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRelation, setEditingRelation] = useState<RelationWithDetails | undefined>(
    undefined,
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        projectId,
        page: String(page),
        limit: String(PAGE_SIZE),
      });
      if (search) params.set("q", search);
      const res = await fetch(`/api/relations?${params.toString()}`);
      if (res.ok) {
        const data = (await res.json()) as {
          data?: RelationWithDetails[];
          total?: number;
        };
        setRelations(data.data ?? []);
        setTotal(data.total ?? 0);
      }
    } finally {
      setLoading(false);
    }
  }, [projectId, page, search]);

  useEffect(() => {
    void load();
  }, [load]);

  function handleEdit(relation: RelationWithDetails) {
    setEditingRelation(relation);
    setDialogOpen(true);
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <Input
          placeholder="Suchen…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="max-w-xs"
        />
        <Button
          type="button"
          size="sm"
          onClick={() => {
            setEditingRelation(undefined);
            setDialogOpen(true);
          }}
        >
          <Plus className="mr-1 h-4 w-4" />
          {t("add")}
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 py-8 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
        </div>
      ) : relations.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">{t("noRelations")}</p>
      ) : (
        <div className="space-y-2">
          {relations.map((r) => (
            <RelationRow
              key={r.id}
              relation={r}
              onEdit={handleEdit}
              onDeleted={() => void load()}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {total} gesamt
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Zurück
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Weiter
            </Button>
          </div>
        </div>
      )}

      <RelationFormDialog
        open={dialogOpen}
        onOpenChange={(o) => {
          setDialogOpen(o);
          if (!o) setEditingRelation(undefined);
        }}
        projectId={projectId}
        editRelation={editingRelation}
        onSuccess={() => void load()}
      />
    </div>
  );
}
