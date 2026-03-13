import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { auth } from "@/auth";
import { SourceForm } from "@/components/research/SourceForm";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("sources");
  return { title: t("new_title") };
}

export default async function NewSourcePage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");

  const { locale } = await params;
  const projectId = session.user.projectId ?? "";

  if (!projectId) {
    redirect(`/${locale}/dashboard`);
  }

  const t = await getTranslations("sources");

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold">{t("new_title")}</h1>
      <SourceForm projectId={projectId} locale={locale} />
    </div>
  );
}
