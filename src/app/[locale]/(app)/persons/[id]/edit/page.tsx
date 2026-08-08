import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { auth } from "@/auth";
import { EditPersonClient } from "@/components/research/EditPersonClient";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { prisma } from "@/lib/db";
import type { PersonDetail } from "@/types/person";

interface PageProps {
  params: Promise<{ locale: string; id: string }>;
}

export default async function EditPersonPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");

  const { locale, id } = await params;
  const t = await getTranslations("persons");

  const raw = await prisma.person.findFirst({
    where: { id, deleted_at: null },
    include: { names: true },
  });

  if (!raw) notFound();

  const membership = await prisma.userProject.findFirst({
    where: {
      user_id: session.user.id,
      project_id: raw.project_id,
      role: { in: ["OWNER", "EDITOR"] },
    },
  });
  if (!membership) notFound();

  const person: PersonDetail = {
    id: raw.id,
    first_name: raw.first_name,
    last_name: raw.last_name,
    birth_year: raw.birth_year,
    birth_month: raw.birth_month,
    birth_day: raw.birth_day,
    birth_date_certainty: raw.birth_date_certainty as PersonDetail["birth_date_certainty"],
    birth_place: raw.birth_place,
    death_year: raw.death_year,
    death_month: raw.death_month,
    death_day: raw.death_day,
    death_date_certainty: raw.death_date_certainty as PersonDetail["death_date_certainty"],
    death_place: raw.death_place,
    notes: raw.notes,
    created_by_id: raw.created_by_id,
    created_at: raw.created_at.toISOString(),
    updated_at: raw.updated_at.toISOString(),
    names: raw.names.map((n) => ({
      name: n.name,
      language: n.language,
      is_primary: n.is_primary,
    })),
    _count: { relations_from: 0, relations_to: 0 },
  };

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
              <BreadcrumbPage>{t("edit_title")}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      <h1 className="text-foreground text-3xl font-semibold tracking-[-0.02em]">
        {t("edit_title")}
      </h1>
      <EditPersonClient person={person} projectId={raw.project_id} locale={locale} />
    </div>
  );
}
