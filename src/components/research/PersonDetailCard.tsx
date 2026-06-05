import { getTranslations } from "next-intl/server";

import { PropertyEvidenceBadge } from "@/components/relations/PropertyEvidenceBadge";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { formatPartialDate } from "@/lib/date";
import type { PersonDetail } from "@/types/person";

interface PersonDetailCardProps {
  person: PersonDetail;
  projectId: string;
  locale: string;
}

export async function PersonDetailCard({ person, projectId, locale }: PersonDetailCardProps) {
  const t = await getTranslations("persons.fields");
  const tCertainty = await getTranslations("persons.certainty");
  const tShell = await getTranslations("shell");

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

  const birthCertainty = person.birth_date_certainty.toLowerCase() as
    | "certain"
    | "probable"
    | "possible"
    | "unknown"
    | "unevidenced";
  const deathCertainty = person.death_date_certainty.toLowerCase() as
    | "certain"
    | "probable"
    | "possible"
    | "unknown"
    | "unevidenced";

  const hasBirthDate = birthDate !== "—";
  const hasDeathDate = deathDate !== "—";

  return (
    <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div className="space-y-1">
        <dt className="text-muted-foreground text-xs font-medium">{t("birth_date")}</dt>
        <dd className="flex items-center gap-2 text-sm">
          <span>{birthDate}</span>
          {hasBirthDate && (
            <Badge variant={birthCertainty}>{tCertainty(person.birth_date_certainty)}</Badge>
          )}

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <PropertyEvidenceBadge
                  projectId={projectId}
                  entityType="PERSON"
                  entityId={person.id}
                  property="birth_year"
                  fieldLabel={t("birth_date")}
                  hasCertainty={hasBirthDate}
                />
              </TooltipTrigger>
              <TooltipContent className="text-center">{tShell("nav.sources")}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </dd>
      </div>

      <div className="space-y-1">
        <dt className="text-muted-foreground text-xs font-medium">{t("birth_place")}</dt>
        <dd className="flex items-center gap-2 text-sm">
          <span>{person.birth_place ?? "—"}</span>
          <PropertyEvidenceBadge
            projectId={projectId}
            entityType="PERSON"
            entityId={person.id}
            property="birth_place"
            fieldLabel={t("birth_place")}
          />
        </dd>
      </div>

      <div className="space-y-1">
        <dt className="text-muted-foreground text-xs font-medium">{t("death_date")}</dt>
        <dd className="flex items-center gap-2 text-sm">
          <span>{deathDate}</span>
          {hasDeathDate && (
            <Badge variant={deathCertainty}>{tCertainty(person.death_date_certainty)}</Badge>
          )}
          <PropertyEvidenceBadge
            projectId={projectId}
            entityType="PERSON"
            entityId={person.id}
            property="death_year"
            fieldLabel={t("death_date")}
            hasCertainty={hasDeathDate}
          />
        </dd>
      </div>

      <div className="space-y-1">
        <dt className="text-muted-foreground text-xs font-medium">{t("death_place")}</dt>
        <dd className="flex items-center gap-2 text-sm">
          <span>{person.death_place ?? "—"}</span>
          <PropertyEvidenceBadge
            projectId={projectId}
            entityType="PERSON"
            entityId={person.id}
            property="death_place"
            fieldLabel={t("death_place")}
          />
        </dd>
      </div>

      {person.notes && (
        <div className="col-span-full space-y-1">
          <dt className="text-muted-foreground text-xs font-medium">{t("notes")}</dt>
          <dd className="flex items-start gap-2 text-sm">
            <span className="whitespace-pre-wrap">{person.notes}</span>
            <PropertyEvidenceBadge
              projectId={projectId}
              entityType="PERSON"
              entityId={person.id}
              property="notes"
              fieldLabel={t("notes")}
            />
          </dd>
        </div>
      )}

      <div className="space-y-1">
        <dt className="text-muted-foreground text-xs font-medium">{t("created_at")}</dt>
        <dd className="text-sm">{createdAt}</dd>
      </div>

      {person.created_by_id && (
        <div className="space-y-1">
          <dt className="text-muted-foreground text-xs font-medium">{t("created_by")}</dt>
          <dd className="text-muted-foreground text-sm" title={person.created_by_id}>
            {`${person.created_by_id.slice(0, 8)}…`}
          </dd>
        </div>
      )}
    </dl>
  );
}
