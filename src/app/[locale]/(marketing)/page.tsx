import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { CtaBand } from "@/components/marketing/CtaBand";
import { EditorialPassage } from "@/components/marketing/EditorialPassage";
import { EvidenceCitation } from "@/components/marketing/EvidenceCitation";
import { Hero } from "@/components/marketing/Hero";
import { HighlightPanel } from "@/components/marketing/HighlightPanel";
import { HighlightRail } from "@/components/marketing/HighlightRail";
import { OpenDevelopment } from "@/components/marketing/OpenDevelopment";
import { RelationDiagram } from "@/components/marketing/RelationDiagram";
import { Reveal } from "@/components/marketing/Reveal";
import { CertaintyMarker } from "@/components/research/CertaintyMarker";
import { Badge } from "@/components/ui/badge";
import { env } from "@/lib/env";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "marketing.hero" });
  // Marketing and the authenticated app are served from the same Next
  // deployment, so the app origin is the site origin. If they are ever split
  // into separate deployments, this needs its own validated env var.
  const base = env.NEXT_PUBLIC_APP_URL;

  return {
    title: `Evidoxa — ${t("headline")}`,
    description: t("sub"),
    alternates: {
      canonical: `${base}/${locale}`,
      languages: { de: `${base}/de`, en: `${base}/en` },
    },
    openGraph: {
      title: `Evidoxa — ${t("headline")}`,
      description: t("sub"),
      url: `${base}/${locale}`,
      type: "website",
    },
  };
}

export default async function LandingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations("marketing.panels");

  return (
    <>
      <Hero locale={locale} />

      <div className="mt-[var(--section-gap-lg)]">
        <Reveal>
          <EditorialPassage />
        </Reveal>
      </div>

      <div className="mt-[var(--section-gap-lg)]">
        <Reveal>
          <HighlightRail>
            <HighlightPanel
              kicker={t("certainty.kicker")}
              title={t("certainty.title")}
              body={t("certainty.body")}
            >
              <div className="flex flex-wrap gap-2">
                <Badge variant="certain">{t("certainty.kicker")}</Badge>
                <CertaintyMarker certainty="PROBABLE" />
                <CertaintyMarker certainty="POSSIBLE" />
                <CertaintyMarker certainty="UNKNOWN" />
              </div>
            </HighlightPanel>

            <HighlightPanel
              kicker={t("dates.kicker")}
              title={t("dates.title")}
              body={t("dates.body")}
            >
              <p className="flex items-center gap-2 font-mono text-sm">
                1740 <CertaintyMarker certainty="POSSIBLE" />
              </p>
            </HighlightPanel>

            <HighlightPanel
              kicker={t("evidence.kicker")}
              title={t("evidence.title")}
              body={t("evidence.body")}
            >
              <EvidenceCitation count={3} sourceLabel="Nürnberger Polizeiakte, 1828" />
            </HighlightPanel>

            <HighlightPanel
              kicker={t("relations.kicker")}
              title={t("relations.title")}
              body={t("relations.body")}
            >
              <RelationDiagram
                labels={{
                  person: t("relations.nodes.person"),
                  event: t("relations.nodes.event"),
                  place: t("relations.nodes.place"),
                  source: t("relations.nodes.source"),
                  relation: t("relations.nodes.relation"),
                }}
              />
            </HighlightPanel>
          </HighlightRail>
        </Reveal>
      </div>

      <div className="mt-[var(--section-gap-lg)]">
        <Reveal>
          <OpenDevelopment locale={locale} />
        </Reveal>
      </div>

      <div className="my-[var(--section-gap-lg)]">
        <Reveal>
          <CtaBand locale={locale} />
        </Reveal>
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: "Evidoxa",
            applicationCategory: "ResearchApplication",
            operatingSystem: "Web",
            inLanguage: ["de", "en"],
          }),
        }}
      />
    </>
  );
}
