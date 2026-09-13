import Link from "next/link";
import { useTranslations } from "next-intl";

/**
 * Build status is not certainty. These dots were coloured from the
 * `--color-certainty-*` family, which on this page means one specific thing:
 * how well evidenced an assertion is. "Shipped" is not a certain claim and
 * "planned" is not an unknown one — they are project states, and borrowing the
 * scholarly palette for them teaches a mapping the data model does not have.
 *
 * Commit 92e03e0 already caught half of this: `CertaintyMarker` was being used
 * as the bullet here and announced "Gewissheit: …" before the status text. It
 * removed the announcement and kept the colours, so the visual half of the same
 * mistake survived. `src/test/certainty-vocabulary.test.ts` now refuses both.
 */
const STATUS_ROWS = [
  { key: "shipped", color: "var(--color-success)" },
  { key: "next", color: "var(--color-info)" },
  { key: "planned", color: "var(--color-muted-foreground)" },
] as const;

interface OpenDevelopmentProps {
  locale: string;
}

/**
 * Band 4 — where the project stands.
 *
 * The band used to be a single left-hugging column inside a max-w-7xl
 * container: the prose was capped at 24ch/52ch and nothing claimed the rest, so
 * on a desktop roughly 40% of the band was empty and read as content that had
 * failed to load. The status lines are now a ledger occupying the second column
 * of the same editorial grid the highlights use, which turns that space from
 * leftover into structure — and gives the three lines a shape of their own
 * rather than leaving them a bulleted afterthought under the prose.
 */
export function OpenDevelopment({ locale }: OpenDevelopmentProps) {
  const t = useTranslations("marketing.openDev");

  return (
    <section className="px-4 sm:px-6">
      <div className="editorial-grid">
        <div>
          <p className="text-muted-foreground text-xs tracking-[0.14em] uppercase">{t("kicker")}</p>
          <h2 className="mt-3 max-w-[20ch] text-[length:var(--text-display-sm)] leading-tight font-semibold tracking-[var(--tracking-display-sm)] text-balance">
            {t("title")}
          </h2>
          <p className="text-muted-foreground mt-4 max-w-[42ch]">{t("body")}</p>
          <Link href={`/${locale}/changelog`} className="mt-6 inline-block text-sm">
            {t("changelogLink")} →
          </Link>
        </div>

        {/* Explicit role="list"/"listitem": Tailwind's preflight sets
            `list-style: none`, which strips the implicit roles in WebKit
            (issue #90). Not redundant with the tag names. */}
        <ul role="list" data-slot="specimen" className="specimen specimen--ledger">
          {STATUS_ROWS.map(({ key, color }) => (
            <li
              key={key}
              role="listitem"
              className="border-border flex items-baseline gap-4 border-b py-4 last:border-b-0"
            >
              <span
                aria-hidden="true"
                className="size-2.5 shrink-0 translate-y-[-0.1em] rounded-full"
                style={{ backgroundColor: color }}
              />
              <span className="flex-1 text-sm">{t(`status.${key}.label`)}</span>
              <span className="text-muted-foreground shrink-0 font-mono text-xs tracking-[0.08em] uppercase">
                {t(`status.${key}.state`)}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
