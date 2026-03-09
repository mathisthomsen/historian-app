"use client";

import { useTranslations } from "next-intl";
import React from "react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface PersonDetailTabsProps {
  attributesContent: React.ReactNode;
  namesContent: React.ReactNode;
}

export function PersonDetailTabs({ attributesContent, namesContent }: PersonDetailTabsProps) {
  const t = useTranslations("persons.detail");

  return (
    <Tabs defaultValue="attributes">
      <TabsList>
        <TabsTrigger value="attributes">{t("tabs.attributes")}</TabsTrigger>
        <TabsTrigger value="names">{t("tabs.names")}</TabsTrigger>
        <TabsTrigger value="events">{t("tabs.events")}</TabsTrigger>
        <TabsTrigger value="persons">{t("tabs.persons")}</TabsTrigger>
        <TabsTrigger value="sources">{t("tabs.sources")}</TabsTrigger>
      </TabsList>
      <TabsContent value="attributes" className="mt-4">
        {attributesContent}
      </TabsContent>
      <TabsContent value="names" className="mt-4">
        {namesContent}
      </TabsContent>
      <TabsContent value="events" className="mt-4">
        <p className="text-sm text-muted-foreground">{t("relations_placeholder")}</p>
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
