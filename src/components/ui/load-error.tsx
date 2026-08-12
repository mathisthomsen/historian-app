"use client";

import { AlertCircle } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface LoadErrorProps {
  onRetry: () => void;
  className?: string;
}

/**
 * Explicit "this request failed" state for client-side data loads.
 *
 * Six components resolved a failed fetch to their empty state, so a 500, a 403, an
 * expired session or a dropped connection rendered identically to a successful
 * empty response. On the authority tables that invites duplicate terms; on the
 * evidence surfaces "the request failed" read as "this claim has no evidence",
 * which in a claim-integrity product is a correctness-of-record defect (issue #34).
 */
export function LoadError({ onRetry, className }: LoadErrorProps) {
  const t = useTranslations("common");

  return (
    <div
      role="alert"
      className={cn(
        "text-muted-foreground flex flex-wrap items-center gap-2 py-4 text-sm",
        className,
      )}
    >
      <AlertCircle className="text-destructive h-4 w-4 shrink-0" aria-hidden="true" />
      <span>{t("loadFailed")}</span>
      <Button type="button" variant="outline" size="sm" onClick={onRetry}>
        {t("tryAgain")}
      </Button>
    </div>
  );
}
