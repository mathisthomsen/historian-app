"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { retryAfterMinutes } from "@/lib/api-error";
import { FORGOT_PASSWORD_RATE_LIMIT_MINUTES } from "@/lib/auth-errors";

type ForgotFormValues = {
  email: string;
};

export function ForgotPasswordForm() {
  const t = useTranslations("auth");
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Built inside the component so t() is in scope — at module scope zod falls back
  // to its English defaults, which then reach a German-default UI (issue #41).
  const forgotSchema = z.object({
    email: z.string().email(t("errors.emailInvalid")),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotFormValues>({
    resolver: zodResolver(forgotSchema),
  });

  async function onSubmit(values: ForgotFormValues) {
    setIsSubmitting(true);
    setServerError(null);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: values.email }),
      });

      // Enumeration is closed server-side: the route returns an identical 200
      // whether or not the address exists. Suppressing client-side failures on
      // top of that protected nothing and only misled — a throttled user who
      // got no mail was told a second time that one was on its way (issue #48).
      if (res.status === 429) {
        setServerError(
          t("errors.rateLimited", {
            minutes: retryAfterMinutes(res, FORGOT_PASSWORD_RATE_LIMIT_MINUTES),
          }),
        );
        return;
      }
      if (res.status === 503) {
        setServerError(t("errors.serviceUnavailable"));
        return;
      }
      if (!res.ok) {
        setServerError(t("errors.serverError"));
        return;
      }
      setSubmitted(true);
    } catch {
      setServerError(t("errors.networkError"));
    } finally {
      setIsSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="space-y-2">
        <p className="text-sm">{t("forgot.emailSentMessage")}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {serverError && (
        <div role="alert" className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
          {serverError}
        </div>
      )}
      <p className="text-muted-foreground text-sm">{t("forgot.description")}</p>
      <div className="space-y-1">
        <Label htmlFor="email">{t("fields.email")}</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          {...register("email")}
          aria-invalid={!!errors.email}
        />
        {errors.email && <p className="text-destructive text-xs">{errors.email.message}</p>}
      </div>
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        {t("forgot.submit")}
      </Button>
      <div className="text-center text-sm">
        <Link href="/auth/login" className="text-primary hover:underline">
          {t("forgot.backToLogin")}
        </Link>
      </div>
    </form>
  );
}
