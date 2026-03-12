"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

import { EventForm } from "@/components/research/EventForm";
import type { EventDetail } from "@/types/event";

interface EditEventClientProps {
  event: EventDetail;
  projectId: string;
  locale: string;
}

export function EditEventClient({ event, projectId, locale }: EditEventClientProps) {
  const t = useTranslations("events");
  const router = useRouter();

  function handleSuccess(updated: EventDetail) {
    router.push(`/${locale}/events/${updated.id}`);
  }

  return (
    <div className="mx-auto max-w-2xl p-6">
      <h1 className="mb-6 text-2xl font-bold">{t("edit_title")}</h1>
      <EventForm mode="edit" initial={event} projectId={projectId} onSuccess={handleSuccess} />
    </div>
  );
}
