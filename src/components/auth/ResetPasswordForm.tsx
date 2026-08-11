"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { PasswordStrengthIndicator } from "@/components/auth/PasswordStrengthIndicator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { errorCode, readErrorBody, retryAfterMinutes, translateErrorCode } from "@/lib/api-error";
import { RESET_PASSWORD_RATE_LIMIT_MINUTES } from "@/lib/auth-errors";

type ResetFormValues = {
  password: string;
  passwordConfirm: string;
};

interface ResetPasswordFormProps {
  token: string;
}

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const t = useTranslations("auth");
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Built inside the component so t() is in scope. At module scope this rendered
  // zod's English defaults and the literal key "auth.errors.passwordMismatch" to
  // German users (issue #41); RegisterForm already used this convention.
  const resetSchema = z
    .object({
      password: z
        .string()
        .min(8, t("errors.passwordTooShort"))
        .regex(/[A-Z]/, t("errors.passwordNeedsUpper"))
        .regex(/[a-z]/, t("errors.passwordNeedsLower"))
        .regex(/[0-9]/, t("errors.passwordNeedsNumber"))
        .regex(/[^A-Za-z0-9]/, t("errors.passwordNeedsSpecial")),
      passwordConfirm: z.string(),
    })
    .refine((d) => d.password === d.passwordConfirm, {
      message: t("errors.passwordMismatch"),
      path: ["passwordConfirm"],
    });

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetFormValues>({
    resolver: zodResolver(resetSchema),
  });

  const password = watch("password", "");

  async function onSubmit(values: ResetFormValues) {
    setServerError(null);
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          password: values.password,
          passwordConfirm: values.passwordConfirm,
        }),
      });
      if (res.status === 429) {
        // The route allows 5 attempts / 15 min and returns Retry-After; this used
        // to fall through to the generic "an error occurred, try again" after the
        // user had typed a password twice (issue #48).
        setServerError(
          t("errors.rateLimited", {
            minutes: retryAfterMinutes(res, RESET_PASSWORD_RATE_LIMIT_MINUTES),
          }),
        );
        return;
      }
      if (res.status === 503) {
        setServerError(t("errors.serviceUnavailable"));
        return;
      }
      if (res.status === 400) {
        const code = errorCode(await readErrorBody(res));
        setServerError(
          translateErrorCode(
            code,
            t,
            {
              TOKEN_EXPIRED: "errors.tokenExpired",
              TOKEN_INVALID: "errors.tokenInvalid",
              // The server requires exactly 64 lowercase hex while the page accepts
              // any non-empty string, so a line-wrapped link from an email client
              // lands here — and read as a transient server fault.
              VALIDATION_FAILED: "errors.tokenMalformed",
            },
            "errors.serverError",
          ),
        );
        return;
      }
      if (!res.ok) {
        setServerError(t("errors.serverError"));
        return;
      }
      router.push("/auth/login?reset=1");
    } catch {
      setServerError(t("errors.networkError"));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {serverError && (
        <div role="alert" className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
          {serverError}
        </div>
      )}
      <div className="space-y-1">
        <Label htmlFor="password">{t("reset.newPassword")}</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            {...register("password")}
            aria-invalid={!!errors.password}
            className="pr-10"
          />
          <button
            type="button"
            className="text-muted-foreground absolute top-1/2 right-3 -translate-y-1/2"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.password && <p className="text-destructive text-xs">{errors.password.message}</p>}
        <PasswordStrengthIndicator password={password} />
      </div>
      <div className="space-y-1">
        <Label htmlFor="passwordConfirm">{t("reset.confirmPassword")}</Label>
        <Input
          id="passwordConfirm"
          type="password"
          autoComplete="new-password"
          {...register("passwordConfirm")}
          aria-invalid={!!errors.passwordConfirm}
        />
        {errors.passwordConfirm && (
          <p className="text-destructive text-xs">{errors.passwordConfirm.message}</p>
        )}
      </div>
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        {t("reset.submit")}
      </Button>
    </form>
  );
}
