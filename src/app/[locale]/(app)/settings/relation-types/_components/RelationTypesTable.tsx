"use client";

import { Loader2, Pencil, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { RelationTypeFormDialog } from "@/app/[locale]/(app)/settings/relation-types/_components/RelationTypeFormDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { LoadError } from "@/components/ui/load-error";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { RelationTypeItem } from "@/types/relations";

interface RelationTypesTableProps {
  projectId: string;
}

export function RelationTypesTable({ projectId }: RelationTypesTableProps) {
  const t = useTranslations("relationTypes");
  const [types, setTypes] = useState<RelationTypeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingType, setEditingType] = useState<RelationTypeItem | undefined>(undefined);
  const [deleteTarget, setDeleteTarget] = useState<RelationTypeItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function loadTypes() {
    setLoading(true);
    setFailed(false);
    try {
      const res = await fetch(`/api/relation-types?projectId=${encodeURIComponent(projectId)}`);
      if (!res.ok) {
        setFailed(true);
        return;
      }
      const data = (await res.json()) as RelationTypeItem[] | { data?: RelationTypeItem[] };
      if (Array.isArray(data)) {
        setTypes(data);
      } else if (data && Array.isArray((data as { data?: RelationTypeItem[] }).data)) {
        setTypes((data as { data: RelationTypeItem[] }).data);
      }
    } catch {
      // "No relation types" on an authority table invites duplicates (issue #34).
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadTypes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  async function handleDelete(type: RelationTypeItem) {
    if (type._count.relations > 0) {
      toast.error(t("deleteBlocked", { count: type._count.relations }));
      return;
    }
    setDeleteTarget(type);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/relation-types/${deleteTarget.id}`, { method: "DELETE" });
      if (res.ok) {
        setTypes((prev) => prev.filter((t) => t.id !== deleteTarget.id));
        setDeleteTarget(null);
        toast.success(t("deleted_toast"));
      } else {
        if (res.status === 409) {
          toast.error(t("deleteBlocked", { count: deleteTarget._count.relations }));
        } else {
          toast.error(t("delete_failed"));
        }
        setDeleteTarget(null);
      }
    } catch {
      // A rejected fetch previously cleared the pending flag and nothing else — no
      // toast, no row change, an unhandled rejection (issue #34).
      toast.error(t("delete_failed"));
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="text-muted-foreground flex items-center gap-2 py-8">
        <Loader2 className="h-4 w-4 animate-spin" />
      </div>
    );
  }

  if (failed) {
    return <LoadError onRetry={() => void loadTypes()} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            setEditingType(undefined);
            setFormOpen(true);
          }}
        >
          {t("add")}
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-8">{t("fields.color")}</TableHead>
            <TableHead>{t("fields.name")}</TableHead>
            <TableHead>{t("fields.inverseName")}</TableHead>
            <TableHead className="w-20 text-right">{t("fields.relationCount")}</TableHead>
            <TableHead className="w-20" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {types.map((type) => (
            <TableRow key={type.id}>
              <TableCell>
                {type.color ? (
                  <span
                    className="border-border inline-block h-5 w-5 rounded-full border"
                    style={{ backgroundColor: type.color }}
                  />
                ) : (
                  <span className="border-border inline-block h-5 w-5 rounded-full border border-dashed" />
                )}
              </TableCell>
              <TableCell className="font-medium">{type.name}</TableCell>
              <TableCell className="text-muted-foreground">{type.inverse_name ?? "—"}</TableCell>
              <TableCell className="text-muted-foreground text-right">
                {type._count.relations}
              </TableCell>
              <TableCell>
                <div className="flex justify-end gap-1">
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    aria-label={t("edit")}
                    onClick={() => {
                      setEditingType(type);
                      setFormOpen(true);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    aria-label={t("delete")}
                    onClick={() => void handleDelete(type)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}

          {types.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-muted-foreground py-8 text-center">
                —
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <RelationTypeFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        projectId={projectId}
        editType={editingType}
        onSuccess={() => void loadTypes()}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("delete_confirm_title")}</AlertDialogTitle>
            <AlertDialogDescription>{t("delete_confirm_body")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void confirmDelete()}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
