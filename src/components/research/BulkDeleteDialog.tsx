"use client";

import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface BulkDeleteDialogProps {
  count: number;
  open: boolean;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}

export function BulkDeleteDialog({ count, open, onConfirm, onCancel }: BulkDeleteDialogProps) {
  const t = useTranslations("persons.bulk");
  const [isLoading, setIsLoading] = useState(false);

  async function handleConfirm() {
    setIsLoading(true);
    try {
      await onConfirm();
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o && !isLoading) onCancel();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("confirm_title", { count })}</DialogTitle>
          <DialogDescription>{t("confirm_body", { count })}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t("delete_button")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
