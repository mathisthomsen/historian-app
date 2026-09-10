import Link from "next/link";
import { useTranslations } from "next-intl";

import { CertaintyMarker } from "@/components/research/CertaintyMarker";

interface OpenDevelopmentProps {
  locale: string;
}

export function OpenDevelopment({ locale }: OpenDevelopmentProps) {
  const t = useTranslations("marketing.openDev");

  return (
    <section className="px-4 sm:px-6">
      <div className="mx-auto max-w-[var(--content-max-width)]">
        <p className="text-muted-foreground text-xs tracking-[0.14em] uppercase">{t("kicker")}</p>
        <h2 className="mt-3 max-w-[24ch] leading-tight font-semibold tracking-[var(--tracking-display-sm)] text-balance text-[var(--text-display-sm)]">
          {t("title")}
        </h2>
        <p className="text-muted-foreground mt-4 max-w-[52ch]">{t("body")}</p>
        <ul className="mt-8 space-y-3">
          <li className="flex items-center gap-3 text-sm">
            <CertaintyMarker certainty="CERTAIN" />
            {t("shipped")}
          </li>
          <li className="flex items-center gap-3 text-sm">
            <CertaintyMarker certainty="PROBABLE" />
            {t("next")}
          </li>
          <li className="flex items-center gap-3 text-sm">
            <CertaintyMarker certainty="UNKNOWN" />
            {t("planned")}
          </li>
        </ul>
        <Link href={`/${locale}/changelog`} className="mt-6 inline-block text-sm">
          {t("changelogLink")} →
        </Link>
      </div>
    </section>
  );
}
