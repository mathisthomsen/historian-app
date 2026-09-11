import { getTranslations } from "next-intl/server";

import { listReleases } from "@/lib/changelog";

export default async function ChangelogPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations("marketing.changelogPage");
  const releases = await listReleases(locale);

  return (
    <div className="mx-auto max-w-3xl px-4 py-[var(--section-gap-md)] sm:px-6">
      <h1 className="font-semibold tracking-[var(--tracking-display-sm)] text-[var(--text-display-sm)]">
        {t("title")}
      </h1>

      <section className="mt-12">
        <h2 className="text-muted-foreground text-xs tracking-[0.14em] uppercase">
          {t("comingNext")}
        </h2>
        <ul className="text-muted-foreground mt-4 space-y-3">
          <li>{t("theme1")}</li>
          <li>{t("theme2")}</li>
          <li>{t("theme3")}</li>
        </ul>
      </section>

      <div className="mt-16 space-y-12">
        {releases.map((release) => (
          <article key={release.version}>
            <p className="text-muted-foreground font-mono text-sm">
              {release.version} · {release.date}
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">{release.title}</h2>
            <div className="text-muted-foreground mt-4 space-y-4">{release.body}</div>
          </article>
        ))}
      </div>
    </div>
  );
}
