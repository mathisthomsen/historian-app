import { auth } from "@/auth";
import { PublicFooter } from "@/components/marketing/PublicFooter";
import { PublicNav } from "@/components/marketing/PublicNav";

export default async function MarketingLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await auth();

  return (
    <div className="flex min-h-dvh flex-col">
      {/* Blocking, first-in-tree: proves JS is running before any .reveal
          element below can be painted. See globals.css .js .reveal — without
          this class, .reveal content stays fully visible (F1).

          Watchdog: the .js class only proves the inline script ran, not that
          the React bundle ever arrived. If chunk loading fails after this
          script runs, every .reveal would stay opacity: 0 forever with
          nothing left to un-hide it. window.__revealWatchdog removes the
          class again after a grace period unless Reveal's mount effect
          cancels it first (see Reveal.tsx), so a failed bundle degrades to
          the same fully-visible behaviour as no-JS. */}
      <script
        dangerouslySetInnerHTML={{
          __html: `document.documentElement.classList.add('js');window.__revealWatchdog=setTimeout(function(){document.documentElement.classList.remove('js')},4000);`,
        }}
      />
      <PublicNav isSignedIn={!!session?.user} locale={locale} />
      <main className="flex-1">{children}</main>
      <PublicFooter locale={locale} />
    </div>
  );
}
