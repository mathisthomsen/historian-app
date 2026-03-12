import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { NewEventClient } from "@/components/research/NewEventClient";

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ parentId?: string }>;
}

export default async function NewEventPage({ params, searchParams }: PageProps) {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");

  const { locale } = await params;
  const { parentId } = await searchParams;
  const projectId = session.user.projectId;

  if (!projectId) {
    redirect(`/${locale}/dashboard`);
  }

  return <NewEventClient projectId={projectId} locale={locale} defaultParentId={parentId} />;
}
