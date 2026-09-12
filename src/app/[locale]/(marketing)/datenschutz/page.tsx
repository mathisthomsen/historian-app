import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { marketingRouteMetadata } from "@/lib/marketing-metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "marketing.legal" });

  return marketingRouteMetadata({
    locale,
    path: "datenschutz",
    title: t("privacyTitle"),
    description: t("privacyDescription"),
  });
}

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
