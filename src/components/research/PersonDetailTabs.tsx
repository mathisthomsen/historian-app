"use client";

import { useTranslations } from "next-intl";
import React, { useState } from "react";

import { ActivityLog } from "@/components/relations/ActivityLog";
import { RelationsTab } from "@/components/relations/RelationsTab";
import { EntityEvidenceTab } from "@/components/research/EntityEvidenceTab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface PersonDetailTabsProps {
  attributesContent: React.ReactNode;
  namesContent: React.ReactNode;
  personId: string;
  personLabel: string;
  projectId: string;
}

export function PersonDetailTabs({
  attributesContent,
  namesContent,
  personId,
  personLabel,
  projectId,
}: PersonDetailTabsProps) {
  const t = useTranslations("persons.detail");
  const [activityRefreshKey, setActivityRefreshKey] = useState(0);

  function handleRefresh() {
    setActivityRefreshKey((k) => k + 1);
  }

  return (
    <Tabs defaultValue="attributes">
      <TabsList>
        <TabsTrigger value="attributes">{t("tabs.attributes")}</TabsTrigger>
        <TabsTrigger value="names">{t("tabs.names")}</TabsTrigger>
        <TabsTrigger value="events">{t("tabs.events")}</TabsTrigger>
        <TabsTrigger value="persons">{t("tabs.persons")}</TabsTrigger>
        <TabsTrigger value="sources">{t("tabs.sources")}</TabsTrigger>
        <TabsTrigger value="relations">{t("tabs.relations")}</TabsTrigger>
        <TabsTrigger value="evidence">{t("tabs.evidence")}</TabsTrigger>
        <TabsTrigger value="activity">{t("tabs.activity")}</TabsTrigger>
      </TabsList>
      <TabsContent value="attributes" className="mt-4">
        {attributesContent}
      </TabsContent>
      <TabsContent value="names" className="mt-4">
        {namesContent}
      </TabsContent>
      <TabsContent value="events" className="mt-4">
        <RelationsTab
          projectId={projectId}
          entityType="PERSON"
          entityId={personId}
          entityLabel={personLabel}
          filterToEntityType="EVENT"
          onRefresh={handleRefresh}
        />
      </TabsContent>
      <TabsContent value="persons" className="mt-4">
        <RelationsTab
          projectId={projectId}
          entityType="PERSON"
          entityId={personId}
          entityLabel={personLabel}
          filterToEntityType="PERSON"
          onRefresh={handleRefresh}
        />
      </TabsContent>
      <TabsContent value="sources" className="mt-4">
        <RelationsTab
          projectId={projectId}
          entityType="PERSON"
          entityId={personId}
          entityLabel={personLabel}
          filterToEntityType="SOURCE"
          onRefresh={handleRefresh}
        />
      </TabsContent>
      <TabsContent value="relations" className="mt-4">
        <RelationsTab
          projectId={projectId}
          entityType="PERSON"
          entityId={personId}
          entityLabel={personLabel}
          onRefresh={handleRefresh}
        />
      </TabsContent>
      <TabsContent value="evidence" className="mt-4">
        <EntityEvidenceTab projectId={projectId} entityType="PERSON" entityId={personId} />
      </TabsContent>
      <TabsContent value="activity" className="mt-4">
        <ActivityLog
          projectId={projectId}
          entityType="PERSON"
          entityId={personId}
          refreshKey={activityRefreshKey}
        />
      </TabsContent>
    </Tabs>
  );
}
