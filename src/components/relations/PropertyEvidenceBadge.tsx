"use client";

import type { EntityType } from "@prisma/client";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";

import { PropertyEvidencePanel } from "@/components/relations/PropertyEvidencePanel";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface PropertyEvidenceBadgeProps {
  projectId: string;
  entityType: EntityType;
  entityId: string;
  property: string;
  fieldLabel: string;
  /** Pass true when this field has a certainty claim — shows warning state when count is 0. */
  hasCertainty?: boolean;
}

export function PropertyEvidenceBadge({
  projectId,
  entityType,
  entityId,
  property,
  fieldLabel,
  hasCertainty = false,
}: PropertyEvidenceBadgeProps) {
  const t = useTranslations("propertyEvidence");
  const [count, setCount] = useState<number | null>(null);
  const [open, setOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

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
  }, [loadCount, refreshKey]);

  // Still loading — render nothing
  if (count === null) return null;

  // No evidence and no certainty claim — don't render at all
  if (count === 0 && !hasCertainty) return null;

  const isWarning = count === 0 && hasCertainty;
  const countLabel =
    count === 1 ? t("badgeLabel_one", { count }) : t("badgeLabel_other", { count });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`${fieldLabel}: ${countLabel}`}
          aria-haspopup="dialog"
          aria-expanded={open}
          className={
            isWarning
              ? "inline-flex cursor-pointer items-center rounded-full border border-dashed border-[var(--color-warning-border)] bg-[var(--color-warning-background)] px-1.5 py-0.5 font-mono text-xs text-[var(--color-warning-foreground)] tabular-nums"
              : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground inline-flex cursor-pointer items-center rounded-full px-1.5 py-0.5 font-mono text-xs tabular-nums transition-colors"
          }
        >
          {count}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-3" align="start">
        <PropertyEvidencePanel
          projectId={projectId}
          entityType={entityType}
          entityId={entityId}
          property={property}
          onEvidenceChange={() => setRefreshKey((k) => k + 1)}
        />
      </PopoverContent>
    </Popover>
  );
}
