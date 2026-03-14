import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { RelationsDataTable } from "@/app/[locale]/(app)/relations/_components/RelationsDataTable";
import { auth } from "@/auth";

export const metadata: Metadata = {
  title: "Relationen",
};

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function RelationsPage({ params: _params }: PageProps) {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");

  const t = await getTranslations("relations");
  const projectId = session.user.projectId ?? "";

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold">{t("title")}</h1>
      <RelationsDataTable projectId={projectId} />
    </div>
  );
}
