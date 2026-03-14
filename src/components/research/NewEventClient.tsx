"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { EventForm } from "@/components/research/EventForm";
import type { EventDetail } from "@/types/event";

interface NewEventClientProps {
  projectId: string;
  locale: string;
  defaultParentId?: string | undefined;
}

export function NewEventClient({ projectId, locale, defaultParentId }: NewEventClientProps) {
  const t = useTranslations("events");
  const router = useRouter();

  function handleSuccess(event: EventDetail) {
    router.push(`/${locale}/events/${event.id}`);
  }

  return (
    <div className="mx-auto max-w-2xl p-6">
      <h1 className="mb-6 text-2xl font-bold">{t("create_title")}</h1>
      <EventForm
        mode="create"
        projectId={projectId}
        defaultParentId={defaultParentId}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
