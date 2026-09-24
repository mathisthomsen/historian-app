import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { Badge } from "@/components/ui/badge";
import { marketingRouteMetadata } from "@/lib/marketing-metadata";
import { loadRoadmap, type EpicState } from "@/lib/roadmap";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "marketing.roadmapPage" });

  return marketingRouteMetadata({
    locale,
    path: "roadmap",
    title: t("title"),
    description: t("description"),
  });
}

// Text labels double as the accessible name for each state — colour is a
// reinforcing cue only, never the sole signal (WCAG 1.4.1). `variant` picks
// the badge's colour; the visible label always comes from the translated
// status key below, so a screen reader (or a viewer who can't distinguish
// the colours) still gets "Live" / "In Arbeit" / "Geplant" as text.
const STATE_VARIANT: Record<EpicState, "success" | "warning" | "secondary"> = {
  shipped: "success",
  in_progress: "warning",
  planned: "secondary",
};

export default async function RoadmapPage() {
  const t = await getTranslations("marketing.roadmapPage");
  const { phases, statusAvailable } = await loadRoadmap();

  return (
    <div className="mx-auto max-w-3xl px-4 py-[var(--section-gap-md)] sm:px-6">
      <h1 className="text-[length:var(--text-display-sm)] font-semibold tracking-[var(--tracking-display-sm)]">
        {t("title")}
      </h1>
      <p className="text-muted-foreground mt-4 max-w-prose">{t("intro")}</p>

      {!statusAvailable ? (
        <p className="border-border text-muted-foreground mt-8 rounded-md border border-dashed px-4 py-3 text-sm">
          {t("statusUnavailableNotice")}
        </p>
      ) : null}

      <div className="mt-12 space-y-12">
        {phases.map((phase) => (
          <section key={phase.name}>
            <h2 className="text-xl font-semibold tracking-tight">{phase.name}</h2>
            {/* Explicit role="list"/"listitem": Tailwind's preflight sets
                `list-style: none` on every <ul>/<ol>, and in WebKit that strips
                the implicit roles (issue #90 — see the same fix on
                /changelog, enforced there by
                src/test/marketing-list-roles.test.ts). */}
            <ul role="list" className="mt-4 space-y-3">
              {phase.epics.map((epic) => (
                <li
                  key={epic.id}
                  role="listitem"
                  className="border-border flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b py-3"
                >
                  <span>
                    <span className="text-muted-foreground font-mono text-sm">{epic.id}</span>{" "}
                    <span className="font-medium">{epic.title}</span>
                  </span>
                  {epic.status ? (
                    <Badge variant={STATE_VARIANT[epic.status.state]}>
                      {t(`status.${epic.status.state}`)}
                    </Badge>
                  ) : (
                    <Badge variant="outline">{t("statusUnavailable")}</Badge>
                  )}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <p className="text-muted-foreground mt-12 text-xs">{t("footnote")}</p>
    </div>
  );
}
