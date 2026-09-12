import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { listReleases } from "@/lib/changelog";
import { marketingRouteMetadata } from "@/lib/marketing-metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "marketing.changelogPage" });

  return marketingRouteMetadata({
    locale,
    path: "changelog",
    title: t("title"),
    description: t("description"),
  });
}

export default async function ChangelogPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations("marketing.changelogPage");
  const releases = await listReleases(locale);

  return (
    <div className="mx-auto max-w-3xl px-4 py-[var(--section-gap-md)] sm:px-6">
      <h1 className="text-[length:var(--text-display-sm)] font-semibold tracking-[var(--tracking-display-sm)]">
        {t("title")}
      </h1>

      <section className="mt-12">
        <h2 className="text-muted-foreground text-xs tracking-[0.14em] uppercase">
          {t("comingNext")}
        </h2>
        {/* Explicit role="list"/"listitem": Tailwind's preflight sets
            `list-style: none` on every <ul>/<ol>, and in WebKit that strips the
            implicit roles, leaving these three as unrelated lines of text
            (issue #90). Enforced by src/test/marketing-list-roles.test.ts. */}
        <ul role="list" className="text-muted-foreground mt-4 space-y-3">
          <li role="listitem">{t("theme1")}</li>
          <li role="listitem">{t("theme2")}</li>
          <li role="listitem">{t("theme3")}</li>
        </ul>
      </section>

      <div className="mt-16 space-y-12">
        {releases.map((release) => (
          <article key={release.version}>
            <p className="text-muted-foreground font-mono text-sm">
              {release.version} · {release.date}
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">{release.title}</h2>
            {/*
              Spec §8.3: a release missing the requested locale falls back to
              German *with a visible note*. Without it `/en/changelog` presents
              German prose as though it were English, which on this product is
              the exact failure it argues against — an unmarked claim about
              what a text says.

              `lang="de"` goes on the body only, never on the note: the note is
              written in the *requested* locale, and mislabelling it would make
              a screen reader read English prose in a German voice. On the body
              it is correct and useful — it switches voice for the passage that
              really is German (WCAG 3.1.2), which the visible note cannot do.
            */}
            {release.localeFallback ? (
              <p className="text-muted-foreground mt-3 text-xs">{t("localeFallback")}</p>
            ) : null}
            <div
              className="text-muted-foreground mt-4 space-y-4"
              lang={release.localeFallback ? "de" : undefined}
            >
              {release.body}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
