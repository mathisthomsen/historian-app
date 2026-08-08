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
    <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div className="space-y-1">
        <dt className="text-muted-foreground text-xs font-medium">{t("field_title")}</dt>
        <dd className="flex items-center gap-2 text-sm">
          <span>{source.title}</span>
          <PropertyEvidenceBadge
            projectId={projectId}
            entityType="SOURCE"
            entityId={source.id}
            property="title"
            fieldLabel={t("field_title")}
          />
        </dd>
      </div>

      <div className="space-y-1">
        <dt className="text-muted-foreground text-xs font-medium">{t("field_type")}</dt>
        <dd>
          <span className="bg-muted inline-block rounded px-2 py-0.5 text-xs">{source.type}</span>
        </dd>
      </div>

      <div className="space-y-1">
        <dt className="text-muted-foreground text-xs font-medium">{t("field_author")}</dt>
        <dd className="flex items-center gap-2 text-sm">
          <span>{source.author ?? "—"}</span>
          <PropertyEvidenceBadge
            projectId={projectId}
            entityType="SOURCE"
            entityId={source.id}
            property="author"
            fieldLabel={t("field_author")}
          />
        </dd>
      </div>

      <div className="space-y-1">
        <dt className="text-muted-foreground text-xs font-medium">{t("field_reliability")}</dt>
        <dd>
          <ReliabilityBadge reliability={source.reliability} />
        </dd>
      </div>

      <div className="space-y-1">
        <dt className="text-muted-foreground text-xs font-medium">{t("field_date")}</dt>
        <dd className="flex items-center gap-2 text-sm">
          <span>{source.date ?? "—"}</span>
          <PropertyEvidenceBadge
            projectId={projectId}
            entityType="SOURCE"
            entityId={source.id}
            property="date"
            fieldLabel={t("field_date")}
          />
        </dd>
      </div>

      <div className="space-y-1">
        <dt className="text-muted-foreground text-xs font-medium">{t("field_repository")}</dt>
        <dd className="flex items-center gap-2 text-sm">
          <span>{source.repository ?? "—"}</span>
          <PropertyEvidenceBadge
            projectId={projectId}
            entityType="SOURCE"
            entityId={source.id}
            property="repository"
            fieldLabel={t("field_repository")}
          />
        </dd>
      </div>

      <div className="space-y-1">
        <dt className="text-muted-foreground text-xs font-medium">{t("field_call_number")}</dt>
        <dd className="flex items-center gap-2 text-sm">
          <span>{source.call_number ?? "—"}</span>
          <PropertyEvidenceBadge
            projectId={projectId}
            entityType="SOURCE"
            entityId={source.id}
            property="call_number"
            fieldLabel={t("field_call_number")}
          />
        </dd>
      </div>

      <div className="space-y-1">
        <dt className="text-muted-foreground text-xs font-medium">{t("field_url")}</dt>
        <dd className="flex items-center gap-2 text-sm">
          {source.url ? (
            <a
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground underline"
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
        </dd>
      </div>

      {source.notes && (
        <div className="space-y-1 sm:col-span-2">
          <dt className="text-muted-foreground text-xs font-medium">{t("field_notes")}</dt>
          <dd className="flex items-start gap-2 text-sm">
            <span className="whitespace-pre-wrap">{source.notes}</span>
            <PropertyEvidenceBadge
              projectId={projectId}
              entityType="SOURCE"
              entityId={source.id}
              property="notes"
              fieldLabel={t("field_notes")}
            />
          </dd>
        </div>
      )}

      <div className="space-y-1">
        <dt className="text-muted-foreground text-xs font-medium">{t("created_at")}</dt>
        <dd className="text-sm">{new Date(source.created_at).toLocaleDateString(locale)}</dd>
      </div>

      <div className="space-y-1">
        <dt className="text-muted-foreground text-xs font-medium">{t("updated_at")}</dt>
        <dd className="text-sm">{new Date(source.updated_at).toLocaleDateString(locale)}</dd>
      </div>
    </dl>
  );
}
