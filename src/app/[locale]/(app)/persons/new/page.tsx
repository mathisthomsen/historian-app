import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { auth } from "@/auth";
import { NewPersonClient } from "@/components/research/NewPersonClient";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

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
    <div className="page-container mx-auto max-w-2xl space-y-6">
      <div className="hidden md:block">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href={`/${locale}/persons`}>{t("title")}</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator>/</BreadcrumbSeparator>
            <BreadcrumbItem>
              <BreadcrumbPage>{t("create_title")}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      <h1 className="text-foreground text-3xl font-semibold tracking-[-0.02em]">
        {t("create_title")}
      </h1>
      <NewPersonClient projectId={projectId} locale={locale} />
    </div>
  );
}
