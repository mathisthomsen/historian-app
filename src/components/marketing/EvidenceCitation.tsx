import { FileText } from "lucide-react";

interface EvidenceCitationProps {
  /** The field this evidence supports — `PropertyEvidence.property`. */
  propertyLabel: string;
  property: string;
  sourceLabel: string;
  page: string;
  quoteLabel: string;
  quote: string;
  transcriptionLabel: string;
  transcription: string;
}

/**
 * A field's evidence, as the model actually stores it: the field it supports,
 * the source, the page reference, the normalized quotation, and the verbatim
 * transcription.
 *
 * `PropertyEvidence` keeps `quote` (normalized/interpreted excerpt) and
 * `raw_transcription` (verbatim diplomatic transcription) as two columns,
 * because for this product they are two different scholarly objects — one is
 * what the source says, the other is how it says it. An earlier version of this
 * specimen took a single `quote` and labelled it a diplomatic transcription,
 * which collapsed that distinction on the one panel whose copy promises all
 * three of page reference, quotation *and* transcription.
 *
 * The two values differ only in orthography, which is the entire point: the
 * transcription keeps the source's spelling in both locales, because
 * translating it is precisely what the panel says Evidoxa does not make you do.
 *
 * Deliberately NOT PropertyEvidenceBadge: that component fetches an evidence
 * count from an authenticated endpoint and owns popover state, so on a public
 * page it would fire an authenticated request from a logged-out visitor.
 */
export function EvidenceCitation({
  propertyLabel,
  property,
  sourceLabel,
  page,
  quoteLabel,
  quote,
  transcriptionLabel,
  transcription,
}: EvidenceCitationProps) {
  return (
    <figure className="w-full max-w-[24rem]">
      {/*
        The field the evidence hangs off, named.

        `PropertyEvidence.property` is the column that makes the panel's claim —
        "evidence attaches to the individual field" — true, and it was the one
        value the specimen omitted. Without it the citation is indistinguishable
        from a `RelationEvidence` row or a plain bibliography entry, and the
        sentence beside it has nothing in the picture to point at.
      */}
      <p className="text-muted-foreground text-[0.65rem] tracking-[0.14em] uppercase">
        {propertyLabel}
      </p>
      <p className="text-foreground mt-1.5 mb-5 font-medium">{property}</p>

      <div className="border-border border-l-2 pl-4">
        <p className="text-muted-foreground text-[0.65rem] tracking-[0.14em] uppercase">
          {quoteLabel}
        </p>
        <blockquote className="mt-1.5 text-sm leading-relaxed text-pretty">
          &bdquo;{quote}&ldquo;
        </blockquote>

        <p className="text-muted-foreground mt-5 text-[0.65rem] tracking-[0.14em] uppercase">
          {transcriptionLabel}
        </p>
        <blockquote className="mt-1.5 font-mono text-sm leading-relaxed text-pretty">
          &bdquo;{transcription}&ldquo;
        </blockquote>
      </div>

      <figcaption className="text-muted-foreground mt-5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
        <FileText aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
        <cite className="text-foreground font-medium not-italic">{sourceLabel}</cite>
        <span aria-hidden="true">·</span>
        <span className="font-mono">{page}</span>
      </figcaption>
    </figure>
  );
}
