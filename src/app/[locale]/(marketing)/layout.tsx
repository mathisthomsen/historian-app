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
          this class, .reveal content stays fully visible (F1). */}
      <script
        dangerouslySetInnerHTML={{
          __html: `document.documentElement.classList.add('js')`,
        }}
      />
      <PublicNav isSignedIn={!!session?.user} locale={locale} />
      <main className="flex-1">{children}</main>
      <PublicFooter locale={locale} />
    </div>
  );
}
