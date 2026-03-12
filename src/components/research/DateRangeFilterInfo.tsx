"use client";

import { Info } from "lucide-react";
import { useTranslations } from "next-intl";

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export function DateRangeFilterInfo() {
  const t = useTranslations("events.list");

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className="inline-flex items-center text-muted-foreground hover:text-foreground"
            aria-label={t("date_range_tooltip")}
          >
            <Info className="h-4 w-4" />
          </button>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs text-xs">{t("date_range_tooltip")}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
