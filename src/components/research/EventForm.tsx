"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { CertaintySelector } from "@/components/research/CertaintySelector";
import { EventTypeCombobox } from "@/components/research/EventTypeCombobox";
import { PartialDateInput } from "@/components/research/PartialDateInput";
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
import { Textarea } from "@/components/ui/textarea";
import { UnsavedChangesDialog } from "@/components/ui/unsaved-changes-dialog";
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes";
import { errorCode } from "@/lib/api-error";
import type { EventDetail, EventSummary } from "@/types/event";

/**
 * Built per-render inside the component so `t()` is in scope. At module scope zod
 * fell back to its English defaults ("String must contain at least 1 character(s)")
 * and the `superRefine` messages reached the user as the raw keys
 * `month_requires_year` / `day_requires_month` — see issue #41.
 */
function buildFormSchema(t: (key: string) => string) {
  return z
    .object({
      title: z.string().min(1, t("errors.title_required")),
      description: z.string().optional().nullable(),
      event_type_id: z.string().cuid().optional().nullable(),
      start_year: z
        .number()
        .int()
        .min(1, t("errors.invalid_year"))
        .max(2100, t("errors.invalid_year"))
        .optional()
        .nullable(),
      start_month: z
        .number()
        .int()
        .min(1, t("errors.invalid_month"))
        .max(12, t("errors.invalid_month"))
        .optional()
        .nullable(),
      start_day: z
        .number()
        .int()
        .min(1, t("errors.invalid_day"))
        .max(31, t("errors.invalid_day"))
        .optional()
        .nullable(),
      start_date_certainty: z
        .enum(["CERTAIN", "PROBABLE", "POSSIBLE", "UNKNOWN"])
        .default("UNKNOWN"),
      end_year: z
        .number()
        .int()
        .min(1, t("errors.invalid_year"))
        .max(2100, t("errors.invalid_year"))
        .optional()
        .nullable(),
      end_month: z
        .number()
        .int()
        .min(1, t("errors.invalid_month"))
        .max(12, t("errors.invalid_month"))
        .optional()
        .nullable(),
      end_day: z
        .number()
        .int()
        .min(1, t("errors.invalid_day"))
        .max(31, t("errors.invalid_day"))
        .optional()
        .nullable(),
      end_date_certainty: z.enum(["CERTAIN", "PROBABLE", "POSSIBLE", "UNKNOWN"]).default("UNKNOWN"),
      location: z.string().optional().nullable(),
      parent_id: z.string().cuid().optional().nullable(),
      notes: z.string().optional().nullable(),
    })
    .superRefine((data, ctx) => {
      const monthRequiresYear = t("errors.month_requires_year");
      const dayRequiresMonth = t("errors.day_requires_month");
      if (data.start_month && !data.start_year) {
        ctx.addIssue({ code: "custom", path: ["start_month"], message: monthRequiresYear });
      }
      if (data.start_day && !data.start_month) {
        ctx.addIssue({ code: "custom", path: ["start_day"], message: dayRequiresMonth });
      }
      if (data.end_month && !data.end_year) {
        ctx.addIssue({ code: "custom", path: ["end_month"], message: monthRequiresYear });
      }
      if (data.end_day && !data.end_month) {
        ctx.addIssue({ code: "custom", path: ["end_day"], message: dayRequiresMonth });
      }
    });
}

type FormValues = z.infer<ReturnType<typeof buildFormSchema>>;

interface EventFormProps {
  mode: "create" | "edit";
  initial?: EventDetail;
  projectId: string;
  defaultParentId?: string | undefined;
  onSuccess: (event: EventDetail) => void;
  /**
   * Explicit destination for Cancel. This used to be `router.back()`, which
   * returns to whatever preceded in history — the list when arriving via a link,
   * but outside the application entirely when the edit URL was opened directly,
   * bookmarked, shared or restored in a new tab (issue #42).
   */
  onCancel: () => void;
}

export function EventForm({
  mode,
  initial,
  projectId,
  defaultParentId,
  onSuccess,
  onCancel,
}: EventFormProps) {
  const t = useTranslations("events");

  const [parentEvents, setParentEvents] = useState<EventSummary[]>([]);
  const [parentOpen, setParentOpen] = useState(false);
  const [parentSearch, setParentSearch] = useState("");
  /**
   * The seeded `?parentId=` resolved by id. The picker only ever holds one page of
   * candidates, so a parent past that page — or one that is not top-level at all —
   * was invisible to it. Rendering the "no parent" placeholder while still
   * submitting `parent_id` showed the user one thing and saved another (issue #47).
   */
  const [seededParent, setSeededParent] = useState<{
    id: string;
    title: string;
    isSubEvent: boolean;
  } | null>(null);
  const [seedResolution, setSeedResolution] = useState<"idle" | "loading" | "failed">("idle");

  const formSchema = useMemo(() => buildFormSchema(t), [t]);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    setError,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: initial?.title ?? "",
      description: initial?.description ?? "",
      event_type_id: initial?.event_type?.id ?? null,
      start_year: initial?.start_year ?? null,
      start_month: initial?.start_month ?? null,
      start_day: initial?.start_day ?? null,
      start_date_certainty: initial?.start_date_certainty ?? "UNKNOWN",
      end_year: initial?.end_year ?? null,
      end_month: initial?.end_month ?? null,
      end_day: initial?.end_day ?? null,
      end_date_certainty: initial?.end_date_certainty ?? "UNKNOWN",
      location: initial?.location ?? "",
      parent_id: initial?.parent?.id ?? defaultParentId ?? null,
      notes: initial?.notes ?? "",
    },
  });

  const parentIdValue = watch("parent_id");
  const unsaved = useUnsavedChanges(isDirty && !isSubmitting);

  useEffect(() => {
    // Server-side search. The endpoint caps pageSize at 100, so client-side
    // filtering over one page meant a parent past that cap could not be found by
    // title at all — indistinguishable from "no such event" (issue #47).
    const controller = new AbortController();
    const timer = setTimeout(() => {
      const params = new URLSearchParams({
        topLevelOnly: "true",
        pageSize: "25",
        sort: "title",
        projectId,
      });
      if (parentSearch) params.set("search", parentSearch);

      fetch(`/api/events?${params.toString()}`, { signal: controller.signal })
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
        .then((data: { data?: EventSummary[] } | EventSummary[] | { events?: EventSummary[] }) => {
          if (Array.isArray(data)) {
            setParentEvents(data);
          } else if ((data as { data?: EventSummary[] }).data) {
            setParentEvents((data as { data: EventSummary[] }).data);
          } else if ((data as { events?: EventSummary[] }).events) {
            setParentEvents((data as { events: EventSummary[] }).events);
          }
        })
        .catch(() => {
          /* aborted or failed; the picker keeps its previous options */
        });
    }, 250);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [projectId, parentSearch]);

  // Resolve a parent_id that the option list does not contain — a seeded
  // ?parentId=, or an existing parent beyond the current page of candidates.
  useEffect(() => {
    if (!parentIdValue) {
      setSeededParent(null);
      setSeedResolution("idle");
      return;
    }
    if (seededParent?.id === parentIdValue) return;

    const controller = new AbortController();
    setSeedResolution("loading");
    fetch(`/api/events/${parentIdValue}`, { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((data: { id: string; title: string; parent: { id: string } | null }) => {
        setSeededParent({ id: data.id, title: data.title, isSubEvent: data.parent !== null });
        setSeedResolution("idle");
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        // Never fall back to the "no parent" placeholder: parent_id is still set
        // and would still be submitted.
        setSeededParent(null);
        setSeedResolution("failed");
      });

    return () => controller.abort();
  }, [parentIdValue, seededParent?.id]);

  const selectedParent =
    parentEvents.find((e) => e.id === parentIdValue) ??
    (seededParent?.id === parentIdValue ? seededParent : null);

  // Exclude the current event from parent options in edit mode
  const parentOptions =
    mode === "edit" && initial?.id ? parentEvents.filter((e) => e.id !== initial.id) : parentEvents;

  async function onSubmit(values: FormValues) {
    try {
      const url = mode === "create" ? "/api/events" : `/api/events/${initial?.id}`;
      const method = mode === "create" ? "POST" : "PUT";

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
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
          parent_title?: string;
        };
        if (errorCode(data) === "DEPTH_LIMIT_EXCEEDED") {
          setError("parent_id", {
            type: "manual",
            message: t("errors.depth_limit", { parent_title: data.parent_title ?? "" }),
          });
          return;
        }
        toast.error(t("errors.save_failed"));
        return;
      }

      const event = (await res.json()) as EventDetail;
      toast.success(t("saved_toast"));
      onSuccess(event);
    } catch {
      toast.error(t("errors.save_failed"));
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Title */}
      <div className="space-y-1">
        <Label htmlFor="title">{t("fields.title")}</Label>
        <Input
          id="title"
          type="text"
          {...register("title")}
          aria-invalid={!!errors.title}
          disabled={isSubmitting}
        />
        {errors.title && <p className="text-destructive text-xs">{errors.title.message}</p>}
      </div>

      {/* Description */}
      <div className="space-y-1">
        <Label htmlFor="description">{t("fields.description")}</Label>
        <Textarea
          id="description"
          rows={3}
          {...register("description")}
          disabled={isSubmitting}
          className="min-h-[72px]"
        />
      </div>

      {/* Event Type */}
      <div className="space-y-1">
        <Label>{t("fields.event_type")}</Label>
        <Controller
          control={control}
          name="event_type_id"
          render={({ field }) => (
            <EventTypeCombobox
              projectId={projectId}
              value={field.value ?? null}
              onChange={field.onChange}
            />
          )}
        />
      </div>

      {/* Start date */}
      <div className="space-y-3 rounded-md border p-4">
        <p className="text-sm font-semibold">{t("fields.start_date")}</p>
        <Controller
          control={control}
          name="start_year"
          render={({ field }) => (
            <Controller
              control={control}
              name="start_month"
              render={({ field: mField }) => (
                <Controller
                  control={control}
                  name="start_day"
                  render={({ field: dField }) => (
                    <PartialDateInput
                      label={t("fields.start_date")}
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
        {(errors.start_year || errors.start_month || errors.start_day) && (
          <p className="text-destructive text-xs">
            {errors.start_year?.message ?? errors.start_month?.message ?? errors.start_day?.message}
          </p>
        )}
        <Controller
          control={control}
          name="start_date_certainty"
          render={({ field }) => (
            <CertaintySelector
              label={t("fields.start_date_certainty")}
              value={field.value}
              onChange={field.onChange}
              disabled={isSubmitting}
            />
          )}
        />
      </div>

      {/* End date */}
      <div className="space-y-3 rounded-md border p-4">
        <p className="text-sm font-semibold">{t("fields.end_date")}</p>
        <Controller
          control={control}
          name="end_year"
          render={({ field }) => (
            <Controller
              control={control}
              name="end_month"
              render={({ field: mField }) => (
                <Controller
                  control={control}
                  name="end_day"
                  render={({ field: dField }) => (
                    <PartialDateInput
                      label={t("fields.end_date")}
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
        {(errors.end_year || errors.end_month || errors.end_day) && (
          <p className="text-destructive text-xs">
            {errors.end_year?.message ?? errors.end_month?.message ?? errors.end_day?.message}
          </p>
        )}
        <Controller
          control={control}
          name="end_date_certainty"
          render={({ field }) => (
            <CertaintySelector
              label={t("fields.end_date_certainty")}
              value={field.value}
              onChange={field.onChange}
              disabled={isSubmitting}
            />
          )}
        />
      </div>

      {/* Location */}
      <div className="space-y-1">
        <Label htmlFor="location">{t("fields.location")}</Label>
        <Input id="location" type="text" {...register("location")} disabled={isSubmitting} />
      </div>

      {/* Parent event */}
      <div className="space-y-1">
        <Label>{t("fields.parent")}</Label>
        <Popover open={parentOpen} onOpenChange={setParentOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              role="combobox"
              aria-expanded={parentOpen}
              className="w-full justify-between"
              disabled={isSubmitting}
            >
              {!parentIdValue ? (
                <span className="text-muted-foreground">{t("fields.parent_none")}</span>
              ) : selectedParent ? (
                <span>{selectedParent.title}</span>
              ) : seedResolution === "loading" ? (
                <span className="text-muted-foreground">{t("fields.parent_loading")}</span>
              ) : (
                // parent_id is set but unresolvable. Showing the "no parent"
                // placeholder here is what made the form save something other than
                // what it displayed (issue #47).
                <span className="text-destructive">{t("fields.parent_unresolved")}</span>
              )}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0" align="start">
            <Command shouldFilter={false}>
              <CommandInput
                placeholder={t("fields.parent_search_placeholder")}
                value={parentSearch}
                onValueChange={setParentSearch}
              />
              <CommandList>
                <CommandEmpty>{t("fields.parent_no_results")}</CommandEmpty>
                <CommandGroup>
                  <CommandItem
                    value="__none__"
                    onSelect={() => {
                      setValue("parent_id", null);
                      setParentOpen(false);
                      setParentSearch("");
                    }}
                  >
                    <span className="text-muted-foreground">{t("fields.parent_none")}</span>
                  </CommandItem>
                  {parentOptions.map((event) => (
                    <CommandItem
                      key={event.id}
                      value={event.title}
                      onSelect={() => {
                        setValue("parent_id", event.id);
                        setParentOpen(false);
                        setParentSearch("");
                      }}
                    >
                      <span className="flex-1">{event.title}</span>
                      {parentIdValue === event.id && <Check className="h-4 w-4" />}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        {selectedParent && "isSubEvent" in selectedParent && selectedParent.isSubEvent && (
          <p className="text-destructive text-xs">
            {t("fields.parent_not_eligible", { title: selectedParent.title })}
          </p>
        )}
        {errors.parent_id && <p className="text-destructive text-xs">{errors.parent_id.message}</p>}
      </div>

      {/* Notes */}
      <div className="space-y-1">
        <Label htmlFor="notes">{t("fields.notes")}</Label>
        <Textarea id="notes" rows={4} {...register("notes")} disabled={isSubmitting} />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => unsaved.guard(onCancel)}
          disabled={isSubmitting}
        >
          {t("cancel")}
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {t("save")}
        </Button>
      </div>

      <UnsavedChangesDialog
        isConfirming={unsaved.isConfirming}
        confirmDiscard={unsaved.confirmDiscard}
        setConfirming={unsaved.setConfirming}
      />
    </form>
  );
}
