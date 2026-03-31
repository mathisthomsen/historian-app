"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { PropertyEvidenceBadge } from "@/components/relations/PropertyEvidenceBadge";
import { formatPartialDate } from "@/lib/date";
import type { EventDetail } from "@/types/event";

interface EventDetailCardProps {
  event: EventDetail;
  locale: string;
  projectId: string;
}

export function EventDetailCard({ event, locale, projectId }: EventDetailCardProps) {
  const t = useTranslations("events.fields");
  const tCertainty = useTranslations("events.certainty");
  const params = useParams<{ locale: string }>();
  const resolvedLocale = locale ?? params?.locale ?? "de";

  const startDate = formatPartialDate(
    event.start_year,
    event.start_month,
    event.start_day,
    resolvedLocale,
  );
  const endDate = formatPartialDate(event.end_year, event.end_month, event.end_day, resolvedLocale);

  const createdAt = new Date(event.created_at).toLocaleDateString(
    resolvedLocale === "de" ? "de-DE" : "en-US",
  );

  return (
    <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {event.event_type && (
        <div className="space-y-1">
          <dt className="text-xs font-medium text-muted-foreground">{t("event_type")}</dt>
          <dd className="flex items-center gap-2 text-sm">
            {event.event_type.color && (
              <span
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: event.event_type.color }}
              />
            )}
            {event.event_type.name}
          </dd>
        </div>
      )}

      <div className="space-y-1">
        <dt className="text-xs font-medium text-muted-foreground">{t("start_date")}</dt>
        <dd className="flex items-center gap-2 text-sm">
          <span>
            {startDate}
            {startDate !== "—" && event.start_date_certainty !== "UNKNOWN" && (
              <span className="ml-1 text-xs text-muted-foreground">
                ({tCertainty(event.start_date_certainty)})
              </span>
            )}
          </span>
          <PropertyEvidenceBadge
            projectId={projectId}
            entityType="EVENT"
            entityId={event.id}
            property="start_year"
            fieldLabel={t("start_date")}
          />
        </dd>
      </div>

      <div className="space-y-1">
        <dt className="text-xs font-medium text-muted-foreground">{t("end_date")}</dt>
        <dd className="flex items-center gap-2 text-sm">
          <span>
            {endDate}
            {endDate !== "—" && event.end_date_certainty !== "UNKNOWN" && (
              <span className="ml-1 text-xs text-muted-foreground">
                ({tCertainty(event.end_date_certainty)})
              </span>
            )}
          </span>
          <PropertyEvidenceBadge
            projectId={projectId}
            entityType="EVENT"
            entityId={event.id}
            property="end_year"
            fieldLabel={t("end_date")}
          />
        </dd>
      </div>

      {event.location && (
        <div className="space-y-1">
          <dt className="text-xs font-medium text-muted-foreground">{t("location")}</dt>
          <dd className="flex items-center gap-2 text-sm">
            <span>{event.location}</span>
            <PropertyEvidenceBadge
              projectId={projectId}
              entityType="EVENT"
              entityId={event.id}
              property="location"
              fieldLabel={t("location")}
            />
          </dd>
        </div>
      )}

      {event.parent && (
        <div className="space-y-1">
          <dt className="text-xs font-medium text-muted-foreground">{t("parent")}</dt>
          <dd className="text-sm">
            <Link
              href={`/${resolvedLocale}/events/${event.parent.id}`}
              className="underline hover:text-foreground"
            >
              {event.parent.title}
            </Link>
          </dd>
        </div>
      )}

      {event.description && (
        <div className="col-span-full space-y-1">
          <dt className="text-xs font-medium text-muted-foreground">{t("description")}</dt>
          <dd className="flex items-start gap-2 text-sm">
            <span className="whitespace-pre-wrap">{event.description}</span>
            <PropertyEvidenceBadge
              projectId={projectId}
              entityType="EVENT"
              entityId={event.id}
              property="description"
              fieldLabel={t("description")}
            />
          </dd>
        </div>
      )}

      {event.notes && (
        <div className="col-span-full space-y-1">
          <dt className="text-xs font-medium text-muted-foreground">{t("notes")}</dt>
          <dd className="flex items-start gap-2 text-sm">
            <span className="whitespace-pre-wrap">{event.notes}</span>
            <PropertyEvidenceBadge
              projectId={projectId}
              entityType="EVENT"
              entityId={event.id}
              property="notes"
              fieldLabel={t("notes")}
            />
          </dd>
        </div>
      )}

      <div className="space-y-1">
        <dt className="text-xs font-medium text-muted-foreground">{t("created_at")}</dt>
        <dd className="text-sm">{createdAt}</dd>
      </div>

      {event.created_by_id && (
        <div className="space-y-1">
          <dt className="text-xs font-medium text-muted-foreground">{t("created_by")}</dt>
          <dd className="text-sm text-muted-foreground" title={event.created_by_id}>
            {`${event.created_by_id.slice(0, 8)}…`}
          </dd>
        </div>
      )}
    </dl>
  );
}
