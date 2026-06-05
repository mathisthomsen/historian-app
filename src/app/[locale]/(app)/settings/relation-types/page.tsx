import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { RelationTypesTable } from "@/app/[locale]/(app)/settings/relation-types/_components/RelationTypesTable";
import { auth } from "@/auth";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "relationTypes" });
  return { title: t("title") };
}

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function RelationTypesPage({ params: _params }: PageProps) {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");

  const t = await getTranslations("relationTypes");
  const projectId = session.user.projectId ?? "";

  return (
    <div className="page-container mx-auto space-y-6">
      <h1 className="text-foreground text-3xl font-semibold tracking-[-0.02em]">{t("title")}</h1>
      <RelationTypesTable projectId={projectId} />
    </div>
  );
}
