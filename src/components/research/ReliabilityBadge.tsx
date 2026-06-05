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
    return <Badge variant="success">{t("reliability_high")}</Badge>;
  }

  if (reliability === "MEDIUM") {
    return <Badge variant="warning">{t("reliability_medium")}</Badge>;
  }

  if (reliability === "LOW") {
    return <Badge variant="destructive">{t("reliability_low")}</Badge>;
  }

  return <Badge variant="secondary">{t("reliability_unknown")}</Badge>;
}
