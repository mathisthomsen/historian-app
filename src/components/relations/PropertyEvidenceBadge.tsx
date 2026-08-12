"use client";

import type { Certainty, EntityType } from "@prisma/client";
import { AlertTriangle } from "lucide-react";
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
  /**
   * The certainty this field is asserted with, when it carries one.
   *
   * Replaces the old `hasCertainty` boolean, which callers passed as
   * `hasStartDate` — so the warning fired whenever *a date existed*, never
   * consulting the level. An honest UNKNOWN non-claim was flagged as a problem,
   * diluting the signal that should mark a high-certainty claim with no
   * evidence (issue #37).
   */
  certainty?: Certainty | undefined;
}

/** Only an actual claim can be "unevidenced". UNKNOWN/POSSIBLE assert little. */
function isClaim(certainty: Certainty | undefined): boolean {
  return certainty === "CERTAIN" || certainty === "PROBABLE";
}

export function PropertyEvidenceBadge({
  projectId,
  entityType,
  entityId,
  property,
  fieldLabel,
  certainty,
}: PropertyEvidenceBadgeProps) {
  const t = useTranslations("propertyEvidence");
  const tCommon = useTranslations("common");
  const [count, setCount] = useState<number | null>(null);
  const [failed, setFailed] = useState(false);
  const [open, setOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const loadCount = useCallback(async () => {
    setFailed(false);
    try {
      const res = await fetch(
        `/api/property-evidence?projectId=${encodeURIComponent(projectId)}&entityType=${entityType}&entityId=${encodeURIComponent(entityId)}&property=${encodeURIComponent(property)}`,
      );
      if (!res.ok) {
        setFailed(true);
        return;
      }
      const data = (await res.json()) as { data?: unknown[] };
      setCount(data.data?.length ?? 0);
    } catch {
      setFailed(true);
    }
  }, [projectId, entityType, entityId, property]);

  useEffect(() => {
    void loadCount();
  }, [loadCount, refreshKey]);

  // A failed load previously left `count` null, so the badge vanished — silently
  // removing the unevidenced warning and upgrading an unevidenced claim's
  // appearance. Say the count is unknown instead (issue #34).
  if (failed) {
    return (
      <button
        type="button"
        onClick={() => void loadCount()}
        aria-label={`${fieldLabel}: ${tCommon("evidenceCountFailed")}. ${tCommon("tryAgain")}`}
        className="border-destructive/50 text-destructive hover:bg-destructive/10 inline-flex cursor-pointer items-center rounded-full border border-dashed px-1.5 py-0.5 font-mono text-xs transition-colors"
      >
        ?
      </button>
    );
  }

  // Still loading — render nothing
  if (count === null) return null;

  // The badge used to return null at count 0 without a certainty claim, so on a
  // freshly catalogued record every field rendered no badge — and the popover it
  // triggers is the only add-evidence control on the surface, making it
  // unreachable (issue #37). It now always renders once the count is known.
  const isWarning = count === 0 && isClaim(certainty);
  const countLabel =
    count === 1 ? t("badgeLabel_one", { count }) : t("badgeLabel_other", { count });
  const label = isWarning
    ? t("unevidencedLabel", {
        field: fieldLabel,
        level: tCommon(`certainty.${certainty as Certainty}`),
      })
    : `${fieldLabel}: ${count === 0 ? t("noEvidenceYet") : countLabel}`;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={label}
          title={label}
          aria-haspopup="dialog"
          aria-expanded={open}
          className={
            isWarning
              ? // The design system already ships this state as a badge variant with
                // a full token family; the component used to hand-roll warning
                // classnames and the variant was referenced by nothing.
                "certainty-unevidenced inline-flex cursor-pointer items-center gap-1 rounded-full border px-1.5 py-0.5 text-xs font-semibold"
              : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground inline-flex cursor-pointer items-center rounded-full px-1.5 py-0.5 font-mono text-xs tabular-nums transition-colors"
          }
        >
          {isWarning ? (
            // The warning state's entire content used to be the digit 0, and the
            // word "Unbelegt" appeared in no message file.
            <>
              <AlertTriangle className="h-3 w-3" aria-hidden="true" />
              {t("unevidenced")}
            </>
          ) : (
            count
          )}
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
