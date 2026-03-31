import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { auth } from "@/auth";
import { PersonsListClient } from "@/components/research/PersonsListClient";
import { cache } from "@/lib/cache";
import { db, prisma } from "@/lib/db";
import type { PersonSummary } from "@/types/person";

export const metadata: Metadata = {
  title: "Personen",
};

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string; search?: string; sort?: string; order?: string }>;
}

export default async function PersonsPage({ params, searchParams }: PageProps) {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");

  const { locale } = await params;
  const {
    page: pageStr = "1",
    search = "",
    sort = "last_name",
    order = "asc",
  } = await searchParams;

  const t = await getTranslations("persons");
  const projectId = session.user.projectId;

  const page = Math.max(1, parseInt(pageStr, 10) || 1);
  const pageSize = 25;

  let persons: PersonSummary[] = [];
  let total = 0;

  if (projectId) {
    const cacheKey = `person-list:${projectId}:${page}:${pageSize}:${search}:${sort}:${order}`;
    const cached = await cache.get<{ data: PersonSummary[]; pagination: { total: number } }>(
      cacheKey,
    );

    if (cached) {
      persons = cached.data;
      total = cached.pagination.total;
    } else {
      const where = {
        project_id: projectId,
        ...(search
          ? {
              OR: [
                { first_name: { contains: search, mode: "insensitive" as const } },
                { last_name: { contains: search, mode: "insensitive" as const } },
                { names: { some: { name: { contains: search, mode: "insensitive" as const } } } },
              ],
            }
          : {}),
      };

      const validSort = ["first_name", "last_name", "created_at"].includes(sort)
        ? sort
        : "last_name";
      const validOrder = order === "desc" ? "desc" : "asc";

      const [rawPersons, count] = await Promise.all([
        db.person.findMany({
          where,
          include: { names: true },
          orderBy: { [validSort]: validOrder },
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
        prisma.person.count({ where: { project_id: projectId, deleted_at: null } }),
      ]);

      persons = rawPersons.map((p) => ({
        id: p.id,
        first_name: p.first_name,
        last_name: p.last_name,
        birth_year: p.birth_year,
        birth_month: p.birth_month,
        birth_day: p.birth_day,
        birth_date_certainty: p.birth_date_certainty as PersonSummary["birth_date_certainty"],
        death_year: p.death_year,
        death_month: p.death_month,
        death_day: p.death_day,
        death_date_certainty: p.death_date_certainty as PersonSummary["death_date_certainty"],
        created_at: p.created_at.toISOString(),
        names: p.names.map((n) => ({
          name: n.name,
          language: n.language,
          is_primary: n.is_primary,
        })),
      }));
      total = count;

      await cache.set(cacheKey, { data: persons, pagination: { total } }, 30);
    }
  }

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <Link
          href={`/${locale}/persons/new`}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          {t("create")}
        </Link>
      </div>
      <PersonsListClient
        persons={persons}
        total={total}
        page={page}
        totalPages={totalPages}
        locale={locale}
        projectId={projectId ?? ""}
        search={search}
        sort={sort}
        order={order}
      />
    </div>
  );
}
