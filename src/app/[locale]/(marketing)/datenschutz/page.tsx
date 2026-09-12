import { getTranslations } from "next-intl/server";

export default async function DatenschutzPage() {
  const t = await getTranslations("marketing.legal");

  return (
    <div className="mx-auto max-w-2xl px-4 py-[var(--section-gap-md)] sm:px-6">
      <h1 className="text-[length:var(--text-display-sm)] font-semibold tracking-[var(--tracking-display-sm)]">
        {t("privacyTitle")}
      </h1>
      <div className="text-muted-foreground mt-8 space-y-4">
        <p>{t("privacyBody")}</p>
      </div>
    </div>
  );
}
