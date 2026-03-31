import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { auth } from "@/auth";
import { DeletePersonButton } from "@/components/research/DeletePersonButton";
import { PersonDetailCard } from "@/components/research/PersonDetailCard";
import { PersonDetailTabs } from "@/components/research/PersonDetailTabs";
import { prisma } from "@/lib/db";
import type { PersonDetail } from "@/types/person";

interface PageProps {
  params: Promise<{ locale: string; id: string }>;
}

export default async function PersonDetailPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");

  const { locale, id } = await params;
  const t = await getTranslations("persons");

  const rawPerson = await prisma.person.findFirst({
    where: { id, deleted_at: null },
    include: { names: true },
  });

  if (!rawPerson) notFound();

  const [membership, relationCounts] = await Promise.all([
    prisma.userProject.findFirst({
      where: { user_id: session.user.id, project_id: rawPerson.project_id },
    }),
    Promise.all([
      prisma.relation.groupBy({
        by: ["to_type"],
        where: { from_type: "PERSON", from_id: id, deleted_at: null },
        _count: { _all: true },
      }),
      prisma.relation.groupBy({
        by: ["from_type"],
        where: { to_type: "PERSON", to_id: id, deleted_at: null },
        _count: { _all: true },
      }),
    ]).then(([fromRows, toRows]) => {
      const counts: Record<string, number> = {};
      for (const row of fromRows) {
        const key = row.to_type as string;
        counts[key] = (counts[key] ?? 0) + row._count._all;
      }
      for (const row of toRows) {
        const key = row.from_type as string;
        counts[key] = (counts[key] ?? 0) + row._count._all;
      }
      return {
        total: Object.values(counts).reduce((a, b) => a + b, 0),
        events: counts["EVENT"] ?? 0,
        persons: counts["PERSON"] ?? 0,
        sources: counts["SOURCE"] ?? 0,
      };
    }),
  ]);
  if (!membership) notFound();

  const raw = rawPerson;

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
    _count: { relations_from: relationCounts.total, relations_to: 0 },
  };

  const displayName =
    [person.first_name, person.last_name].filter(Boolean).join(" ") ||
    person.names.find((n) => n.is_primary)?.name ||
    person.names[0]?.name ||
    t("errors.not_found");

  const namesContent = (
    <ul className="space-y-2">
      {person.names.length === 0 ? (
        <li className="text-sm text-muted-foreground">—</li>
      ) : (
        person.names.map((n, i) => (
          <li key={i} className="flex items-center gap-2 text-sm">
            <span>{n.name}</span>
            {n.language && (
              <span className="rounded bg-muted px-1 py-0.5 text-xs text-muted-foreground">
                {n.language}
              </span>
            )}
            {n.is_primary && (
              <span className="rounded bg-primary/10 px-1 py-0.5 text-xs text-primary">
                {t("names.is_primary")}
              </span>
            )}
          </li>
        ))
      )}
    </ul>
  );

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{displayName}</h1>
        <div className="flex gap-2">
          <Link
            href={`/${locale}/persons/${id}/edit`}
            className="inline-flex items-center rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            {t("edit_title")}
          </Link>
          <DeletePersonButton id={id} locale={locale} label={t("delete")} />
        </div>
      </div>
      <PersonDetailTabs
        attributesContent={<PersonDetailCard person={person} projectId={raw.project_id} locale={locale} />}
        namesContent={namesContent}
        personId={id}
        personLabel={displayName}
        projectId={raw.project_id}
        tabCounts={relationCounts}
      />
    </div>
  );
}
