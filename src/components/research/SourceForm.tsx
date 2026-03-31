"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { SOURCE_TYPE_SUGGESTIONS } from "@/lib/source-types";
import type { SourceDetail, SourceReliability } from "@/types/source";

const formSchema = z.object({
  title: z.string().min(1),
  type: z.string().min(1),
  author: z.string().optional().nullable(),
  reliability: z.enum(["HIGH", "MEDIUM", "LOW", "UNKNOWN"]).default("UNKNOWN"),
  date: z.string().optional().nullable(),
  repository: z.string().optional().nullable(),
  call_number: z.string().optional().nullable(),
  url: z
    .union([z.string().url(), z.literal(""), z.null()])
    .optional()
    .transform((v) => (v === "" ? null : (v ?? null))),
  notes: z.string().optional().nullable(),
});

type FormValues = z.infer<typeof formSchema>;

const RELIABILITIES: SourceReliability[] = ["HIGH", "MEDIUM", "LOW", "UNKNOWN"];

interface SourceFormProps {
  projectId: string;
  locale: string;
  initial?: SourceDetail;
}

export function SourceForm({ projectId, locale, initial }: SourceFormProps) {
  const t = useTranslations("sources");
  const router = useRouter();

  const [typeOpen, setTypeOpen] = useState(false);
  const [typeSearch, setTypeSearch] = useState("");

  const mode = initial ? "edit" : "create";

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: initial?.title ?? "",
      type: initial?.type ?? "",
      author: initial?.author ?? "",
      reliability: initial?.reliability ?? "UNKNOWN",
      date: initial?.date ?? "",
      repository: initial?.repository ?? "",
      call_number: initial?.call_number ?? "",
      url: initial?.url ?? "",
      notes: initial?.notes ?? "",
    },
  });

  function safeTypeLabel(value: string): string {
    const key = `type_${value}` as const;
    try {
      const label = t(key as Parameters<typeof t>[0]);
      return label ?? value;
    } catch {
      return value;
    }
  }

  const filteredTypes = SOURCE_TYPE_SUGGESTIONS.filter((s) =>
    typeSearch ? s.toLowerCase().includes(typeSearch.toLowerCase()) : true,
  );

  async function onSubmit(values: FormValues) {
    try {
      const url = mode === "create" ? "/api/sources" : `/api/sources/${initial!.id}`;
      const method = mode === "create" ? "POST" : "PUT";

      const body = { ...values, project_id: projectId };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        toast.error(data.error ?? t("errors.save_failed"));
        return;
      }

      const result = (await res.json()) as { id: string };
      toast.success(t("saved_toast"));
      router.push(`/${locale}/sources/${result.id}`);
    } catch {
      toast.error(t("errors.save_failed"));
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {/* Left column */}
        <div className="space-y-4">
          {/* Title */}
          <div className="space-y-1">
            <Label htmlFor="title">{t("field_title")}</Label>
            <Input
              id="title"
              type="text"
              {...register("title")}
              aria-invalid={!!errors.title}
              disabled={isSubmitting}
            />
            {errors.title && (
              <p className="text-xs text-destructive">{t("errors.title_required")}</p>
            )}
          </div>

          {/* Type combobox */}
          <div className="space-y-1">
            <Label>{t("field_type")}</Label>
            <Controller
              control={control}
              name="type"
              render={({ field }) => (
                <div className="space-y-1">
                  <Popover open={typeOpen} onOpenChange={setTypeOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        role="combobox"
                        aria-expanded={typeOpen}
                        className="w-full justify-between"
                        disabled={isSubmitting}
                      >
                        <span className={field.value ? undefined : "text-muted-foreground"}>
                          {field.value ? safeTypeLabel(field.value) : t("type_placeholder")}
                        </span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" align="start">
                      <Command>
                        <CommandInput
                          placeholder={t("type_placeholder")}
                          value={typeSearch}
                          onValueChange={setTypeSearch}
                        />
                        <CommandList>
                          <CommandEmpty>
                            {typeSearch && (
                              <CommandItem
                                value={typeSearch}
                                onSelect={() => {
                                  field.onChange(typeSearch);
                                  setTypeOpen(false);
                                  setTypeSearch("");
                                }}
                              >
                                {typeSearch}
                              </CommandItem>
                            )}
                          </CommandEmpty>
                          <CommandGroup>
                            {filteredTypes.map((suggestion) => (
                              <CommandItem
                                key={suggestion}
                                value={suggestion}
                                onSelect={() => {
                                  field.onChange(suggestion);
                                  setTypeOpen(false);
                                  setTypeSearch("");
                                }}
                              >
                                <span className="flex-1">{safeTypeLabel(suggestion)}</span>
                                {field.value === suggestion && <Check className="h-4 w-4" />}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  {field.value && (
                    <span className="inline-block rounded bg-muted px-2 py-0.5 text-xs">
                      {safeTypeLabel(field.value)}
                    </span>
                  )}
                </div>
              )}
            />
            {errors.type && (
              <p className="text-xs text-destructive">{t("errors.type_required")}</p>
            )}
          </div>

          {/* Author */}
          <div className="space-y-1">
            <Label htmlFor="author">{t("field_author")}</Label>
            <Input id="author" type="text" {...register("author")} disabled={isSubmitting} />
          </div>

          {/* Reliability */}
          <div className="space-y-1">
            <Label>{t("field_reliability")}</Label>
            <Controller
              control={control}
              name="reliability"
              render={({ field }) => (
                <div className="flex gap-1" role="group">
                  {RELIABILITIES.map((r) => (
                    <button
                      key={r}
                      type="button"
                      aria-pressed={field.value === r}
                      disabled={isSubmitting}
                      onClick={() => field.onChange(r)}
                      className={[
                        "rounded-md border px-3 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
                        field.value === r
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-input bg-background text-foreground hover:bg-accent hover:text-accent-foreground",
                      ].join(" ")}
                    >
                      {t(`reliability_${r.toLowerCase()}` as Parameters<typeof t>[0])}
                    </button>
                  ))}
                </div>
              )}
            />
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Date */}
          <div className="space-y-1">
            <Label htmlFor="date">{t("field_date")}</Label>
            <Input
              id="date"
              type="text"
              placeholder={t("field_date_hint")}
              {...register("date")}
              disabled={isSubmitting}
            />
          </div>

          {/* Repository */}
          <div className="space-y-1">
            <Label htmlFor="repository">{t("field_repository")}</Label>
            <Input id="repository" type="text" {...register("repository")} disabled={isSubmitting} />
          </div>

          {/* Call Number */}
          <div className="space-y-1">
            <Label htmlFor="call_number">{t("field_call_number")}</Label>
            <Input
              id="call_number"
              type="text"
              {...register("call_number")}
              disabled={isSubmitting}
            />
          </div>

          {/* URL */}
          <div className="space-y-1">
            <Label htmlFor="url">{t("field_url")}</Label>
            <Input
              id="url"
              type="text"
              {...register("url")}
              aria-invalid={!!errors.url}
              disabled={isSubmitting}
            />
            {errors.url && (
              <p className="text-xs text-destructive">{t("errors.invalid_url")}</p>
            )}
          </div>
        </div>
      </div>

      {/* Notes — full width */}
      <div className="space-y-1">
        <Label htmlFor="notes">{t("field_notes")}</Label>
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
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isSubmitting}
        >
          {t("cancel")}
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {mode === "create" ? t("save") : t("save_changes")}
        </Button>
      </div>

    </form>
  );
}
