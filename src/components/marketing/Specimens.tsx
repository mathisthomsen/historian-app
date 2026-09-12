import type { Certainty } from "@prisma/client";
import { useTranslations } from "next-intl";

import { CertaintyMarker } from "@/components/research/CertaintyMarker";

const LEVELS: Certainty[] = ["CERTAIN", "PROBABLE", "POSSIBLE", "UNKNOWN"];

/**
 * The four certainty levels, named and drawn.
 *
 * The panel's claim is "four levels, not one assertion", so the specimen has to
 * show four distinguishable things with their names attached. The rail's
 * version was a wrapped row of unlabelled markers in a card footer, which
 * demonstrated that markers exist without showing what they mean.
 */
export function CertaintyScale() {
  const t = useTranslations("common");

  return (
    // Explicit role="list": Tailwind's preflight sets `list-style: none` on
    // every <ul>/<ol>, and in WebKit that strips the implicit list/listitem
    // roles (issue #90). Do not delete it as "redundant with the tag name".
    <ul role="list" className="w-full max-w-[18rem]">
      {LEVELS.map((level) => (
        <li
          key={level}
          role="listitem"
          className="border-border flex items-center gap-4 border-b py-3 last:border-b-0"
        >
          <CertaintyMarker certainty={level} />
          <span className="text-sm">{t(`certainty.${level}`)}</span>
        </li>
      ))}
    </ul>
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
