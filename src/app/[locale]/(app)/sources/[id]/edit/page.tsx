import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { auth } from "@/auth";
import { SourceForm } from "@/components/research/SourceForm";
import { prisma } from "@/lib/db";
import type { SourceDetail } from "@/types/source";

interface PageProps {
  params: Promise<{ locale: string; id: string }>;
}

export default async function EditSourcePage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");

  const { locale, id } = await params;
  const t = await getTranslations("sources");

  const raw = await prisma.source.findFirst({
    where: { id, deleted_at: null },
    include: {
      _count: {
        select: {
          relation_evidence: true,
          property_evidence: true,
        },
      },
    },
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

  const source: SourceDetail = {
    id: raw.id,
    title: raw.title,
    type: raw.type,
    author: raw.author,
    date: raw.date,
    repository: raw.repository,
    call_number: raw.call_number,
    url: raw.url,
    reliability: raw.reliability as SourceDetail["reliability"],
    notes: raw.notes,
    created_by_id: raw.created_by_id,
    created_at: raw.created_at.toISOString(),
    updated_at: raw.updated_at.toISOString(),
    _count: {
      relation_evidence: raw._count.relation_evidence,
      property_evidence: raw._count.property_evidence,
    },
  };

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold">{t("edit_title")}</h1>
      <SourceForm projectId={raw.project_id} locale={locale} initial={source} />
    </div>
  );
}
