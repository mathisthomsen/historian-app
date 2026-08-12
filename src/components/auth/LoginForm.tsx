"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { ResendVerification } from "@/components/auth/ResendVerification";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ACCOUNT_LOCKOUT_MINUTES,
  LOGIN_RATE_LIMIT_MINUTES,
  SIGN_IN_CODES,
} from "@/lib/auth-errors";

type LoginFormValues = {
  email: string;
  password: string;
};

export function LoginForm() {
  const t = useTranslations("auth");
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";
  const resetSuccess = searchParams.get("reset") === "1";

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /**
   * The address to offer a resend for. LoginForm previously told an unverified
   * user to confirm their address and gave them no way to obtain a new link
   * (issue #43).
   */
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Built inside the component so t() is in scope — see issue #41.
  const loginSchema = z.object({
    email: z.string().email(t("errors.emailInvalid")),
    password: z.string().min(1, t("errors.passwordRequired")),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit(values: LoginFormValues) {
    setError(null);
    setUnverifiedEmail(null);
    setIsSubmitting(true);
    try {
      const result = await signIn("credentials", {
        email: values.email,
        password: values.password,
        redirect: false,
      });

      if (result?.error) {
        // `code` comes from the CredentialsSignin subclass thrown in authorize().
        // Before that every cause collapsed into "invalid credentials" — including
        // the 15-minute rate limit and the 30-minute lockout, neither of which a
        // user can escape by re-checking their password (issue #48).
        switch (result.code) {
          case SIGN_IN_CODES.emailNotVerified:
            setError(t("errors.emailNotVerified"));
            setUnverifiedEmail(values.email);
            break;
          case SIGN_IN_CODES.rateLimited:
            setError(t("errors.loginRateLimited", { minutes: LOGIN_RATE_LIMIT_MINUTES }));
            break;
          case SIGN_IN_CODES.accountLocked:
            setError(t("errors.accountLocked", { minutes: ACCOUNT_LOCKOUT_MINUTES }));
            break;
          case SIGN_IN_CODES.invalidCredentials:
            setError(t("errors.invalidCredentials"));
            break;
          default:
            // An unrecognised code is not something authorize() classified — a
            // server or configuration fault, not bad input.
            setError(t("errors.serverError"));
        }
        return;
      }

      // Validate callbackUrl is same-origin (starts with /)
      const safeCb =
        callbackUrl.startsWith("/") && !callbackUrl.startsWith("//") ? callbackUrl : "/dashboard";
      router.push(safeCb);
      router.refresh();
    } catch {
      setError(t("errors.serverError"));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {resetSuccess && (
        <div className="rounded-md bg-green-50 p-3 text-sm text-green-800 dark:bg-green-950 dark:text-green-200">
          {t("login.resetSuccess")}
        </div>
      )}
      {error && (
        <div role="alert" className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
          {error}
        </div>
      )}
      {unverifiedEmail && <ResendVerification email={unverifiedEmail} />}
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
      <div className="space-y-1">
        <Label htmlFor="password">{t("fields.password")}</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
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
      </div>
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        {t("login.submit")}
      </Button>
      <div className="space-y-1 text-center text-sm">
        <div>
          <Link href="/auth/forgot-password" className="text-primary hover:underline">
            {t("login.forgotPassword")}
          </Link>
        </div>
        <div>
          {t("login.noAccount")}{" "}
          <Link href="/auth/register" className="text-primary hover:underline">
            {t("login.register")}
          </Link>
        </div>
      </div>
    </form>
  );
}
