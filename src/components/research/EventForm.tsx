"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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
import type { EventDetail, EventSummary } from "@/types/event";

const formSchema = z
  .object({
    title: z.string().min(1),
    description: z.string().optional().nullable(),
    event_type_id: z.string().cuid().optional().nullable(),
    start_year: z.number().int().min(1).max(2100).optional().nullable(),
    start_month: z.number().int().min(1).max(12).optional().nullable(),
    start_day: z.number().int().min(1).max(31).optional().nullable(),
    start_date_certainty: z.enum(["CERTAIN", "PROBABLE", "POSSIBLE", "UNKNOWN"]).default("UNKNOWN"),
    end_year: z.number().int().min(1).max(2100).optional().nullable(),
    end_month: z.number().int().min(1).max(12).optional().nullable(),
    end_day: z.number().int().min(1).max(31).optional().nullable(),
    end_date_certainty: z.enum(["CERTAIN", "PROBABLE", "POSSIBLE", "UNKNOWN"]).default("UNKNOWN"),
    location: z.string().optional().nullable(),
    parent_id: z.string().cuid().optional().nullable(),
    notes: z.string().optional().nullable(),
  })
  .superRefine((data, ctx) => {
    if (data.start_month && !data.start_year) {
      ctx.addIssue({ code: "custom", path: ["start_month"], message: "month_requires_year" });
    }
    if (data.start_day && !data.start_month) {
      ctx.addIssue({ code: "custom", path: ["start_day"], message: "day_requires_month" });
    }
    if (data.end_month && !data.end_year) {
      ctx.addIssue({ code: "custom", path: ["end_month"], message: "month_requires_year" });
    }
    if (data.end_day && !data.end_month) {
      ctx.addIssue({ code: "custom", path: ["end_day"], message: "day_requires_month" });
    }
  });

type FormValues = z.infer<typeof formSchema>;

interface EventFormProps {
  mode: "create" | "edit";
  initial?: EventDetail;
  projectId: string;
  defaultParentId?: string | undefined;
  onSuccess: (event: EventDetail) => void;
}

export function EventForm({
  mode,
  initial,
  projectId,
  defaultParentId,
  onSuccess,
}: EventFormProps) {
  const t = useTranslations("events");
  const router = useRouter();

  const [parentEvents, setParentEvents] = useState<EventSummary[]>([]);
  const [parentOpen, setParentOpen] = useState(false);
  const [parentSearch, setParentSearch] = useState("");

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    setError,
    formState: { errors, isSubmitting },
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

  useEffect(() => {
    fetch(`/api/events?topLevelOnly=true&pageSize=100&sort=title&projectId=${projectId}`)
      .then((r) => r.json())
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
        /* silently fail */
      });
  }, [projectId]);

  const selectedParent = parentEvents.find((e) => e.id === parentIdValue) ?? null;

  const filteredParents = parentSearch
    ? parentEvents.filter((e) => e.title.toLowerCase().includes(parentSearch.toLowerCase()))
    : parentEvents;

  // Exclude the current event from parent options in edit mode
  const parentOptions =
    mode === "edit" && initial?.id
      ? filteredParents.filter((e) => e.id !== initial.id)
      : filteredParents;

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
        if (data.error === "DEPTH_LIMIT_EXCEEDED") {
          setError("parent_id", {
            type: "manual",
            message: t("errors.depth_limit", { parent_title: data.parent_title ?? "" }),
          });
          return;
        }
        toast.error(data.error ?? t("errors.save_failed"));
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
        {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
      </div>

      {/* Description */}
      <div className="space-y-1">
        <Label htmlFor="description">{t("fields.description")}</Label>
        <textarea
          id="description"
          rows={3}
          {...register("description")}
          disabled={isSubmitting}
          className="flex min-h-[72px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
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
          <p className="text-xs text-destructive">
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
          <p className="text-xs text-destructive">
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
              {selectedParent ? (
                <span>{selectedParent.title}</span>
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0" align="start">
            <Command>
              <CommandInput
                placeholder={t("fields.parent")}
                value={parentSearch}
                onValueChange={setParentSearch}
              />
              <CommandList>
                <CommandEmpty>—</CommandEmpty>
                <CommandGroup>
                  <CommandItem
                    value="__none__"
                    onSelect={() => {
                      setValue("parent_id", null);
                      setParentOpen(false);
                      setParentSearch("");
                    }}
                  >
                    <span className="text-muted-foreground">—</span>
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
        {errors.parent_id && <p className="text-xs text-destructive">{errors.parent_id.message}</p>}
      </div>

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
          {t("save")}
        </Button>
      </div>
    </form>
  );
}
