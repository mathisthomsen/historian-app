import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { auth } from "@/auth";
import { SourceForm } from "@/components/research/SourceForm";
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
    <div className="page-container mx-auto max-w-2xl space-y-6">
      <div className="hidden md:block">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href={`/${locale}/sources`}>{t("title")}</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator>/</BreadcrumbSeparator>
            <BreadcrumbItem>
              <BreadcrumbPage>{t("new_title")}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      <h1 className="text-foreground text-3xl font-semibold tracking-[-0.02em]">
        {t("new_title")}
      </h1>
      <SourceForm projectId={projectId} locale={locale} />
    </div>
  );
}
