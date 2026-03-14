import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { auth } from "@/auth";
import { DeleteSourceButton } from "@/components/research/DeleteSourceButton";
import { SourceDetailTabs } from "@/components/research/SourceDetailTabs";
import { prisma } from "@/lib/db";
import type { SourceDetail } from "@/types/source";

interface PageProps {
  params: Promise<{ locale: string; id: string }>;
}

export default async function SourceDetailPage({ params }: PageProps) {
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
    where: { user_id: session.user.id, project_id: raw.project_id },
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
      <div>
        <Link
          href={`/${locale}/sources`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← {t("back_to_list")}
        </Link>
      </div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{source.title}</h1>
        <div className="flex gap-2">
          <Link
            href={`/${locale}/sources/${id}/edit`}
            className="inline-flex items-center rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            {t("edit_title")}
          </Link>
          <DeleteSourceButton id={id} locale={locale} label={t("delete")} />
        </div>
      </div>
      <SourceDetailTabs source={source} locale={locale} projectId={raw.project_id} />
    </div>
  );
}
