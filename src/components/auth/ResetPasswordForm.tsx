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

const resetSchema = z
  .object({
    password: z
      .string()
      .min(8)
      .regex(/[A-Z]/)
      .regex(/[a-z]/)
      .regex(/[0-9]/)
      .regex(/[^A-Za-z0-9]/),
    passwordConfirm: z.string(),
  })
  .refine((d) => d.password === d.passwordConfirm, {
    message: "auth.errors.passwordMismatch",
    path: ["passwordConfirm"],
  });

type ResetFormValues = z.infer<typeof resetSchema>;

interface ResetPasswordFormProps {
  token: string;
}

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const t = useTranslations("auth");
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      if (res.status === 400) {
        const data = (await res.json()) as { error?: string };
        if (
          data.error === "auth.errors.tokenExpired" ||
          data.error === "auth.errors.tokenInvalid"
        ) {
          setServerError(
            t(
              `errors.${data.error === "auth.errors.tokenExpired" ? "tokenExpired" : "tokenInvalid"}`,
            ),
          );
        } else {
          setServerError(t("errors.serverError"));
        }
        return;
      }
      if (!res.ok) {
        setServerError(t("errors.serverError"));
        return;
      }
      router.push("/auth/login?reset=1");
    } catch {
      setServerError(t("errors.serverError"));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {serverError && (
        <div role="alert" className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
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
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.password && (
          <p className="text-xs text-destructive">{errors.password.message}</p>
        )}
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
          <p className="text-xs text-destructive">{errors.passwordConfirm.message}</p>
        )}
      </div>
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        {t("reset.submit")}
      </Button>
    </form>
  );
}
