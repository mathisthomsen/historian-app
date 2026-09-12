import { FileText } from "lucide-react";

interface EvidenceCitationProps {
  sourceLabel: string;
  page: string;
  quote: string;
}

/**
 * A field's evidence, as it is actually attached: the source, the page
 * reference, and the quotation in its own orthography.
 *
 * The rail's version was a single 12px line — icon, count, source label — sitting
 * in a card footer. It showed that a citation exists without showing what a
 * citation contains, which is what the panel claims is different. The quotation
 * is a diplomatic transcription and is therefore not translated in either
 * locale; that is the panel's argument, made rather than asserted.
 *
 * Deliberately NOT PropertyEvidenceBadge: that component fetches an evidence
 * count from an authenticated endpoint and owns popover state, so on a public
 * page it would fire an authenticated request from a logged-out visitor.
 *
 * The evidence count the rail showed is gone: at this scale a bare numeral
 * beside a citation reads as part of the reference rather than as a tally, and
 * the citation makes the panel's point without it.
 */
export function EvidenceCitation({ sourceLabel, page, quote }: EvidenceCitationProps) {
  return (
    <figure className="w-full max-w-[24rem]">
      <blockquote className="border-border border-l-2 pl-4 font-mono text-sm leading-relaxed text-pretty">
        &bdquo;{quote}&ldquo;
      </blockquote>
      <figcaption className="text-muted-foreground mt-5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
        <FileText aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
        <cite className="text-foreground font-medium not-italic">{sourceLabel}</cite>
        <span aria-hidden="true">·</span>
        <span className="font-mono">{page}</span>
      </figcaption>
    </figure>
  );
}
