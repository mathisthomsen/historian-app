import Link from "next/link";
import { useTranslations } from "next-intl";

interface PublicFooterProps {
  locale: string;
}

export function PublicFooter({ locale }: PublicFooterProps) {
  const t = useTranslations("marketing.footer");

  return (
    <footer
      aria-label={t("label")}
      className="border-border text-muted-foreground border-t py-10 text-sm"
    >
      <div className="mx-auto flex max-w-[var(--content-max-width)] flex-wrap items-center gap-x-6 gap-y-3 px-4 sm:px-6">
        <span className="text-foreground font-semibold">Evidoxa</span>
        <Link href={`/${locale}/impressum`}>{t("imprint")}</Link>
        <Link href={`/${locale}/datenschutz`}>{t("privacy")}</Link>
        <Link href={`/${locale}/changelog`}>{t("changelog")}</Link>
        <a href="https://github.com/mathisthomsen/historian-app">{t("github")}</a>
      </div>
    </footer>
  );
}
