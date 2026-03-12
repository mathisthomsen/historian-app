"use client";

import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface DeleteEventButtonProps {
  id: string;
  locale: string;
  label: string;
  subEventCount?: number;
}

export function DeleteEventButton({
  id,
  locale,
  label,
  subEventCount = 0,
}: DeleteEventButtonProps) {
  const t = useTranslations("events");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    setLoading(true);
    try {
      const res = await fetch(`/api/events/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string; count?: number };
        if (data.count) {
          toast.error(t("delete_has_sub_events", { count: data.count }));
        } else {
          toast.error(t("errors.save_failed"));
        }
        return;
      }
      setOpen(false);
      toast.success(t("deleted_toast"));
      router.push(`/${locale}/events`);
    } catch {
      toast.error(t("errors.save_failed"));
    } finally {
      setLoading(false);
    }
  }

  if (subEventCount > 0) {
    return (
      <Button
        variant="destructive"
        size="sm"
        onClick={() => toast.error(t("delete_has_sub_events", { count: subEventCount }))}
      >
        {label}
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" size="sm">
          {label}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("delete_confirm_title")}</DialogTitle>
          <DialogDescription>{t("delete_confirm_body")}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t("delete")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
