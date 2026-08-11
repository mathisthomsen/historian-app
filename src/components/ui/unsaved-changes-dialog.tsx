"use client";

import { useTranslations } from "next-intl";

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
import type { UnsavedChangesGuard } from "@/hooks/use-unsaved-changes";

type UnsavedChangesDialogProps = Pick<
  UnsavedChangesGuard,
  "isConfirming" | "confirmDiscard" | "setConfirming"
>;

/** Confirmation shown when leaving a dirty form. Pairs with `useUnsavedChanges`. */
export function UnsavedChangesDialog({
  isConfirming,
  confirmDiscard,
  setConfirming,
}: UnsavedChangesDialogProps) {
  const t = useTranslations("common");

  return (
    <AlertDialog open={isConfirming} onOpenChange={setConfirming}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("unsavedTitle")}</AlertDialogTitle>
          <AlertDialogDescription>{t("unsavedBody")}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          {/* Keeping the work is the safe default, so it holds the cancel slot. */}
          <AlertDialogCancel>{t("keepEditing")}</AlertDialogCancel>
          <AlertDialogAction onClick={confirmDiscard}>{t("discardChanges")}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
