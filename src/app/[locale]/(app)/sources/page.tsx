import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { auth } from "@/auth";
import { SourceTable } from "@/components/research/SourceTable";
import { prisma } from "@/lib/db";
import type { SourceReliability, SourceSummary } from "@/types/source";

export const metadata: Metadata = {
  title: "Quellen",
};

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    page?: string;
    search?: string;
    sort?: string;
    order?: string;
    reliability?: string;
    type?: string;
  }>;
}

export default async function SourcesPage({ params, searchParams }: PageProps) {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");

  const { locale } = await params;
  const {
    page: pageStr = "1",
    search = "",
    sort = "created_at",
    order = "desc",
    reliability: reliabilityStr = "",
    type = "",
  } = await searchParams;

  const t = await getTranslations("sources");
  const projectId = session.user.projectId;

  const page = Math.max(1, parseInt(pageStr, 10) || 1);
  const pageSize = 25;

  const validSort = ["title", "author", "created_at"].includes(sort) ? sort : "created_at";
  const validOrder = order === "asc" ? "asc" : "desc";

  const reliabilityValues = reliabilityStr
    ? (reliabilityStr.split(",").filter(Boolean) as SourceReliability[])
    : [];

  let sources: SourceSummary[] = [];
  let total = 0;

  if (projectId) {
    const where: Record<string, unknown> = {
      project_id: projectId,
      deleted_at: null,
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: "insensitive" as const } },
              { author: { contains: search, mode: "insensitive" as const } },
            ],
          }
        : {}),
      ...(reliabilityValues.length > 0 ? { reliability: { in: reliabilityValues } } : {}),
      ...(type ? { type: { equals: type, mode: "insensitive" as const } } : {}),
    };

    const [rawSources, count] = await Promise.all([
      prisma.source.findMany({
        where,
        orderBy: { [validSort]: validOrder },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.source.count({ where }),
    ]);

    sources = rawSources.map(
      (s): SourceSummary => ({
        id: s.id,
        title: s.title,
        type: s.type,
        author: s.author,
        reliability: s.reliability as SourceSummary["reliability"],
        created_at: s.created_at.toISOString(),
      }),
    );
    total = count;
  }

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <Link
          href={`/${locale}/sources/new`}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          {t("create")}
        </Link>
      </div>
      <SourceTable
        sources={sources}
        total={total}
        page={page}
        totalPages={totalPages}
        locale={locale}
        projectId={projectId ?? ""}
        search={search}
        sort={validSort}
        order={validOrder}
        reliability={reliabilityValues}
        type={type}
      />
    </div>
  );
}
