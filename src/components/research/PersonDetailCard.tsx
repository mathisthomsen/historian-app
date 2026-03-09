import { getTranslations } from "next-intl/server";

import { formatPartialDate } from "@/lib/date";
import type { PersonDetail } from "@/types/person";

interface PersonDetailCardProps {
  person: PersonDetail;
  locale: string;
}

export async function PersonDetailCard({ person, locale }: PersonDetailCardProps) {
  const t = await getTranslations("persons.fields");
  const tCertainty = await getTranslations("persons.certainty");

  const birthDate = formatPartialDate(
    person.birth_year,
    person.birth_month,
    person.birth_day,
    locale,
  );
  const deathDate = formatPartialDate(
    person.death_year,
    person.death_month,
    person.death_day,
    locale,
  );

  const createdAt = new Date(person.created_at).toLocaleDateString(
    locale === "de" ? "de-DE" : "en-US",
  );

  return (
    <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div className="space-y-1">
        <dt className="text-xs font-medium text-muted-foreground">{t("birth_date")}</dt>
        <dd className="text-sm">
          {birthDate}
          {birthDate !== "—" && (
            <span className="ml-1 text-xs text-muted-foreground">
              ({tCertainty(person.birth_date_certainty)})
            </span>
          )}
        </dd>
      </div>

      <div className="space-y-1">
        <dt className="text-xs font-medium text-muted-foreground">{t("birth_place")}</dt>
        <dd className="text-sm">{person.birth_place ?? "—"}</dd>
      </div>

      <div className="space-y-1">
        <dt className="text-xs font-medium text-muted-foreground">{t("death_date")}</dt>
        <dd className="text-sm">
          {deathDate}
          {deathDate !== "—" && (
            <span className="ml-1 text-xs text-muted-foreground">
              ({tCertainty(person.death_date_certainty)})
            </span>
          )}
        </dd>
      </div>

      <div className="space-y-1">
        <dt className="text-xs font-medium text-muted-foreground">{t("death_place")}</dt>
        <dd className="text-sm">{person.death_place ?? "—"}</dd>
      </div>

      {person.notes && (
        <div className="col-span-full space-y-1">
          <dt className="text-xs font-medium text-muted-foreground">{t("notes")}</dt>
          <dd className="whitespace-pre-wrap text-sm">{person.notes}</dd>
        </div>
      )}

      <div className="space-y-1">
        <dt className="text-xs font-medium text-muted-foreground">{t("created_at")}</dt>
        <dd className="text-sm">{createdAt}</dd>
      </div>

      {person.created_by_id && (
        <div className="space-y-1">
          <dt className="text-xs font-medium text-muted-foreground">{t("created_by")}</dt>
          <dd className="text-sm font-mono text-xs">{person.created_by_id}</dd>
        </div>
      )}
    </dl>
  );
}
