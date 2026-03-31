"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import { ActivityLog } from "@/components/relations/ActivityLog";
import { RelationsTab } from "@/components/relations/RelationsTab";
import { EntityEvidenceTab } from "@/components/research/EntityEvidenceTab";
import { SourceDetailCard } from "@/components/research/SourceDetailCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { SourceDetail } from "@/types/source";

interface SourceDetailTabsProps {
  source: SourceDetail;
  locale: string;
  projectId: string;
}

export function SourceDetailTabs({ source, locale, projectId }: SourceDetailTabsProps) {
  const t = useTranslations("sources");
  const [activityRefreshKey, setActivityRefreshKey] = useState(0);

  function handleRefresh() {
    setActivityRefreshKey((k) => k + 1);
  }

  const sourceFieldLabels: Record<string, string> = {
    title: t("field_title"),
    author: t("field_author"),
    date: t("field_date"),
    repository: t("field_repository"),
    call_number: t("field_call_number"),
    url: t("field_url"),
    notes: t("field_notes"),
  };

  return (
    <Tabs defaultValue="details">
      <TabsList>
        <TabsTrigger value="details">{t("tab_details")}</TabsTrigger>
        <TabsTrigger value="persons">{t("tab_persons")}</TabsTrigger>
        <TabsTrigger value="events">{t("tab_events")}</TabsTrigger>
        <TabsTrigger value="relations">{t("tab_relations")}</TabsTrigger>
        <TabsTrigger value="evidence">{t("tab_evidence")}</TabsTrigger>
        <TabsTrigger value="activity">{t("tab_activity")}</TabsTrigger>
      </TabsList>

      <TabsContent value="details" className="mt-4">
        <SourceDetailCard source={source} locale={locale} projectId={projectId} />
      </TabsContent>

      <TabsContent value="persons" className="mt-4">
        <RelationsTab
          projectId={projectId}
          entityType="SOURCE"
          entityId={source.id}
          entityLabel={source.title}
          filterToEntityType="PERSON"
          onRefresh={handleRefresh}
        />
      </TabsContent>

      <TabsContent value="events" className="mt-4">
        <RelationsTab
          projectId={projectId}
          entityType="SOURCE"
          entityId={source.id}
          entityLabel={source.title}
          filterToEntityType="EVENT"
          onRefresh={handleRefresh}
        />
      </TabsContent>

      <TabsContent value="relations" className="mt-4">
        <RelationsTab
          projectId={projectId}
          entityType="SOURCE"
          entityId={source.id}
          entityLabel={source.title}
          onRefresh={handleRefresh}
        />
      </TabsContent>

      <TabsContent value="evidence" className="mt-4">
        <EntityEvidenceTab
          projectId={projectId}
          entityType="SOURCE"
          entityId={source.id}
          fieldLabels={sourceFieldLabels}
        />
      </TabsContent>

      <TabsContent value="activity" className="mt-4">
        <ActivityLog
          projectId={projectId}
          entityType="SOURCE"
          entityId={source.id}
          refreshKey={activityRefreshKey}
        />
      </TabsContent>
    </Tabs>
  );
}
