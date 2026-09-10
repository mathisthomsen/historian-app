import { getTranslations } from "next-intl/server";

import { EvidenceCitation } from "@/components/marketing/EvidenceCitation";
import { Hero } from "@/components/marketing/Hero";
import { HighlightPanel } from "@/components/marketing/HighlightPanel";
import { HighlightRail } from "@/components/marketing/HighlightRail";
import { RelationDiagram } from "@/components/marketing/RelationDiagram";
import { CertaintyMarker } from "@/components/research/CertaintyMarker";
import { Badge } from "@/components/ui/badge";

export default async function LandingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations("marketing.panels");

  return (
    <>
      <Hero locale={locale} />

      <div className="mt-[var(--section-gap-lg)]">
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
      </div>
    </>
  );
}
