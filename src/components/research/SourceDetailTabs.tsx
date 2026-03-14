"use client";

import { useTranslations } from "next-intl";

import { ActivityLog } from "@/components/relations/ActivityLog";
import { RelationsTab } from "@/components/relations/RelationsTab";
import { ReliabilityBadge } from "@/components/research/ReliabilityBadge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { SourceDetail } from "@/types/source";

interface SourceDetailTabsProps {
  source: SourceDetail;
  locale: string;
  projectId: string;
}

export function SourceDetailTabs({ source, locale, projectId }: SourceDetailTabsProps) {
  const t = useTranslations("sources");

  const totalLinks = source._count.relation_evidence + source._count.property_evidence;

  return (
    <Tabs defaultValue="details">
      <TabsList>
        <TabsTrigger value="details">{t("tab_details")}</TabsTrigger>
        <TabsTrigger value="relations">{t("tab_relations")}</TabsTrigger>
        <TabsTrigger value="activity">{t("tab_activity")}</TabsTrigger>
      </TabsList>

      <TabsContent value="details" className="mt-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Title */}
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">{t("field_title")}</p>
            <p className="text-sm">{source.title}</p>
          </div>

          {/* Type */}
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">{t("field_type")}</p>
            <span className="inline-block rounded bg-muted px-2 py-0.5 text-xs">{source.type}</span>
          </div>

          {/* Author */}
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">{t("field_author")}</p>
            <p className="text-sm">{source.author ?? "—"}</p>
          </div>

          {/* Reliability */}
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">{t("field_reliability")}</p>
            <ReliabilityBadge reliability={source.reliability} />
          </div>

          {/* Date */}
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">{t("field_date")}</p>
            <p className="text-sm">{source.date ?? "—"}</p>
          </div>

          {/* Repository */}
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">{t("field_repository")}</p>
            <p className="text-sm">{source.repository ?? "—"}</p>
          </div>

          {/* Call Number */}
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">{t("field_call_number")}</p>
            <p className="text-sm">{source.call_number ?? "—"}</p>
          </div>

          {/* URL */}
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">{t("field_url")}</p>
            {source.url ? (
              <a
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm underline hover:text-foreground"
              >
                {source.url}
              </a>
            ) : (
              <p className="text-sm">—</p>
            )}
          </div>

          {/* Notes — full width */}
          {source.notes && (
            <div className="space-y-1 sm:col-span-2">
              <p className="text-xs font-medium text-muted-foreground">{t("field_notes")}</p>
              <p className="whitespace-pre-wrap text-sm">{source.notes}</p>
            </div>
          )}

          {/* Footer row */}
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">{t("created_at")}</p>
            <p className="text-sm">
              {new Date(source.created_at).toLocaleDateString(locale)}
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">{t("updated_at")}</p>
            <p className="text-sm">
              {new Date(source.updated_at).toLocaleDateString(locale)}
            </p>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="relations" className="mt-4">
        <RelationsTab
          projectId={projectId}
          entityType="SOURCE"
          entityId={source.id}
          entityLabel={source.title}
        />
        {totalLinks > 0 && (
          <p className="mt-2 text-sm text-muted-foreground">
            ({source._count.relation_evidence} Verknüpfungen •{" "}
            {source._count.property_evidence} Quellenbelege)
          </p>
        )}
      </TabsContent>

      <TabsContent value="activity" className="mt-4">
        <ActivityLog projectId={projectId} entityType="SOURCE" entityId={source.id} />
      </TabsContent>
    </Tabs>
  );
}
