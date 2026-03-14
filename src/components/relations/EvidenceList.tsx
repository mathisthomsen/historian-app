"use client";

import { Loader2, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

import { EvidenceForm } from "@/components/relations/EvidenceForm";
import { Button } from "@/components/ui/button";
import type { PropertyEvidenceItem } from "@/types/relations";

interface EvidenceListProps {
  items: PropertyEvidenceItem[];
  projectId: string;
  onAdd: (values: {
    source_id: string;
    source_title?: string;
    page_reference: string;
    quote: string;
    confidence: PropertyEvidenceItem["confidence"];
  }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  loading?: boolean;
}

export function EvidenceList({ items, projectId, onAdd, onDelete, loading }: EvidenceListProps) {
  const t = useTranslations("propertyEvidence");
  const [showForm, setShowForm] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await onDelete(id);
      toast.success(t("deleted_toast"));
    } catch {
      toast.error("Fehler beim Löschen.");
    } finally {
      setDeletingId(null);
    }
  }

  async function handleAdd(values: Parameters<typeof onAdd>[0]) {
    await onAdd(values);
    setShowForm(false);
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-4 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.length === 0 && !showForm && (
        <p className="text-sm text-muted-foreground">{t("noEvidence")}</p>
      )}

      <div className="max-h-48 space-y-2 overflow-y-auto">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-start justify-between gap-2 rounded-md border p-3 text-sm"
          >
            <div className="space-y-0.5">
              <p className="font-medium">{item.source_title ?? item.source_id}</p>
              {item.page_reference && (
                <p className="text-muted-foreground">{item.page_reference}</p>
              )}
              {item.quote && (
                <p className="italic text-muted-foreground">&ldquo;{item.quote}&rdquo;</p>
              )}
              <p className="text-xs text-muted-foreground">{item.confidence}</p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              disabled={deletingId === item.id}
              onClick={() => void handleDelete(item.id)}
              aria-label={t("delete")}
            >
              {deletingId === item.id ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Trash2 className="h-3 w-3" />
              )}
            </Button>
          </div>
        ))}
      </div>

      {showForm ? (
        <EvidenceForm
          projectId={projectId}
          onSubmit={handleAdd}
          onCancel={() => setShowForm(false)}
        />
      ) : (
        <Button type="button" variant="outline" size="sm" onClick={() => setShowForm(true)}>
          {t("add")}
        </Button>
      )}
    </div>
  );
}
