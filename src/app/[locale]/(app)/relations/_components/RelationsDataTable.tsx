"use client";

import { Loader2, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";

import { RelationFormDialog } from "@/components/relations/RelationFormDialog";
import { RelationRow } from "@/components/relations/RelationRow";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRelationTypes } from "@/hooks/use-relation-types";
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
  const [entityTypeFilter, setEntityTypeFilter] = useState<string>("");
  const [relationTypeFilter, setRelationTypeFilter] = useState<string>("");
  const [certaintyFilter, setCertaintyFilter] = useState<string>("");

  const { data: allRelationTypes } = useRelationTypes(projectId);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        projectId,
        page: String(page),
        limit: String(PAGE_SIZE),
      });
      if (search) params.set("q", search);
      if (entityTypeFilter) params.set("fromType", entityTypeFilter);
      if (relationTypeFilter) params.set("relationTypeId", relationTypeFilter);
      if (certaintyFilter) params.set("certainty", certaintyFilter);
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
  }, [projectId, page, search, entityTypeFilter, relationTypeFilter, certaintyFilter]);

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
      <div className="flex flex-wrap gap-2">
        <Select
          value={entityTypeFilter || "__all__"}
          onValueChange={(value) => {
            setEntityTypeFilter(value === "__all__" ? "" : value);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-auto">
            <SelectValue placeholder={t("filter.all_entity_types")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">{t("filter.all_entity_types")}</SelectItem>
            <SelectItem value="PERSON">{t("entityTypes.PERSON")}</SelectItem>
            <SelectItem value="EVENT">{t("entityTypes.EVENT")}</SelectItem>
            <SelectItem value="SOURCE">{t("entityTypes.SOURCE")}</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={relationTypeFilter || "__all__"}
          onValueChange={(value) => {
            setRelationTypeFilter(value === "__all__" ? "" : value);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-auto">
            <SelectValue placeholder={t("filter.all_types")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">{t("filter.all_types")}</SelectItem>
            {allRelationTypes.map((rt) => (
              <SelectItem key={rt.id} value={rt.id}>
                {rt.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={certaintyFilter || "__all__"}
          onValueChange={(value) => {
            setCertaintyFilter(value === "__all__" ? "" : value);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-auto">
            <SelectValue placeholder={t("filter.all_certainties")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">{t("filter.all_certainties")}</SelectItem>
            <SelectItem value="CERTAIN">{t("certainties.CERTAIN")}</SelectItem>
            <SelectItem value="PROBABLE">{t("certainties.PROBABLE")}</SelectItem>
            <SelectItem value="POSSIBLE">{t("certainties.POSSIBLE")}</SelectItem>
            <SelectItem value="UNKNOWN">{t("certainties.UNKNOWN")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-between gap-2">
        <Input
          placeholder={t("list.search_placeholder")}
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
        <div className="text-muted-foreground flex items-center gap-2 py-8">
          <Loader2 className="h-4 w-4 animate-spin" />
        </div>
      ) : relations.length === 0 ? (
        <p className="text-muted-foreground py-8 text-center text-sm">{t("noRelations")}</p>
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
          <p className="text-muted-foreground text-sm">{t("list.total", { count: total })}</p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              {t("list.previous")}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              {t("list.next")}
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
