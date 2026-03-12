import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { EventTypeSettingsTable } from "@/components/research/EventTypeSettingsTable";

export const metadata: Metadata = {
  title: "Ereignistypen",
};

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function EventTypesPage({ params: _params }: PageProps) {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");

  const t = await getTranslations("event_types");
  const projectId = session.user.projectId ?? "";

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold">{t("title")}</h1>
      <EventTypeSettingsTable projectId={projectId} />
    </div>
  );
}
