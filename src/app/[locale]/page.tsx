import { redirect } from "next/navigation";

import { auth } from "@/auth";

// This page should never render: middleware's authorized() callback handles
// /[locale] root paths with a NextResponse.redirect before any streaming
// occurs. This remains as a safety-net fallback only.
export default async function LocalePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const session = await auth();
  if (session?.user) {
    redirect(`/${locale}/dashboard`);
  }
  redirect(`/${locale}/auth/login`);
}
