"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

import { CertaintySelector } from "@/components/research/CertaintySelector";
import { PartialDateInput } from "@/components/research/PartialDateInput";
import { PersonNameList } from "@/components/research/PersonNameList";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { PersonDetail } from "@/types/person";

const formSchema = z.object({
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  birth_year: z.number().int().min(1).max(2100).optional().nullable(),
  birth_month: z.number().int().min(1).max(12).optional().nullable(),
  birth_day: z.number().int().min(1).max(31).optional().nullable(),
  birth_date_certainty: z.enum(["CERTAIN", "PROBABLE", "POSSIBLE", "UNKNOWN"]),
  birth_place: z.string().optional(),
  death_year: z.number().int().min(1).max(2100).optional().nullable(),
  death_month: z.number().int().min(1).max(12).optional().nullable(),
  death_day: z.number().int().min(1).max(31).optional().nullable(),
  death_date_certainty: z.enum(["CERTAIN", "PROBABLE", "POSSIBLE", "UNKNOWN"]),
  death_place: z.string().optional(),
  notes: z.string().optional(),
  names: z
    .array(
      z.object({
        name: z.string().min(1),
        language: z.string().nullable().optional(),
        is_primary: z.boolean().optional(),
      }),
    )
    .optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface PersonFormProps {
  mode: "create" | "edit";
  initial?: PersonDetail;
  projectId: string;
  onSuccess: (person: PersonDetail) => void;
  onCancel?: () => void;
}

export function PersonForm({ mode, initial, projectId, onSuccess, onCancel }: PersonFormProps) {
  const t = useTranslations("persons");
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      first_name: initial?.first_name ?? "",
      last_name: initial?.last_name ?? "",
      birth_year: initial?.birth_year ?? null,
      birth_month: initial?.birth_month ?? null,
      birth_day: initial?.birth_day ?? null,
      birth_date_certainty: initial?.birth_date_certainty ?? "UNKNOWN",
      birth_place: initial?.birth_place ?? "",
      death_year: initial?.death_year ?? null,
      death_month: initial?.death_month ?? null,
      death_day: initial?.death_day ?? null,
      death_date_certainty: initial?.death_date_certainty ?? "UNKNOWN",
      death_place: initial?.death_place ?? "",
      notes: initial?.notes ?? "",
      names: initial?.names ?? [],
    },
  });

  async function onSubmit(values: FormValues) {
    setServerError(null);
    try {
      const url = mode === "create" ? "/api/persons" : `/api/persons/${initial?.id}`;
      const method = mode === "create" ? "POST" : "PUT";

      // Normalize form values for the API:
      // - For create: omit null/undefined/empty-string fields
      // - For edit: convert empty strings to null so fields can be cleared
      const rawBody = { ...values, project_id: projectId };
      const body =
        mode === "create"
          ? Object.fromEntries(
              Object.entries(rawBody).filter(([, v]) => v !== null && v !== undefined && v !== ""),
            )
          : Object.fromEntries(Object.entries(rawBody).map(([k, v]) => [k, v === "" ? null : v]));

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setServerError(data.error ?? t("errors.save_failed"));
        return;
      }

      const person = (await res.json()) as PersonDetail;
      onSuccess(person);
    } catch {
      setServerError(t("errors.save_failed"));
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {serverError && (
        <div role="alert" className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {serverError}
        </div>
      )}

      {/* First name / Last name */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="first_name">{t("fields.first_name")}</Label>
          <Input
            id="first_name"
            type="text"
            {...register("first_name")}
            aria-invalid={!!errors.first_name}
          />
          {errors.first_name && (
            <p className="text-xs text-destructive">{errors.first_name.message}</p>
          )}
        </div>
        <div className="space-y-1">
          <Label htmlFor="last_name">{t("fields.last_name")}</Label>
          <Input
            id="last_name"
            type="text"
            {...register("last_name")}
            aria-invalid={!!errors.last_name}
          />
          {errors.last_name && (
            <p className="text-xs text-destructive">{errors.last_name.message}</p>
          )}
        </div>
      </div>

      {/* Birth date */}
      <div className="space-y-3 rounded-md border p-4">
        <p className="text-sm font-semibold">{t("fields.birth_date")}</p>
        <Controller
          control={control}
          name="birth_year"
          render={({ field }) => (
            <Controller
              control={control}
              name="birth_month"
              render={({ field: mField }) => (
                <Controller
                  control={control}
                  name="birth_day"
                  render={({ field: dField }) => (
                    <PartialDateInput
                      label={t("fields.birth_date")}
                      yearValue={field.value ?? null}
                      monthValue={mField.value ?? null}
                      dayValue={dField.value ?? null}
                      onYearChange={field.onChange}
                      onMonthChange={mField.onChange}
                      onDayChange={dField.onChange}
                      disabled={isSubmitting}
                    />
                  )}
                />
              )}
            />
          )}
        />
        <Controller
          control={control}
          name="birth_date_certainty"
          render={({ field }) => (
            <CertaintySelector
              label={t("fields.birth_date_certainty")}
              value={field.value}
              onChange={field.onChange}
              disabled={isSubmitting}
            />
          )}
        />
        <div className="space-y-1">
          <Label htmlFor="birth_place">{t("fields.birth_place")}</Label>
          <Input
            id="birth_place"
            type="text"
            {...register("birth_place")}
            disabled={isSubmitting}
          />
        </div>
      </div>

      {/* Death date */}
      <div className="space-y-3 rounded-md border p-4">
        <p className="text-sm font-semibold">{t("fields.death_date")}</p>
        <Controller
          control={control}
          name="death_year"
          render={({ field }) => (
            <Controller
              control={control}
              name="death_month"
              render={({ field: mField }) => (
                <Controller
                  control={control}
                  name="death_day"
                  render={({ field: dField }) => (
                    <PartialDateInput
                      label={t("fields.death_date")}
                      yearValue={field.value ?? null}
                      monthValue={mField.value ?? null}
                      dayValue={dField.value ?? null}
                      onYearChange={field.onChange}
                      onMonthChange={mField.onChange}
                      onDayChange={dField.onChange}
                      disabled={isSubmitting}
                    />
                  )}
                />
              )}
            />
          )}
        />
        <Controller
          control={control}
          name="death_date_certainty"
          render={({ field }) => (
            <CertaintySelector
              label={t("fields.death_date_certainty")}
              value={field.value}
              onChange={field.onChange}
              disabled={isSubmitting}
            />
          )}
        />
        <div className="space-y-1">
          <Label htmlFor="death_place">{t("fields.death_place")}</Label>
          <Input
            id="death_place"
            type="text"
            {...register("death_place")}
            disabled={isSubmitting}
          />
        </div>
      </div>

      {/* Name variants */}
      <Controller
        control={control}
        name="names"
        render={({ field }) => (
          <PersonNameList
            value={field.value ?? []}
            onChange={field.onChange}
            disabled={isSubmitting}
          />
        )}
      />

      {/* Notes */}
      <div className="space-y-1">
        <Label htmlFor="notes">{t("fields.notes")}</Label>
        <textarea
          id="notes"
          rows={4}
          {...register("notes")}
          disabled={isSubmitting}
          className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {t("save")}
        </Button>
      </div>
    </form>
  );
}
