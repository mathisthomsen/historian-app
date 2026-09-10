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
      <PublicNav isSignedIn={!!session?.user} locale={locale} />
      <main className="flex-1">{children}</main>
      <PublicFooter locale={locale} />
    </div>
  );
}
