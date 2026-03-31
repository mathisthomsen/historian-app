"use client";

import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import type { SourceReliability } from "@/types/source";

interface ReliabilityBadgeProps {
  reliability: SourceReliability;
}

export function ReliabilityBadge({ reliability }: ReliabilityBadgeProps) {
  const t = useTranslations("sources");

  if (reliability === "HIGH") {
    return (
      <Badge
        variant="outline"
        className="border-green-600 bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300"
      >
        {t("reliability_high")}
      </Badge>
    );
  }

  if (reliability === "MEDIUM") {
    return (
      <Badge
        variant="outline"
        className="border-yellow-600 bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300"
      >
        {t("reliability_medium")}
      </Badge>
    );
  }

  if (reliability === "LOW") {
    return (
      <Badge
        variant="outline"
        className="border-red-600 bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300"
      >
        {t("reliability_low")}
      </Badge>
    );
  }

  return <Badge variant="secondary">{t("reliability_unknown")}</Badge>;
}
