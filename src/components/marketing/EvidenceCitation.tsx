import { FileText } from "lucide-react";

interface EvidenceCitationProps {
  count: number;
  sourceLabel: string;
}

/**
 * Static citation chip for the marketing surface.
 *
 * Deliberately NOT PropertyEvidenceBadge: that component fetches an evidence
 * count from an authenticated endpoint and owns popover state, so on a public
 * page it would fire an authenticated request from a logged-out visitor.
 */
export function EvidenceCitation({ count, sourceLabel }: EvidenceCitationProps) {
  return (
    <p className="text-muted-foreground flex flex-wrap items-center gap-2 text-xs">
      <FileText aria-hidden="true" className="h-3.5 w-3.5" />
      <span className="text-foreground font-medium">{count}</span>
      <span>·</span>
      <span>{sourceLabel}</span>
    </p>
  );
}
