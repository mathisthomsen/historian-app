"use client";

import { useTranslations } from "next-intl";

import { PropertyEvidenceBadge } from "@/components/relations/PropertyEvidenceBadge";
import { ReliabilityBadge } from "@/components/research/ReliabilityBadge";
import type { SourceDetail } from "@/types/source";

interface SourceDetailCardProps {
  source: SourceDetail;
  locale: string;
  projectId: string;
}

export function SourceDetailCard({ source, locale, projectId }: SourceDetailCardProps) {
  const t = useTranslations("sources");

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {/* Title */}
      <div className="space-y-1">
        <p className="text-xs font-medium text-muted-foreground">{t("field_title")}</p>
        <div className="flex items-center gap-2 text-sm">
          <span>{source.title}</span>
          <PropertyEvidenceBadge
            projectId={projectId}
            entityType="SOURCE"
            entityId={source.id}
            property="title"
            fieldLabel={t("field_title")}
          />
        </div>
      </div>

      {/* Type */}
      <div className="space-y-1">
        <p className="text-xs font-medium text-muted-foreground">{t("field_type")}</p>
        <span className="inline-block rounded bg-muted px-2 py-0.5 text-xs">{source.type}</span>
      </div>

      {/* Author */}
      <div className="space-y-1">
        <p className="text-xs font-medium text-muted-foreground">{t("field_author")}</p>
        <div className="flex items-center gap-2 text-sm">
          <span>{source.author ?? "—"}</span>
          <PropertyEvidenceBadge
            projectId={projectId}
            entityType="SOURCE"
            entityId={source.id}
            property="author"
            fieldLabel={t("field_author")}
          />
        </div>
      </div>

      {/* Reliability */}
      <div className="space-y-1">
        <p className="text-xs font-medium text-muted-foreground">{t("field_reliability")}</p>
        <ReliabilityBadge reliability={source.reliability} />
      </div>

      {/* Date */}
      <div className="space-y-1">
        <p className="text-xs font-medium text-muted-foreground">{t("field_date")}</p>
        <div className="flex items-center gap-2 text-sm">
          <span>{source.date ?? "—"}</span>
          <PropertyEvidenceBadge
            projectId={projectId}
            entityType="SOURCE"
            entityId={source.id}
            property="date"
            fieldLabel={t("field_date")}
          />
        </div>
      </div>

      {/* Repository */}
      <div className="space-y-1">
        <p className="text-xs font-medium text-muted-foreground">{t("field_repository")}</p>
        <div className="flex items-center gap-2 text-sm">
          <span>{source.repository ?? "—"}</span>
          <PropertyEvidenceBadge
            projectId={projectId}
            entityType="SOURCE"
            entityId={source.id}
            property="repository"
            fieldLabel={t("field_repository")}
          />
        </div>
      </div>

      {/* Call Number */}
      <div className="space-y-1">
        <p className="text-xs font-medium text-muted-foreground">{t("field_call_number")}</p>
        <div className="flex items-center gap-2 text-sm">
          <span>{source.call_number ?? "—"}</span>
          <PropertyEvidenceBadge
            projectId={projectId}
            entityType="SOURCE"
            entityId={source.id}
            property="call_number"
            fieldLabel={t("field_call_number")}
          />
        </div>
      </div>

      {/* URL */}
      <div className="space-y-1">
        <p className="text-xs font-medium text-muted-foreground">{t("field_url")}</p>
        <div className="flex items-center gap-2 text-sm">
          {source.url ? (
            <a
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-foreground"
            >
              {source.url}
            </a>
          ) : (
            <span>—</span>
          )}
          <PropertyEvidenceBadge
            projectId={projectId}
            entityType="SOURCE"
            entityId={source.id}
            property="url"
            fieldLabel={t("field_url")}
          />
        </div>
      </div>

      {/* Notes — full width */}
      {source.notes && (
        <div className="space-y-1 sm:col-span-2">
          <p className="text-xs font-medium text-muted-foreground">{t("field_notes")}</p>
          <div className="flex items-start gap-2 text-sm">
            <span className="whitespace-pre-wrap">{source.notes}</span>
            <PropertyEvidenceBadge
              projectId={projectId}
              entityType="SOURCE"
              entityId={source.id}
              property="notes"
              fieldLabel={t("field_notes")}
            />
          </div>
        </div>
      )}

      {/* Footer row */}
      <div className="space-y-1">
        <p className="text-xs font-medium text-muted-foreground">{t("created_at")}</p>
        <p className="text-sm">{new Date(source.created_at).toLocaleDateString(locale)}</p>
      </div>

      <div className="space-y-1">
        <p className="text-xs font-medium text-muted-foreground">{t("updated_at")}</p>
        <p className="text-sm">{new Date(source.updated_at).toLocaleDateString(locale)}</p>
      </div>
    </div>
  );
}
