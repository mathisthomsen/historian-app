import Link from "next/link";
import { useTranslations } from "next-intl";

import { HeroAppFrame } from "@/components/marketing/HeroAppFrame";
import { Button } from "@/components/ui/button";

interface HeroProps {
  locale: string;
}

export function Hero({ locale }: HeroProps) {
  const t = useTranslations("marketing.hero");

  return (
    <section className="overflow-hidden px-4 pt-[var(--section-gap-md)] text-center sm:px-6">
      <h1 className="mx-auto max-w-[16ch] leading-[var(--leading-display)] font-semibold tracking-[var(--tracking-display-lg)] text-balance text-[var(--text-display-lg)]">
        {t("headline")}
      </h1>
      <p className="text-muted-foreground mx-auto mt-6 max-w-[46ch] text-lg text-pretty">
        {t("sub")}
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button asChild size="lg">
          <Link href={`/${locale}/auth/register`}>{t("primary")}</Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href="#highlights">{t("secondary")}</Link>
        </Button>
      </div>
      <div className="mt-[var(--section-gap-sm)]">
        <HeroAppFrame />
      </div>
    </section>
  );
}
