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
  | { kind: "text"; text: string }
  /** No value at all — and therefore no level: there is no assertion to qualify. */
  | { kind: "none" };

interface SpecimenField {
  field: PersonCertaintyField;
  /** `null` exactly when the value is `none`, as `PersonDetailCard` renders an absent place. */
  certainty: Certainty | null;
  labelKey: "birthDate" | "birthPlace" | "deathDate" | "deathPlace";
  value: SpecimenValue;
}

/**
 * One record, four fields, two levels in use.
 *
 * Kaspar Hauser, because the evidence panel already cites the 1828 Nuremberg
 * police file on him. His birthplace is unidentified to this day — Nuremberg is
 * where he appeared — so it is shown empty and without a level, exactly as
 * `PersonDetailCard` shows an absent place: certainty qualifies an assertion,
 * and the level stored with an absent place is only a neutral default that the
 * product never displays as an answer. POSSIBLE and UNKNOWN are named in the legend
 * instead of being assigned to a field, because assigning one would mean
 * inventing a belief the record does not hold.
 *
 * The birth year and the death date and place are pending the owner's
 * confirmation against a cited source (spec 2-6c, C6 / acceptance 6).
 */
const SPECIMEN: SpecimenField[] = [
  {
    field: "birth_date_certainty",
    certainty: "PROBABLE",
    labelKey: "birthDate",
    value: { kind: "date", year: 1812, month: null, day: null },
  },
  {
    field: "birth_place_certainty",
    certainty: null,
    labelKey: "birthPlace",
    value: { kind: "none" },
  },
  {
    field: "death_date_certainty",
    certainty: "CERTAIN",
    labelKey: "deathDate",
    value: { kind: "date", year: 1833, month: 12, day: 17 },
  },
  {
    field: "death_place_certainty",
    certainty: "CERTAIN",
    labelKey: "deathPlace",
    value: { kind: "text", text: "Ansbach" },
  },
];

/** The levels no field in the specimen holds, named in its legend. */
const UNASSIGNED_LEVELS: Certainty[] = ["POSSIBLE", "UNKNOWN"];

/**
 * One record whose fields carry different certainties.
 *
 * The panel's claim is about *scope* — the dates and places of a life each hold
 * their own level — so the specimen shows the scope rather than a legend of four
 * levels: a record where the birth year is probable, the birthplace unrecorded
 * and the death certain. Each level is named in words beside its marker, so
 * colour and shape are never the only signal.
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
                {value.kind === "date" ? (
                  formatPartialDate(value.year, value.month, value.day, locale)
                ) : value.kind === "text" ? (
                  value.text
                ) : (
                  <>
                    <span aria-hidden="true" className="text-muted-foreground/50">
                      &mdash;
                    </span>
                    <span className="sr-only">{t("noValue")}</span>
                  </>
                )}
              </span>
              {certainty !== null && (
                <span className="flex items-center gap-2 text-sm">
                  <CertaintyMarker certainty={certainty} />
                  <span data-testid="certainty-level-name">
                    {tCommon(`certainty.${certainty}`)}
                  </span>
                </span>
              )}
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
