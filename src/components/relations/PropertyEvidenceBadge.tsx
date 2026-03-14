"use client";

import type { EntityType } from "@prisma/client";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";

import { PropertyEvidencePanel } from "@/components/relations/PropertyEvidencePanel";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface PropertyEvidenceBadgeProps {
  projectId: string;
  entityType: EntityType;
  entityId: string;
  property: string;
  fieldLabel: string;
}

export function PropertyEvidenceBadge({
  projectId,
  entityType,
  entityId,
  property,
  fieldLabel,
}: PropertyEvidenceBadgeProps) {
  const t = useTranslations("propertyEvidence");
  const [count, setCount] = useState(0);
  const [open, setOpen] = useState(false);

  const loadCount = useCallback(async () => {
    const res = await fetch(
      `/api/property-evidence?projectId=${encodeURIComponent(projectId)}&entityType=${entityType}&entityId=${encodeURIComponent(entityId)}&property=${encodeURIComponent(property)}`,
    );
    if (res.ok) {
      const data = (await res.json()) as { data?: unknown[] };
      setCount(data.data?.length ?? 0);
    }
  }, [projectId, entityType, entityId, property]);

  useEffect(() => {
    void loadCount();
  }, [loadCount]);

  const label =
    count === 1
      ? t("badgeLabel_one", { count })
      : t("badgeLabel_other", { count });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button" aria-label={`${fieldLabel}: ${label}`}>
          <Badge
            variant={count > 0 ? "default" : "outline"}
            className="cursor-pointer text-xs"
          >
            {label}
          </Badge>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-3" align="start">
        <PropertyEvidencePanel
          projectId={projectId}
          entityType={entityType}
          entityId={entityId}
          property={property}
        />
      </PopoverContent>
    </Popover>
  );
}
