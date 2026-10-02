"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { retryAfterMinutes } from "@/lib/api-error";

interface AccessRequestFormProps {
  locale: string;
}

type AccessRequestValues = {
  name: string;
  email: string;
  institution: string;
  research_area: string;
  tool_gap: string;
  consent: boolean;
  /** Honeypot (§4.1 step 4): a person never sees it, so it stays empty. */
  company: string;
};

/** The server's per-IP window is one hour (§4.1 step 2). */
const FALLBACK_RETRY_MINUTES = 60;

/**
 * The landing page's access-request band (`#access`), which replaces `CtaBand`
 * (spec §6.1). Registration is by invitation only; this is the way in.
 *
 * Success shows one message whatever the server did with the address — the
 * route answers every accepted case identically (I5) and the form must not
 * give it a way to tell cases apart. The message promises no reply: an
 * unreviewed request is deleted after 6 hours (§4.6).
 */
export function AccessRequestForm({ locale }: AccessRequestFormProps) {
  const t = useTranslations("access");
  const tCta = useTranslations("marketing.cta");
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  // Set when the form mounts: the server treats an answer faster than a person
  // can type as a bot. Not state — nothing renders it, and reading `Date.now()`
  // during render would make the page differ between server and client.
  const renderedAt = useRef<number | null>(null);
  useEffect(() => {
    renderedAt.current = Date.now();
  }, []);

  // Built inside the component so the messages are translated (established pattern).
  const schema = z.object({
    name: z.string().trim().min(1, t("errors.nameRequired")).max(100, t("errors.nameTooLong")),
    email: z.string().trim().email(t("errors.emailInvalid")).max(254, t("errors.emailTooLong")),
    institution: z.string().max(200, t("errors.institutionTooLong")),
    research_area: z.string().max(200, t("errors.researchAreaTooLong")),
    tool_gap: z.string().max(2000, t("errors.toolGapTooLong")),
    consent: z.boolean().refine((value) => value, t("errors.consentRequired")),
    company: z.string(),
  });

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AccessRequestValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      email: "",
      institution: "",
      research_area: "",
      tool_gap: "",
      consent: false,
      company: "",
    },
  });

  async function onSubmit(values: AccessRequestValues) {
    setServerError(null);
    try {
      const res = await fetch("/api/access-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: values.name,
          email: values.email,
          institution: values.institution,
          research_area: values.research_area,
          tool_gap: values.tool_gap,
          locale: locale === "en" ? "en" : "de",
          consent: true,
          company: values.company,
          rendered_at: renderedAt.current ?? Date.now(),
        }),
      });
      if (res.status === 429) {
        setServerError(
          t("errors.rateLimited", { minutes: retryAfterMinutes(res, FALLBACK_RETRY_MINUTES) }),
        );
        return;
      }
      if (res.status === 503) {
        setServerError(t("errors.serviceUnavailable"));
        return;
      }
      if (res.status === 400) {
        setServerError(t("errors.invalid"));
        return;
      }
      if (!res.ok) {
        setServerError(t("errors.serverError"));
        return;
      }
      setSuccess(true);
    } catch {
      setServerError(t("errors.networkError"));
    }
  }

  return (
    <section id="access" className="scroll-mt-20 px-4 sm:px-6">
      <div className="border-border bg-card mx-auto max-w-[var(--content-max-width)] rounded-xl border p-8 sm:p-12">
        <div className="text-center">
          <h2 className="mx-auto max-w-[20ch] text-[length:var(--text-display-sm)] leading-tight font-semibold tracking-[var(--tracking-display-sm)] text-balance">
            {tCta("title")}
          </h2>
          <p className="text-muted-foreground mx-auto mt-4 max-w-[46ch]">{tCta("body")}</p>
        </div>

        {success ? (
          <div
            role="status"
            className="mx-auto mt-8 max-w-xl rounded-md bg-green-50 p-4 text-sm text-green-800 dark:bg-green-950 dark:text-green-200"
          >
            {t("success")}
          </div>
        ) : (
          <form
            onSubmit={handleSubmit(onSubmit)}
            noValidate
            className="relative mx-auto mt-8 max-w-xl space-y-4 text-left"
          >
            {serverError && (
              <div
                role="alert"
                className="bg-destructive/10 text-destructive rounded-md p-3 text-sm"
              >
                {serverError}
              </div>
            )}

            <div className="space-y-1">
              <Label htmlFor="access-name">{t("fields.name")}</Label>
              <Input
                id="access-name"
                type="text"
                autoComplete="name"
                aria-required="true"
                aria-invalid={!!errors.name}
                aria-describedby={errors.name ? "access-name-error" : undefined}
                {...register("name")}
              />
              {errors.name && (
                <p id="access-name-error" className="text-destructive text-xs">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="access-email">{t("fields.email")}</Label>
              <Input
                id="access-email"
                type="email"
                autoComplete="email"
                aria-required="true"
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? "access-email-error" : undefined}
                {...register("email")}
              />
              {errors.email && (
                <p id="access-email-error" className="text-destructive text-xs">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="access-institution">{t("fields.institution")}</Label>
              <Input
                id="access-institution"
                type="text"
                autoComplete="organization"
                aria-invalid={!!errors.institution}
                aria-describedby={errors.institution ? "access-institution-error" : undefined}
                {...register("institution")}
              />
              {errors.institution && (
                <p id="access-institution-error" className="text-destructive text-xs">
                  {errors.institution.message}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="access-research-area">{t("fields.researchArea")}</Label>
              <Input
                id="access-research-area"
                type="text"
                aria-invalid={!!errors.research_area}
                aria-describedby={errors.research_area ? "access-research-area-error" : undefined}
                {...register("research_area")}
              />
              {errors.research_area && (
                <p id="access-research-area-error" className="text-destructive text-xs">
                  {errors.research_area.message}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="access-tool-gap">{t("fields.toolGap")}</Label>
              <Textarea
                id="access-tool-gap"
                rows={4}
                aria-invalid={!!errors.tool_gap}
                aria-describedby={
                  errors.tool_gap
                    ? "access-tool-gap-hint access-tool-gap-error"
                    : "access-tool-gap-hint"
                }
                {...register("tool_gap")}
              />
              <p id="access-tool-gap-hint" className="text-muted-foreground text-xs">
                {t("toolGapHint")}
              </p>
              {errors.tool_gap && (
                <p id="access-tool-gap-error" className="text-destructive text-xs">
                  {errors.tool_gap.message}
                </p>
              )}
            </div>

            {/*
              Honeypot. Positioned off-screen rather than `display: none`, which
              some bots skip; `aria-hidden`, `tabIndex={-1}` and
              `autoComplete="off"` keep a person — with or without assistive
              technology — and a password manager away from it.
            */}
            <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
              <input type="text" tabIndex={-1} autoComplete="off" {...register("company")} />
            </div>

            <div className="space-y-1">
              <div className="flex items-start gap-3">
                <Controller
                  control={control}
                  name="consent"
                  render={({ field }) => (
                    <Checkbox
                      id="access-consent"
                      checked={field.value}
                      onCheckedChange={(checked) => field.onChange(checked === true)}
                      onBlur={field.onBlur}
                      aria-invalid={!!errors.consent}
                      aria-describedby={errors.consent ? "access-consent-error" : undefined}
                      className="mt-0.5"
                    />
                  )}
                />
                <Label htmlFor="access-consent" className="text-sm leading-snug font-normal">
                  {t.rich("consent", {
                    privacy: (chunks) => (
                      <Link href={`/${locale}/datenschutz`} className="text-primary underline">
                        {chunks}
                      </Link>
                    ),
                  })}
                </Label>
              </div>
              {errors.consent && (
                <p id="access-consent-error" className="text-destructive text-xs">
                  {errors.consent.message}
                </p>
              )}
            </div>

            <p className="text-muted-foreground text-xs">{t("retention")}</p>

            <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? t("submitting") : tCta("action")}
            </Button>
          </form>
        )}
      </div>
    </section>
  );
}
