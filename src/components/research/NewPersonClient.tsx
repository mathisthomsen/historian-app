"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { PersonForm } from "@/components/research/PersonForm";
import type { PersonDetail } from "@/types/person";

interface NewPersonClientProps {
  projectId: string;
  locale: string;
}

export function NewPersonClient({ projectId, locale }: NewPersonClientProps) {
  const router = useRouter();

  function handleSuccess(person: PersonDetail) {
    toast.success("Person gespeichert.");
    router.push(`/${locale}/persons/${person.id}`);
  }

  function handleCancel() {
    router.push(`/${locale}/persons`);
  }

  return (
    <PersonForm
      mode="create"
      projectId={projectId}
      onSuccess={handleSuccess}
      onCancel={handleCancel}
    />
  );
}
