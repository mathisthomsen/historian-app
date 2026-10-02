"use client";

import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { errorCode, readErrorBody } from "@/lib/api-error";

export type AccessRequestStatus = "PENDING" | "INVITED" | "DECLINED";

interface AccessRequestDecisionProps {
  requestId: string;
  initialStatus: AccessRequestStatus;
  /** A `User` already exists for the request's email: nothing left to decide (§6.3). */
  accountExists: boolean;
}

type Decision = "approve" | "decline";
type Outcome = "invited" | "declined" | "emailNotSent";
type ErrorKey = "generic" | "forbidden" | "notFound" | "network";

/**
 * The operator's decision control (spec §6.3).
 *
 * Sends the decision as same-origin JSON: a relative URL, `Content-Type:
 * application/json`. The browser attaches `Origin` to such a POST, which the
 * route requires (D3, I14); nothing here can or should set it.
 */
export function AccessRequestDecision({
  requestId,
  initialStatus,
  accountExists: initialAccountExists,
}: AccessRequestDecisionProps) {
  const t = useTranslations("admin.accessRequest");
  const [status, setStatus] = useState<AccessRequestStatus>(initialStatus);
  const [accountExists, setAccountExists] = useState(initialAccountExists);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [error, setError] = useState<ErrorKey | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // State updates are asynchronous; the ref makes a second click within the same
  // tick a no-op, so one decision is exactly one request.
  const inFlight = useRef(false);

  async function decide(decision: Decision) {
    if (inFlight.current) return;
    inFlight.current = true;
    setIsSubmitting(true);
    setError(null);
    setOutcome(null);
    try {
      const res = await fetch(`/api/admin/access-requests/${encodeURIComponent(requestId)}`, {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision }),
      });
      if (res.ok) {
        const body = (await res.json()) as { status: AccessRequestStatus; email_sent?: boolean };
        setStatus(body.status);
        setOutcome(
          body.status === "DECLINED"
            ? "declined"
            : body.email_sent === false
              ? "emailNotSent"
              : "invited",
        );
        return;
      }
      if (res.status === 409 && errorCode(await readErrorBody(res)) === "EMAIL_TAKEN") {
        setAccountExists(true);
        return;
      }
      setError(res.status === 404 ? "notFound" : res.status === 403 ? "forbidden" : "generic");
    } catch {
      setError("network");
    } finally {
      inFlight.current = false;
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm">
        <span className="text-muted-foreground">{t("fields.status")}: </span>
        <span className="font-medium">{t(`status.${status}`)}</span>
      </p>

      {outcome && (
        <div role="status" className="bg-muted rounded-md p-3 text-sm">
          {t(`outcome.${outcome}`)}
        </div>
      )}
      {error && (
        <div role="alert" className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
          {t(`errors.${error}`)}
        </div>
      )}

      {accountExists ? (
        <p className="text-muted-foreground text-sm">{t("accountExists")}</p>
      ) : (
        <div className="flex flex-wrap gap-3">
          <Button type="button" disabled={isSubmitting} onClick={() => void decide("approve")}>
            {isSubmitting ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
            {status === "INVITED" ? t("reinvite") : t("approve")}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={isSubmitting}
            onClick={() => void decide("decline")}
          >
            {t("decline")}
          </Button>
        </div>
      )}
    </div>
  );
}
