import Link from "next/link";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";

interface CtaBandProps {
  locale: string;
}

/**
 * Part A only. Registration is still open at this point, so this band is an
 * honest signup CTA and must NOT mention a closed alpha or a waitlist.
 * Part B (#29) replaces this component with the access-request form and flips
 * the copy in the same PR that closes registration.
 */
export function CtaBand({ locale }: CtaBandProps) {
  const t = useTranslations("marketing.cta");

  return (
    <section className="px-4 sm:px-6">
      <div className="border-border bg-card mx-auto max-w-[var(--content-max-width)] rounded-xl border p-8 text-center sm:p-12">
        <h2 className="mx-auto max-w-[20ch] leading-tight font-semibold tracking-[var(--tracking-display-sm)] text-balance text-[var(--text-display-sm)]">
          {t("title")}
        </h2>
        <p className="text-muted-foreground mx-auto mt-4 max-w-[46ch]">{t("body")}</p>
        <Button asChild size="lg" className="mt-8">
          <Link href={`/${locale}/auth/register`}>{t("action")}</Link>
        </Button>
      </div>
    </section>
  );
}
