"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { PasswordStrengthIndicator } from "@/components/auth/PasswordStrengthIndicator";
import { ResendVerification } from "@/components/auth/ResendVerification";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { errorCode, readErrorBody, retryAfterMinutes, translateErrorCode } from "@/lib/api-error";
import { REGISTER_RATE_LIMIT_MINUTES } from "@/lib/auth-errors";

// Schema keys used as placeholders — translated inside the component.
type RegisterFormValues = {
  name: string;
  email: string;
  password: string;
  passwordConfirm: string;
};

/**
 * The five INVITE_* refusals map onto the page-load states' copy, so the
 * submit-time error and the preview are one sentence (spec §8, same
 * code -> key map shape as ResetPasswordForm). No separate `errors.*` keys.
 */
const INVITE_ERROR_KEYS = {
  INVITE_REQUIRED: "invite.missing",
  INVITE_INVALID: "invite.invalid",
  INVITE_EXPIRED: "invite.expired",
  INVITE_USED: "invite.used",
  INVITE_EMAIL_MISMATCH: "invite.emailMismatch",
} as const;

interface RegisterFormProps {
  /** A `valid` invite from the page's read-only preview (spec §4.2). */
  invite: { email: string; token: string };
}

export function RegisterForm({ invite }: RegisterFormProps) {
  const t = useTranslations("auth");
  const locale = useLocale();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  /** Whether the verification mail actually went out — the route now says. */
  const [emailSent, setEmailSent] = useState(true);
  const [registeredEmail, setRegisteredEmail] = useState("");

  // Build schema with translated messages so field errors render correctly.
  const registerSchema = z
    .object({
      name: z.string().trim().min(1, t("errors.nameRequired")).max(100, t("errors.nameTooLong")),
      email: z.string().email(t("errors.emailInvalid")).max(254, t("errors.emailTooLong")),
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
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    // The address is bound to the invite and not editable (spec §6.2).
    defaultValues: { email: invite.email },
  });

  const password = watch("password", "");

  async function onSubmit(values: RegisterFormValues) {
    setServerError(null);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: values.email,
          name: values.name,
          password: values.password,
          invite: invite.token,
        }),
      });
      if (res.status === 403) {
        // The invite changed state between page load and submit (spec §6.2).
        setServerError(
          translateErrorCode(
            errorCode(await readErrorBody(res)),
            t,
            INVITE_ERROR_KEYS,
            "errors.serverError",
          ),
        );
        return;
      }
      if (res.status === 409) {
        setServerError(t("errors.emailTaken"));
        return;
      }
      if (res.status === 429) {
        // Was hardcoded to "15" against a 60-minute window, so a user who waited
        // exactly as long as they were told was still blocked (issue #48). The
        // limiter already emits an accurate Retry-After.
        setServerError(
          t("errors.rateLimited", {
            minutes: retryAfterMinutes(res, REGISTER_RATE_LIMIT_MINUTES),
          }),
        );
        return;
      }
      if (res.status === 503) {
        // Emitted when Redis is degraded; this used to collapse into "try again",
        // which invites an immediate retry that cannot work.
        setServerError(t("errors.serviceUnavailable"));
        return;
      }
      if (!res.ok) {
        setServerError(t("errors.serverError"));
        return;
      }
      // Only `email_sent: false` is a claim of failure; a body we cannot read
      // must not be treated as one.
      const data = (await readErrorBody(res)) as { email_sent?: boolean };
      setEmailSent(data?.email_sent !== false);
      setRegisteredEmail(values.email);
      setSuccess(true);
    } catch {
      setServerError(t("errors.networkError"));
    }
  }

  if (success) {
    // register/route.ts deliberately swallows a failed sendVerificationEmail and
    // still returns 201. The success screen used to assert the mail was on its
    // way in exactly the case where it was not, with no resend and no way out
    // (issue #43).
    if (!emailSent) {
      return (
        <div className="space-y-3">
          <div
            role="alert"
            className="bg-destructive/10 text-destructive space-y-1 rounded-md p-4 text-sm"
          >
            <p className="font-medium">{t("register.emailNotSentTitle")}</p>
            <p>{t("register.emailNotSentMessage")}</p>
          </div>
          <ResendVerification email={registeredEmail} />
          <Link href="/auth/login" className="text-primary block text-sm hover:underline">
            {t("register.backToLogin")} →
          </Link>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        <div className="rounded-md bg-green-50 p-4 text-sm text-green-800 dark:bg-green-950 dark:text-green-200">
          {t("register.verificationSent")}
        </div>
        <p className="text-muted-foreground text-xs">{t("verify.expiredHint")}</p>
        <ResendVerification email={registeredEmail} />
        <Link href="/auth/login" className="text-primary block text-sm hover:underline">
          {t("register.backToLogin")} →
        </Link>
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
      <div className="space-y-1">
        <Label htmlFor="name">{t("fields.name")}</Label>
        <Input
          id="name"
          type="text"
          autoComplete="name"
          placeholder={t("register.namePlaceholder")}
          {...register("name")}
          aria-invalid={!!errors.name}
        />
        {errors.name && <p className="text-destructive text-xs">{errors.name.message}</p>}
      </div>
      <div className="space-y-1">
        <Label htmlFor="email">{t("fields.email")}</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          readOnly
          {...register("email")}
          aria-invalid={!!errors.email}
        />
        <p className="text-muted-foreground text-xs">
          {t("invite.invitedAs", { email: invite.email })}
        </p>
        {errors.email && <p className="text-destructive text-xs">{errors.email.message}</p>}
      </div>
      <div className="space-y-1">
        <Label htmlFor="password">{t("fields.password")}</Label>
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
        <Label htmlFor="passwordConfirm">{t("fields.confirmPassword")}</Label>
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
      <p className="text-muted-foreground text-xs">
        {t("register.privacyHint")}{" "}
        <Link href={`/${locale}/datenschutz`} className="text-primary hover:underline">
          {t("register.privacy")}
        </Link>
        .
      </p>
      {/* Disabled while submitting: a double click used to send two requests, and
          the second answered INVITE_USED over the first one's success card (#112). */}
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> : null}
        {t("register.submit")}
      </Button>
      <div className="text-center text-sm">
        {t("register.alreadyHaveAccount")}{" "}
        <Link href="/auth/login" className="text-primary hover:underline">
          {t("register.login")}
        </Link>
      </div>
    </form>
  );
}
