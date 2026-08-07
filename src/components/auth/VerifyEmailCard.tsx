"use client";

import { CheckCircle, Loader2, XCircle } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { errorCode, readErrorBody } from "@/lib/api-error";

interface VerifyEmailCardProps {
  token: string | null;
}

type VerifyState = "pending" | "success" | "error";

export function VerifyEmailCard({ token }: VerifyEmailCardProps) {
  const t = useTranslations("auth");
  const [state, setState] = useState<VerifyState>(token ? "pending" : "error");
  const [errorKey, setErrorKey] = useState<"tokenExpired" | "tokenInvalid">("tokenInvalid");

  useEffect(() => {
    if (!token) return;
    let cancelled = false;

    async function verify() {
      try {
        const res = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        if (cancelled) return;
        if (res.ok) {
          setState("success");
        } else {
          const code = errorCode(await readErrorBody(res));
          setErrorKey(code === "TOKEN_EXPIRED" ? "tokenExpired" : "tokenInvalid");
          setState("error");
        }
      } catch {
        if (!cancelled) setState("error");
      }
    }

    void verify();
    return () => {
      cancelled = true;
    };
  }, [token]);

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

  return (
    <div className="space-y-3">
      <div className="text-destructive flex items-center gap-2">
        <XCircle className="h-5 w-5" />
        <span className="font-medium">{t("errors.tokenInvalid")}</span>
      </div>
      <p className="text-muted-foreground text-sm">{t(`errors.${errorKey}`)}</p>
      <Link href="/auth/forgot-password" className="text-primary text-sm hover:underline">
        {t("verify.requestNew")} →
      </Link>
    </div>
  );
}
