"use client";

import type { Certainty } from "@prisma/client";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { CertaintySelector } from "@/components/research/CertaintySelector";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface EvidenceFormValues {
  source_id: string;
  source_title?: string;
  page_reference: string;
  quote: string;
  confidence: Certainty;
}

interface EvidenceFormProps {
  projectId: string;
  onSubmit: (values: EvidenceFormValues) => Promise<void>;
  onCancel: () => void;
}

interface SourceSearchResult {
  id: string;
  title: string;
}

export function EvidenceForm({ projectId, onSubmit, onCancel }: EvidenceFormProps) {
  const t = useTranslations("propertyEvidence");
  const tCommon = useTranslations("relations");

  const [sourceQuery, setSourceQuery] = useState("");
  const [sourceResults, setSourceResults] = useState<SourceSearchResult[]>([]);
  const [selectedSource, setSelectedSource] = useState<SourceSearchResult | null>(null);
  const [pageReference, setPageReference] = useState("");
  const [quote, setQuote] = useState("");
  const [confidence, setConfidence] = useState<Certainty>("UNKNOWN");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSourceSearch(q: string) {
    setSourceQuery(q);
    if (q.length < 1) {
      setSourceResults([]);
      return;
    }
    const res = await fetch(
      `/api/sources?search=${encodeURIComponent(q)}&projectId=${encodeURIComponent(projectId)}&pageSize=10`,
    );
    if (res.ok) {
      const data = (await res.json()) as { data?: SourceSearchResult[] } | SourceSearchResult[];
      const arr = Array.isArray(data)
        ? data
        : Array.isArray((data as { data?: SourceSearchResult[] }).data)
          ? (data as { data: SourceSearchResult[] }).data
          : [];
      setSourceResults(arr);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedSource) return;
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        source_id: selectedSource.id,
        source_title: selectedSource.title,
        page_reference: pageReference,
        quote,
        confidence,
      });
    } catch {
      setError("Fehler beim Speichern.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-3 rounded-md border p-3">
      {/* Source search */}
      <div className="space-y-1">
        <Label>{t("fields.source")}</Label>
        {selectedSource ? (
          <div className="flex items-center gap-2">
            <span className="text-sm">{selectedSource.title}</span>
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground text-xs underline"
              onClick={() => {
                setSelectedSource(null);
                setSourceQuery("");
                setSourceResults([]);
              }}
            >
              ändern
            </button>
          </div>
        ) : (
          <div className="relative">
            <Input
              value={sourceQuery}
              onChange={(e) => void handleSourceSearch(e.target.value)}
              placeholder="Quelle suchen…"
            />
            {sourceResults.length > 0 && (
              <div className="bg-background absolute z-10 mt-1 w-full rounded-md border shadow-lg">
                {sourceResults.map((src) => (
                  <button
                    key={src.id}
                    type="button"
                    className="hover:bg-accent w-full px-3 py-2 text-left text-sm"
                    onClick={() => {
                      setSelectedSource(src);
                      setSourceQuery(src.title);
                      setSourceResults([]);
                    }}
                  >
                    {src.title}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Page reference */}
      <div className="space-y-1">
        <Label>{t("fields.pageReference")}</Label>
        <Input
          value={pageReference}
          onChange={(e) => setPageReference(e.target.value)}
          placeholder="z. B. S. 42, fol. 3v"
        />
      </div>

      {/* Quote */}
      <div className="space-y-1">
        <Label>{t("fields.quote")}</Label>
        <Input
          value={quote}
          onChange={(e) => setQuote(e.target.value)}
          placeholder="Relevantes Zitat"
        />
      </div>

      {/* Confidence */}
      <CertaintySelector
        value={confidence}
        onChange={setConfidence}
        label={t("fields.confidence")}
      />

      {error && <p className="text-destructive text-sm">{error}</p>}

      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={submitting || !selectedSource}>
          {submitting && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
          {t("add")}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onCancel} disabled={submitting}>
          {tCommon("cancel")}
        </Button>
      </div>
    </form>
  );
}
