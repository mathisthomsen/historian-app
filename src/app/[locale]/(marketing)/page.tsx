import { Hero } from "@/components/marketing/Hero";

export default async function LandingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <Hero locale={locale} />;
}
