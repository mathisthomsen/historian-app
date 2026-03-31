"use client";

import { Loader2, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

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

interface RelationDeleteButtonProps {
  relationId: string;
  onDeleted: () => void;
}

export function RelationDeleteButton({ relationId, onDeleted }: RelationDeleteButtonProps) {
  const t = useTranslations("relations");
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleConfirm() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/relations/${relationId}`, { method: "DELETE" });
      if (res.ok) {
        toast.success(t("deleted_toast"));
        onDeleted();
        setOpen(false);
      } else {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        toast.error(data.error ?? "Fehler beim Löschen.");
      }
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-7 w-7 p-0"
        onClick={() => setOpen(true)}
        aria-label={t("delete")}
      >
        <Trash2 className="h-3 w-3" />
      </Button>

      <AlertDialog open={open} onOpenChange={(o) => !deleting && setOpen(o)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("delete")}</AlertDialogTitle>
            <AlertDialogDescription>{t("deleteConfirm")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void handleConfirm()}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
