"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { PropertyEvidenceBadge } from "@/components/relations/PropertyEvidenceBadge";
import { Badge } from "@/components/ui/badge";
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

  const startCertainty = event.start_date_certainty.toLowerCase() as
    | "certain"
    | "probable"
    | "possible"
    | "unknown"
    | "unevidenced";
  const endCertainty = event.end_date_certainty.toLowerCase() as
    | "certain"
    | "probable"
    | "possible"
    | "unknown"
    | "unevidenced";

  const hasStartDate = startDate !== "—";
  const hasEndDate = endDate !== "—";
  const showStartCertainty = hasStartDate && event.start_date_certainty !== "UNKNOWN";
  const showEndCertainty = hasEndDate && event.end_date_certainty !== "UNKNOWN";

  return (
    <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {event.event_type && (
        <div className="space-y-1">
          <dt className="text-muted-foreground text-xs font-medium">{t("event_type")}</dt>
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
        <dt className="text-muted-foreground text-xs font-medium">{t("start_date")}</dt>
        <dd className="flex items-center gap-2 text-sm">
          <span>{startDate}</span>
          {showStartCertainty && (
            <Badge variant={startCertainty}>{tCertainty(event.start_date_certainty)}</Badge>
          )}
          <PropertyEvidenceBadge
            projectId={projectId}
            entityType="EVENT"
            entityId={event.id}
            property="start_year"
            fieldLabel={t("start_date")}
            hasCertainty={hasStartDate}
          />
        </dd>
      </div>

      <div className="space-y-1">
        <dt className="text-muted-foreground text-xs font-medium">{t("end_date")}</dt>
        <dd className="flex items-center gap-2 text-sm">
          <span>{endDate}</span>
          {showEndCertainty && (
            <Badge variant={endCertainty}>{tCertainty(event.end_date_certainty)}</Badge>
          )}
          <PropertyEvidenceBadge
            projectId={projectId}
            entityType="EVENT"
            entityId={event.id}
            property="end_year"
            fieldLabel={t("end_date")}
            hasCertainty={hasEndDate}
          />
        </dd>
      </div>

      {event.location && (
        <div className="space-y-1">
          <dt className="text-muted-foreground text-xs font-medium">{t("location")}</dt>
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
          <dt className="text-muted-foreground text-xs font-medium">{t("parent")}</dt>
          <dd className="text-sm">
            <Link
              href={`/${resolvedLocale}/events/${event.parent.id}`}
              className="hover:text-foreground underline"
            >
              {event.parent.title}
            </Link>
          </dd>
        </div>
      )}

      {event.description && (
        <div className="col-span-full space-y-1">
          <dt className="text-muted-foreground text-xs font-medium">{t("description")}</dt>
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
          <dt className="text-muted-foreground text-xs font-medium">{t("notes")}</dt>
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
        <dt className="text-muted-foreground text-xs font-medium">{t("created_at")}</dt>
        <dd className="text-sm">{createdAt}</dd>
      </div>

      {event.created_by_id && (
        <div className="space-y-1">
          <dt className="text-muted-foreground text-xs font-medium">{t("created_by")}</dt>
          <dd className="text-muted-foreground text-sm" title={event.created_by_id}>
            {`${event.created_by_id.slice(0, 8)}…`}
          </dd>
        </div>
      )}
    </dl>
  );
}
