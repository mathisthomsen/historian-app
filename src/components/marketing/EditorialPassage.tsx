import { useTranslations } from "next-intl";

/**
 * Band 2 — the problem, stated once.
 *
 * Set as an epigraph rather than a paragraph. The earlier version was a single
 * centred <p> at display-sm in the body colour, with no rule, label or frame:
 * nothing on screen said it was a set-piece, so it read as copy that had lost
 * its section. What makes it deliberate here is the anchoring, not the size —
 * a hairline rule across the content width, a kicker pinned to the left edge of
 * the measure, and the passage left-aligned against that edge. Centring is what
 * made it float.
 *
 * The lede is muted and light; the closing clause steps up to the foreground.
 * That contrast, not weight, is the emphasis — <strong> carries the meaning,
 * font-weight stays inherited so the passage keeps one texture.
 */
export function EditorialPassage() {
  const t = useTranslations("marketing.editorial");

  return (
    <section className="px-4 sm:px-6">
      <div className="border-border mx-auto max-w-[var(--content-max-width)] border-t pt-8 sm:pt-12">
        <p className="text-muted-foreground text-xs tracking-[0.14em] uppercase">{t("kicker")}</p>
        <p className="mt-8 max-w-[26ch] text-[length:var(--text-display-md)] leading-[1.15] font-light tracking-[var(--tracking-display-md)] text-pretty sm:mt-12">
          <span className="text-muted-foreground">{t("lede")} </span>
          <strong className="text-foreground [font-weight:inherit]">{t("punchline")}</strong>
        </p>
      </div>
    </section>
  );
}
