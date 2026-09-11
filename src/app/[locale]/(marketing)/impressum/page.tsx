import { getTranslations } from "next-intl/server";

export default async function ImpressumPage() {
  const t = await getTranslations("marketing.legal");

  return (
    <div className="mx-auto max-w-2xl px-4 py-[var(--section-gap-md)] sm:px-6">
      <h1 className="font-semibold tracking-[var(--tracking-display-sm)] text-[var(--text-display-sm)]">
        {t("imprintTitle")}
      </h1>
      <div className="text-muted-foreground mt-8 space-y-4">
        <p>{t("imprintBody")}</p>
      </div>
    </div>
  );
}
