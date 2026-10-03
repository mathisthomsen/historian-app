import type { Certainty, Person } from "@prisma/client";
import { useLocale, useTranslations } from "next-intl";

import { CertaintyMarker } from "@/components/research/CertaintyMarker";
import { formatPartialDate } from "@/lib/date";

/**
 * Every `Person` column whose type is `Certainty` — derived from the generated
 * Prisma type, never listed by hand.
 *
 * This is the guard behind the certainty panel's scope claim. The specimen may
 * only point at a field that really carries a certainty, so pointing it at
 * `first_name` — or at a column the schema later drops — is a compile error
 * under `pnpm typecheck`, not a review comment. It covers the specimen's data;
 * the panel's copy has no equivalent and is checked by hand against the schema.
 */
export type PersonCertaintyField = {
  [K in keyof Person]: Person[K] extends Certainty ? K : never;
}[keyof Person];

type SpecimenValue =
  | { kind: "date"; year: number; month: number | null; day: number | null }
  | { kind: "text"; text: string };

interface SpecimenField {
  field: PersonCertaintyField;
  certainty: Certainty;
  labelKey: "birthDate" | "birthPlace";
  value: SpecimenValue;
}

/**
 * One record, two fields, two levels.
 *
 * William Shakespeare (owner's choice, 2026-10-03, PR #155): his baptism on
 * 26 April 1564 is recorded in the Stratford parish register, his birthday is
 * not. 23 April is the traditional date, so the birth date is POSSIBLE, an
 * editorial judgement for this example rather than the source's own words.
 * The birthplace is CERTAIN. The baptism itself is not a `Person` field, so it
 * appears where the model keeps it: as the evidence for the birth date in the
 * evidence panel. Sources are recorded in spec 2-6c, C6.
 */
const SPECIMEN: SpecimenField[] = [
  {
    field: "birth_date_certainty",
    certainty: "POSSIBLE",
    labelKey: "birthDate",
    value: { kind: "date", year: 1564, month: 4, day: 23 },
  },
  {
    field: "birth_place_certainty",
    certainty: "CERTAIN",
    labelKey: "birthPlace",
    value: { kind: "text", text: "Stratford-upon-Avon" },
  },
];

/** The levels no field in the specimen holds, named in its legend. */
const UNASSIGNED_LEVELS: Certainty[] = ["PROBABLE", "UNKNOWN"];

/**
 * One record whose fields carry different certainties.
 *
 * The panel's claim is about *scope*: the fields of one record each hold their
 * own level. So the specimen shows that scope rather than a legend of four
 * levels: a record whose birth date is possible and whose birthplace is
 * certain. Each level is named in words beside its marker, so colour and shape
 * are never the only signal.
 */
export function RecordCertaintySpecimen() {
  const t = useTranslations("marketing.panels.certainty.specimen");
  const tCommon = useTranslations("common");
  const locale = useLocale();

  return (
    <div className="w-full max-w-[22rem]">
      <p className="border-border border-b pb-3 text-base font-medium">{t("person")}</p>
      {/* One <div> per field wrapping its <dt>/<dd>: see PartialDateSpecimen. */}
      <dl>
        {SPECIMEN.map(({ field, certainty, labelKey, value }) => (
          <div
            key={field}
            className="border-border flex flex-col gap-1 border-b py-3 sm:flex-row sm:items-baseline sm:gap-4"
          >
            <dt className="text-muted-foreground text-[0.65rem] tracking-[0.14em] uppercase sm:w-28 sm:shrink-0">
              {t(labelKey)}
            </dt>
            <dd className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <span className="min-w-[6rem] font-mono text-sm">
                {value.kind === "date"
                  ? formatPartialDate(value.year, value.month, value.day, locale)
                  : value.text}
              </span>
              <span className="flex items-center gap-2 text-sm">
                <CertaintyMarker certainty={certainty} />
                <span data-testid="certainty-level-name">{tCommon(`certainty.${certainty}`)}</span>
              </span>
            </dd>
          </div>
        ))}
      </dl>
      <p
        data-testid="certainty-specimen-legend"
        className="text-muted-foreground mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm"
      >
        {UNASSIGNED_LEVELS.map((level) => (
          <span key={level} className="flex items-center gap-2">
            <CertaintyMarker certainty={level} />
            <span>{tCommon(`certainty.${level}`)}</span>
          </span>
        ))}
        <span>— {t("legendUnassigned")}</span>
      </p>
      <p data-testid="certainty-specimen-caption" className="mt-3 text-sm text-pretty">
        {t("caption")}
      </p>
    </div>
  );
}

/**
 * A year, with the month and day left empty on purpose.
 *
 * Three labelled slots rather than one date string: the panel argues that year,
 * month and day are stored separately and that an absent month is an answer,
 * not a gap. A rendered "1740" alone cannot make that argument — the empty
 * slots are the point, so they are drawn rather than omitted.
 */
export function PartialDateSpecimen() {
  const t = useTranslations("marketing.panels.dates.specimen");

  return (
    <div className="w-full max-w-[20rem]">
      {/*
        Each term sits inside the same wrapper as its value. Emitting all three
        <dt>s and then all three <dd>s — which an earlier grid layout required —
        is read as one term group with three terms and three descriptions, so a
        screen reader cannot tell which value belongs to Year and which to
        Month. A <div> grouping one dt with one dd is valid inside a <dl> and is
        what carries the pairing.
      */}
      <dl className="flex justify-between gap-3 text-center">
        {(["year", "month", "day"] as const).map((part) => (
          <div key={part} className="flex flex-1 flex-col gap-4">
            <dt className="text-muted-foreground text-[0.65rem] tracking-[0.14em] uppercase">
              {t(part)}
            </dt>
            <dd
              className={
                part === "year"
                  ? "font-mono text-3xl leading-none sm:text-4xl"
                  : "text-muted-foreground/50 font-mono text-3xl leading-none sm:text-4xl"
              }
            >
              {part === "year" ? (
                "1740"
              ) : (
                <>
                  <span aria-hidden="true">&mdash;</span>
                  <span className="sr-only">{t("unknown")}</span>
                </>
              )}
            </dd>
          </div>
        ))}
      </dl>

      {/*
        The certainty qualifies the date, not the year.

        It used to sit inside the year's <dd>, which — once each term was
        correctly paired with its value — made assistive tech read "Year: 1740,
        Certainty: Possible" and implied you could hold a certain year with a
        possible month. The schema has one certainty per date:
        `birth_date_certainty` covers year, month and day together, and
        `DatedCell` in the app puts the marker beside the whole formatted date
        for the same reason. Naming the scope in words is what keeps the
        specimen honest about which field the level belongs to.
      */}
      <p className="border-border text-muted-foreground mt-6 flex items-center justify-center gap-2 border-t pt-5 text-sm">
        <CertaintyMarker certainty="POSSIBLE" />
        {t("dateCertainty")}
      </p>
    </div>
  );
}
