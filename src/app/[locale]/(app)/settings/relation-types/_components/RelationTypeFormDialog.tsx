"use client";

import type { EntityType } from "@prisma/client";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { RelationTypeItem } from "@/types/relations";

interface RelationTypeFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  editType?: RelationTypeItem | undefined;
  onSuccess: () => void;
}

const ENTITY_TYPES: EntityType[] = ["PERSON", "EVENT", "SOURCE", "LOCATION", "LITERATURE"];

export function RelationTypeFormDialog({
  open,
  onOpenChange,
  projectId,
  editType,
  onSuccess,
}: RelationTypeFormDialogProps) {
  const t = useTranslations("relationTypes");
  const isEdit = !!editType;

  const [name, setName] = useState(editType?.name ?? "");
  const [inverseName, setInverseName] = useState(editType?.inverse_name ?? "");
  const [description, setDescription] = useState(editType?.description ?? "");
  const [color, setColor] = useState(editType?.color ?? "");
  const [icon, setIcon] = useState(editType?.icon ?? "");
  const [validFromTypes, setValidFromTypes] = useState<EntityType[]>(
    editType?.valid_from_types ?? [],
  );
  const [validToTypes, setValidToTypes] = useState<EntityType[]>(editType?.valid_to_types ?? []);
  const [saving, setSaving] = useState(false);

  // Reset when editType changes
  useEffect(() => {
    setName(editType?.name ?? "");
    setInverseName(editType?.inverse_name ?? "");
    setDescription(editType?.description ?? "");
    setColor(editType?.color ?? "");
    setIcon(editType?.icon ?? "");
    setValidFromTypes(editType?.valid_from_types ?? []);
    setValidToTypes(editType?.valid_to_types ?? []);
  }, [editType, open]);

  function toggleFromType(type: EntityType) {
    setValidFromTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
    );
  }

  function toggleToType(type: EntityType) {
    setValidToTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      const body = {
        project_id: projectId,
        name: name.trim(),
        inverse_name: inverseName.trim() || null,
        description: description.trim() || null,
        color: color.trim() || null,
        icon: icon.trim() || null,
        valid_from_types: validFromTypes,
        valid_to_types: validToTypes,
      };

      const url = isEdit ? `/api/relation-types/${editType!.id}` : "/api/relation-types";
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
          {/* Name */}
          <div className="space-y-1">
            <Label htmlFor="rt-name">{t("fields.name")}</Label>
            <Input id="rt-name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>

          {/* Inverse name */}
          <div className="space-y-1">
            <Label>{t("fields.inverseName")}</Label>
            <Input
              value={inverseName}
              onChange={(e) => setInverseName(e.target.value)}
              placeholder="z. B. ist Kind von"
            />
          </div>

          {/* Description */}
          <div className="space-y-1">
            <Label>{t("fields.description")}</Label>
            <textarea
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Color + Icon row */}
          <div className="flex gap-4">
            <div className="flex-1 space-y-1">
              <Label>{t("fields.color")}</Label>
              <div className="flex items-center gap-2">
                {color && (
                  <span
                    className="h-5 w-5 rounded-full border border-border"
                    style={{ backgroundColor: color }}
                  />
                )}
                <Input
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  placeholder="#3b82f6"
                  className="font-mono text-sm"
                />
              </div>
            </div>
            <div className="flex-1 space-y-1">
              <Label>{t("fields.icon")}</Label>
              <Input
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                placeholder="link, user, …"
              />
            </div>
          </div>

          {/* Valid from types */}
          <div className="space-y-2">
            <Label>{t("fields.validFromTypes")}</Label>
            <div className="flex flex-wrap gap-3">
              {ENTITY_TYPES.map((type) => (
                <label key={type} className="flex cursor-pointer items-center gap-1.5 text-sm">
                  <Checkbox
                    checked={validFromTypes.includes(type)}
                    onCheckedChange={() => toggleFromType(type)}
                  />
                  {t(`entityTypes.${type}`)}
                </label>
              ))}
            </div>
          </div>

          {/* Valid to types */}
          <div className="space-y-2">
            <Label>{t("fields.validToTypes")}</Label>
            <div className="flex flex-wrap gap-3">
              {ENTITY_TYPES.map((type) => (
                <label key={type} className="flex cursor-pointer items-center gap-1.5 text-sm">
                  <Checkbox
                    checked={validToTypes.includes(type)}
                    onCheckedChange={() => toggleToType(type)}
                  />
                  {t(`entityTypes.${type}`)}
                </label>
              ))}
            </div>
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
            <Button type="submit" disabled={saving || !name.trim()}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
