"use client";

import { CheckCircle, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { retryAfterMinutes } from "@/lib/api-error";
import { RESEND_VERIFICATION_RATE_LIMIT_MINUTES } from "@/lib/auth-errors";

interface ResendVerificationProps {
  /** Prefills and hides the email field when the address is already known. */
  email?: string | undefined;
  id?: string;
}

/**
 * The self-service route back in for a user whose verification link expired, or
 * whose registration mail never went out.
 *
 * Until this existed, the only recovery action in the product pointed at
 * /auth/forgot-password, which sends a password reset — so there was no path to
 * a new confirmation link at all (issue #43).
 */
export function ResendVerification({ email, id }: ResendVerificationProps) {
  const t = useTranslations("auth");
  const [value, setValue] = useState(email ?? "");
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!value) return;
    setState("sending");
    setError(null);
    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: value }),
      });

      if (res.status === 429) {
        setError(
          t("errors.rateLimited", {
            minutes: retryAfterMinutes(res, RESEND_VERIFICATION_RATE_LIMIT_MINUTES),
          }),
        );
        setState("idle");
        return;
      }
      if (res.status === 503) {
        setError(t("errors.serviceUnavailable"));
        setState("idle");
        return;
      }
      if (!res.ok) {
        setError(t("errors.serverError"));
        setState("idle");
        return;
      }
      setState("sent");
    } catch {
      setError(t("errors.networkError"));
      setState("idle");
    }
  }

  if (state === "sent") {
    return (
      <div className="flex items-start gap-2 text-sm text-green-700 dark:text-green-300">
        <CheckCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        <span>{t("verify.resendSent")}</span>
      </div>
    );
  }

  return (
    <form onSubmit={(e) => void submit(e)} className="space-y-2">
      {error && (
        <div role="alert" className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
          {error}
        </div>
      )}
      {!email && (
        <div className="space-y-1">
          <Label htmlFor={id ?? "resend-email"}>{t("verify.resendEmailLabel")}</Label>
          <Input
            id={id ?? "resend-email"}
            type="email"
            autoComplete="email"
            required
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        </div>
      )}
      <Button type="submit" variant="outline" size="sm" disabled={state === "sending" || !value}>
        {state === "sending" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {state === "sending" ? t("verify.resendSending") : t("verify.resendAction")}
      </Button>
    </form>
  );
}
