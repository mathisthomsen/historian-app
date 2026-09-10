import { useTranslations } from "next-intl";

export function EditorialPassage() {
  const t = useTranslations("marketing.editorial");

  return (
    <section className="px-4 sm:px-6">
      <p className="mx-auto max-w-[34ch] leading-snug font-medium tracking-[var(--tracking-display-sm)] text-balance text-[var(--text-display-sm)]">
        {t("body")}
      </p>
    </section>
  );
}
