"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";

import { EventDetailCard } from "@/components/research/EventDetailCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatPartialDate } from "@/lib/date";
import type { EventDetail, EventSummary } from "@/types/event";

interface EventDetailTabsProps {
  event: EventDetail;
  locale: string;
}

export function EventDetailTabs({ event, locale }: EventDetailTabsProps) {
  const t = useTranslations("events.detail");

  const subEventCount = event._count?.sub_events ?? event.sub_events?.length ?? 0;

  function renderSubEventRow(sub: EventSummary) {
    const start = formatPartialDate(sub.start_year, sub.start_month, sub.start_day, locale);
    const end = formatPartialDate(sub.end_year, sub.end_month, sub.end_day, locale);

    return (
      <tr key={sub.id} className="border-b">
        <td className="py-2 pr-4">
          <Link href={`/${locale}/events/${sub.id}`} className="underline hover:text-foreground">
            {sub.title}
          </Link>
        </td>
        <td className="py-2 pr-4">
          {sub.event_type ? (
            <span className="flex items-center gap-2 text-sm">
              {sub.event_type.color && (
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: sub.event_type.color }}
                />
              )}
              {sub.event_type.name}
            </span>
          ) : (
            "—"
          )}
        </td>
        <td className="py-2 pr-4 text-sm text-muted-foreground">
          {start !== "—" ? start : "—"}
          {end !== "—" && ` – ${end}`}
        </td>
      </tr>
    );
  }

  return (
    <Tabs defaultValue="attributes">
      <TabsList>
        <TabsTrigger value="attributes">{t("tabs.attributes")}</TabsTrigger>
        <TabsTrigger value="sub_events">
          {t("tabs.sub_events", { count: subEventCount })}
        </TabsTrigger>
        <TabsTrigger value="persons">{t("tabs.persons")}</TabsTrigger>
        <TabsTrigger value="sources">{t("tabs.sources")}</TabsTrigger>
      </TabsList>

      <TabsContent value="attributes" className="mt-4">
        <EventDetailCard event={event} locale={locale} />
      </TabsContent>

      <TabsContent value="sub_events" className="mt-4">
        <div className="space-y-3">
          <div className="flex justify-end">
            <Link
              href={`/${locale}/events/new?parentId=${event.id}`}
              className="inline-flex items-center rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              {t("add_sub_event")}
            </Link>
          </div>
          {event.sub_events && event.sub_events.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <tbody>{event.sub_events.map((sub) => renderSubEventRow(sub))}</tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{t("sub_events_empty")}</p>
          )}
        </div>
      </TabsContent>

      <TabsContent value="persons" className="mt-4">
        <p className="text-sm text-muted-foreground">{t("relations_placeholder")}</p>
      </TabsContent>

      <TabsContent value="sources" className="mt-4">
        <p className="text-sm text-muted-foreground">{t("relations_placeholder")}</p>
      </TabsContent>
    </Tabs>
  );
}
