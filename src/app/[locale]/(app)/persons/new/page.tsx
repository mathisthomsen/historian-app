import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { auth } from "@/auth";
import { NewPersonClient } from "@/components/research/NewPersonClient";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function NewPersonPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");

  const { locale } = await params;
  const t = await getTranslations("persons");
  const projectId = session.user.projectId;

  if (!projectId) {
    // TODO: Epic 3.1 — redirect to project creation
    redirect(`/${locale}/dashboard`);
  }

  return (
    <div className="mx-auto max-w-2xl p-6">
      <h1 className="mb-6 text-2xl font-bold">{t("create_title")}</h1>
      <NewPersonClient projectId={projectId} locale={locale} />
    </div>
  );
}
