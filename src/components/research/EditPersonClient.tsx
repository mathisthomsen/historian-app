"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { PersonForm } from "@/components/research/PersonForm";
import type { PersonDetail } from "@/types/person";

interface EditPersonClientProps {
  person: PersonDetail;
  projectId: string;
  locale: string;
}

export function EditPersonClient({ person, projectId, locale }: EditPersonClientProps) {
  const router = useRouter();

  function handleSuccess(updated: PersonDetail) {
    toast.success("Person gespeichert.");
    router.push(`/${locale}/persons/${updated.id}`);
  }

  function handleCancel() {
    router.push(`/${locale}/persons/${person.id}`);
  }

  return (
    <PersonForm
      mode="edit"
      initial={person}
      projectId={projectId}
      onSuccess={handleSuccess}
      onCancel={handleCancel}
    />
  );
}
