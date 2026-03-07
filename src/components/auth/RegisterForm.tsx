"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { PasswordStrengthIndicator } from "@/components/auth/PasswordStrengthIndicator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Schema keys used as placeholders — translated inside the component.
type RegisterFormValues = {
  name: string;
  email: string;
  password: string;
  passwordConfirm: string;
};

export function RegisterForm() {
  const t = useTranslations("auth");
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Build schema with translated messages so field errors render correctly.
  const registerSchema = z
    .object({
      name: z.string().min(1).max(100).trim(),
      email: z.string().email().max(254),
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
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
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
        }),
      });
      if (res.status === 409) {
        setServerError(t("errors.emailTaken"));
        return;
      }
      if (res.status === 429) {
        setServerError(t("errors.rateLimited", { minutes: "15" }));
        return;
      }
      if (!res.ok) {
        setServerError(t("errors.serverError"));
        return;
      }
      setSuccess(true);
    } catch {
      setServerError(t("errors.serverError"));
    }
  }

  if (success) {
    return (
      <div className="rounded-md bg-green-50 p-4 text-sm text-green-800 dark:bg-green-950 dark:text-green-200">
        {t("register.verificationSent")}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {serverError && (
        <div role="alert" className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
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
        {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
      </div>
      <div className="space-y-1">
        <Label htmlFor="email">{t("fields.email")}</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          {...register("email")}
          aria-invalid={!!errors.email}
        />
        {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
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
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
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
          <p className="text-xs text-destructive">{errors.passwordConfirm.message}</p>
        )}
      </div>
      <Button type="submit" className="w-full">
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
