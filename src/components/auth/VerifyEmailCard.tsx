"use client";

import { CheckCircle, Loader2, XCircle } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { errorCode, readErrorBody, retryAfterMinutes } from "@/lib/api-error";
import { VERIFY_EMAIL_RATE_LIMIT_MINUTES } from "@/lib/auth-errors";

interface VerifyEmailCardProps {
  token: string | null;
}

type VerifyState = "pending" | "success" | "noToken" | "linkRejected" | "requestFailed";

export function VerifyEmailCard({ token }: VerifyEmailCardProps) {
  const t = useTranslations("auth");
  const [state, setState] = useState<VerifyState>(token ? "pending" : "noToken");
  const [detail, setDetail] = useState<string>("");

  const verify = useCallback(async () => {
    if (!token) return;
    setState("pending");
    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      if (res.ok) {
        setState("success");
        return;
      }

      // Four distinct causes used to render "Ungültiger Link." Three of them tell
      // the user their link is broken when it is not, and none offered a retry
      // (issue #48).
      if (res.status === 429) {
        setDetail(
          t("errors.rateLimited", {
            minutes: retryAfterMinutes(res, VERIFY_EMAIL_RATE_LIMIT_MINUTES),
          }),
        );
        setState("requestFailed");
        return;
      }
      if (res.status >= 500) {
        setDetail(t("errors.serverError"));
        setState("requestFailed");
        return;
      }

      const code = errorCode(await readErrorBody(res));
      setDetail(t(code === "TOKEN_EXPIRED" ? "errors.tokenExpired" : "errors.tokenInvalid"));
      setState("linkRejected");
    } catch {
      setDetail(t("errors.networkError"));
      setState("requestFailed");
    }
  }, [token, t]);

  useEffect(() => {
    void verify();
  }, [verify]);

  if (state === "pending") {
    return (
      <div className="text-muted-foreground flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>{t("verify.verifying")}</span>
      </div>
    );
  }

  if (state === "success") {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-green-600">
          <CheckCircle className="h-5 w-5" />
          <span className="font-medium">{t("verify.success")}</span>
        </div>
        <p className="text-muted-foreground text-sm">{t("verify.successMessage")}</p>
        <Link href="/auth/login" className="text-primary text-sm hover:underline">
          {t("verify.loginNow")} →
        </Link>
      </div>
    );
  }

  // Arriving with no ?token is not a broken link — it used to render the same
  // string as both headline and body.
  if (state === "noToken") {
    return (
      <div className="space-y-3" role="alert">
        <div className="text-destructive flex items-center gap-2">
          <XCircle className="h-5 w-5" />
          <span className="font-medium">{t("verify.noTokenTitle")}</span>
        </div>
        <p className="text-muted-foreground text-sm">{t("verify.noTokenMessage")}</p>
        <Link href="/auth/login" className="text-primary text-sm hover:underline">
          {t("verify.loginNow")} →
        </Link>
      </div>
    );
  }

  // The request itself failed (429, 5xx, offline). The link is probably fine, so
  // offer a retry rather than telling the user to get a new one.
  if (state === "requestFailed") {
    return (
      <div className="space-y-3" role="alert">
        <div className="text-destructive flex items-center gap-2">
          <XCircle className="h-5 w-5" />
          <span className="font-medium">{t("verify.failedTitle")}</span>
        </div>
        <p className="text-muted-foreground text-sm">{detail}</p>
        <Button type="button" variant="outline" size="sm" onClick={() => void verify()}>
          {t("verify.retry")}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3" role="alert">
      <div className="text-destructive flex items-center gap-2">
        <XCircle className="h-5 w-5" />
        <span className="font-medium">{t("verify.linkInvalidTitle")}</span>
      </div>
      <p className="text-muted-foreground text-sm">{detail}</p>
      <Link href="/auth/forgot-password" className="text-primary text-sm hover:underline">
        {t("verify.requestNew")} →
      </Link>
    </div>
  );
}
