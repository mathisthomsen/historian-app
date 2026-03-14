"use client";

import type { Certainty, EntityType } from "@prisma/client";
import { ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

import { EntitySelector } from "@/components/relations/EntitySelector";
import { RelationTypeSelector } from "@/components/relations/RelationTypeSelector";
import { CertaintySelector } from "@/components/research/CertaintySelector";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRelationTypes } from "@/hooks/use-relation-types";
import type { RelationWithDetails } from "@/types/relations";

interface RelationFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  prefillFrom?: { type: EntityType; id: string; label: string } | undefined;
  prefillTo?: { type: EntityType; id: string; label: string } | undefined;
  editRelation?: RelationWithDetails | undefined;
  onSuccess: () => void;
}

export function RelationFormDialog({
  open,
  onOpenChange,
  projectId,
  prefillFrom,
  prefillTo,
  editRelation,
  onSuccess,
}: RelationFormDialogProps) {
  const t = useTranslations("relations");
  const { data: allTypes } = useRelationTypes(projectId);

  const [fromEntity, setFromEntity] = useState<{
    type: EntityType;
    id: string;
    label: string;
  } | null>(prefillFrom ?? null);
  const [toEntity, setToEntity] = useState<{
    type: EntityType;
    id: string;
    label: string;
  } | null>(prefillTo ?? null);
  const [relationTypeId, setRelationTypeId] = useState<string | null>(
    editRelation?.relation_type.id ?? null,
  );
  const [certainty, setCertainty] = useState<Certainty>(editRelation?.certainty ?? "UNKNOWN");
  const [notes, setNotes] = useState(editRelation?.notes ?? "");
  const [showTemporal, setShowTemporal] = useState(false);
  const [validFromYear, setValidFromYear] = useState(
    editRelation?.valid_from_year?.toString() ?? "",
  );
  const [validFromMonth, setValidFromMonth] = useState(
    editRelation?.valid_from_month?.toString() ?? "",
  );
  const [validFromCert, setValidFromCert] = useState<Certainty>(
    editRelation?.valid_from_cert ?? "UNKNOWN",
  );
  const [validToYear, setValidToYear] = useState(editRelation?.valid_to_year?.toString() ?? "");
  const [validToMonth, setValidToMonth] = useState(
    editRelation?.valid_to_month?.toString() ?? "",
  );
  const [validToCert, setValidToCert] = useState<Certainty>(
    editRelation?.valid_to_cert ?? "UNKNOWN",
  );
  const [saving, setSaving] = useState(false);

  const isEdit = !!editRelation;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!fromEntity || !toEntity || !relationTypeId) return;

    setSaving(true);
    try {
      const body = {
        project_id: projectId,
        from_type: fromEntity.type,
        from_id: fromEntity.id,
        to_type: toEntity.type,
        to_id: toEntity.id,
        relation_type_id: relationTypeId,
        certainty,
        notes: notes || null,
        valid_from_year: validFromYear ? parseInt(validFromYear) : null,
        valid_from_month: validFromMonth ? parseInt(validFromMonth) : null,
        valid_from_cert: validFromCert,
        valid_to_year: validToYear ? parseInt(validToYear) : null,
        valid_to_month: validToMonth ? parseInt(validToMonth) : null,
        valid_to_cert: validToCert,
      };

      const url = isEdit ? `/api/relations/${editRelation.id}` : "/api/relations";
      const method = isEdit ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        toast.success(t("saved_toast"));
        onSuccess();
        onOpenChange(false);
      } else {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        toast.error(data.error ?? t("saved_toast"));
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? t("edit") : t("add")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          {/* From entity */}
          <div className="space-y-1">
            <Label>{t("fields.fromEntity")}</Label>
            <EntitySelector
              value={fromEntity ? { type: fromEntity.type, id: fromEntity.id } : null}
              onChange={(v) =>
                setFromEntity(v ? { type: v.type, id: v.id, label: v.label } : null)
              }
              projectId={projectId}
              disabled={!!prefillFrom}
            />
          </div>

          {/* Relation type */}
          <div className="space-y-1">
            <Label>{t("fields.relationType")}</Label>
            <RelationTypeSelector
              allTypes={allTypes}
              fromType={fromEntity?.type ?? null}
              toType={toEntity?.type ?? null}
              value={relationTypeId}
              onChange={setRelationTypeId}
            />
          </div>

          {/* To entity */}
          <div className="space-y-1">
            <Label>{t("fields.toEntity")}</Label>
            <EntitySelector
              value={toEntity ? { type: toEntity.type, id: toEntity.id } : null}
              onChange={(v) =>
                setToEntity(v ? { type: v.type, id: v.id, label: v.label } : null)
              }
              projectId={projectId}
              disabled={!!prefillTo}
            />
          </div>

          {/* Certainty */}
          <CertaintySelector
            value={certainty}
            onChange={setCertainty}
            label={t("fields.certainty")}
          />

          {/* Notes */}
          <div className="space-y-1">
            <Label>{t("fields.notes")}</Label>
            <textarea
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {/* Temporal validity collapsible */}
          <div className="rounded-md border">
            <button
              type="button"
              className="flex w-full items-center justify-between px-3 py-2 text-sm font-medium hover:bg-muted"
              onClick={() => setShowTemporal((prev) => !prev)}
            >
              <span>{t("fields.temporalValidity")}</span>
              {showTemporal ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>
            {showTemporal && (
              <div className="space-y-3 border-t px-3 py-3">
                {/* Valid from */}
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">{t("fields.validFrom")}</p>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="Jahr"
                      value={validFromYear}
                      onChange={(e) => setValidFromYear(e.target.value)}
                      className="w-24"
                    />
                    <Input
                      type="number"
                      placeholder="Monat"
                      min={1}
                      max={12}
                      value={validFromMonth}
                      onChange={(e) => setValidFromMonth(e.target.value)}
                      className="w-20"
                    />
                  </div>
                  <CertaintySelector value={validFromCert} onChange={setValidFromCert} />
                </div>
                {/* Valid to */}
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">{t("fields.validTo")}</p>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="Jahr"
                      value={validToYear}
                      onChange={(e) => setValidToYear(e.target.value)}
                      className="w-24"
                    />
                    <Input
                      type="number"
                      placeholder="Monat"
                      min={1}
                      max={12}
                      value={validToMonth}
                      onChange={(e) => setValidToMonth(e.target.value)}
                      className="w-20"
                    />
                  </div>
                  <CertaintySelector value={validToCert} onChange={setValidToCert} />
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              {t("cancel")}
            </Button>
            <Button
              type="submit"
              disabled={saving || !fromEntity || !toEntity || !relationTypeId}
            >
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEdit ? t("save") : t("create")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
