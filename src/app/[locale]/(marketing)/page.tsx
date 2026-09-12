import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { CtaBand } from "@/components/marketing/CtaBand";
import { EditorialPassage } from "@/components/marketing/EditorialPassage";
import { EvidenceCitation } from "@/components/marketing/EvidenceCitation";
import { Hero } from "@/components/marketing/Hero";
import { HighlightStage, type StageStep } from "@/components/marketing/HighlightStage";
import { OpenDevelopment } from "@/components/marketing/OpenDevelopment";
import { RelationDiagram } from "@/components/marketing/RelationDiagram";
import { Reveal } from "@/components/marketing/Reveal";
import { CertaintyScale, PartialDateSpecimen } from "@/components/marketing/Specimens";
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
  const tCommon = await getTranslations("common");

  // One source for the node labels: they are rendered inside the SVG *and*
  // interpolated into its accessible description, and a description that names
  // different nodes than the picture draws is worse than none.
  const relationLabels = {
    person: t("relations.nodes.person"),
    event: t("relations.nodes.event"),
    place: t("relations.nodes.place"),
    source: t("relations.nodes.source"),
    relation: t("relations.nodes.relation"),
  };

  // Declared here rather than inline in the JSX so the stage receives one
  // ordered array: its step navigation, its scroll sentinels and its panels all
  // have to agree on the same order and the same ids, and a single source makes
  // that structural rather than something to keep in sync by hand.
  const steps: StageStep[] = [
    {
      id: "certainty",
      kicker: t("certainty.kicker"),
      title: t("certainty.title"),
      body: t("certainty.body"),
      specimen: <CertaintyScale />,
    },
    {
      id: "dates",
      kicker: t("dates.kicker"),
      title: t("dates.title"),
      body: t("dates.body"),
      specimen: <PartialDateSpecimen />,
    },
    {
      id: "evidence",
      kicker: t("evidence.kicker"),
      title: t("evidence.title"),
      body: t("evidence.body"),
      specimen: (
        <EvidenceCitation
          propertyLabel={t("evidence.propertyLabel")}
          property={t("evidence.property")}
          sourceLabel={t("evidence.sourceLabel")}
          page={t("evidence.page")}
          quoteLabel={t("evidence.quoteLabel")}
          quote={t("evidence.quote")}
          transcriptionLabel={t("evidence.transcriptionLabel")}
          transcription={t("evidence.transcription")}
        />
      ),
    },
    {
      id: "relations",
      kicker: t("relations.kicker"),
      title: t("relations.title"),
      body: t("relations.body"),
      specimen: (
        <RelationDiagram
          labels={relationLabels}
          description={t("relations.diagramDescription", {
            ...relationLabels,
            certain: tCommon("certainty.CERTAIN"),
            probable: tCommon("certainty.PROBABLE"),
            possible: tCommon("certainty.POSSIBLE"),
            unknown: tCommon("certainty.UNKNOWN"),
          })}
        />
      ),
    },
  ];

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
          <HighlightStage steps={steps} />
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
