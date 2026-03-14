import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { RelationTypesTable } from "@/app/[locale]/(app)/settings/relation-types/_components/RelationTypesTable";
import { auth } from "@/auth";

export const metadata: Metadata = {
  title: "Relationstypen",
};

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function RelationTypesPage({ params: _params }: PageProps) {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");

  const t = await getTranslations("relationTypes");
  const projectId = session.user.projectId ?? "";

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold">{t("title")}</h1>
      <RelationTypesTable projectId={projectId} />
    </div>
  );
}
