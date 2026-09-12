interface HighlightPanelProps {
  kicker: string;
  title: string;
  body: string;
  /** The picture of this panel's subject — a live fragment of the real UI. */
  specimen: React.ReactNode;
}

/**
 * One highlight, as an editorial spread: prose in one column, its specimen in
 * the other.
 *
 * The specimen used to sit in a `mt-auto pt-4` footer slot inside a bordered
 * card, which is the position a card uses for metadata — so the certainty
 * markers and the relation diagram read as chrome describing the card rather
 * than as a picture of what the card was about. Here the specimen is a sibling
 * of the prose and carries half the composition. The two columns are separate
 * slots (`panel-prose` / `specimen`) precisely so that relationship is
 * structural and can be asserted, not a matter of which utility classes
 * happen to be applied.
 */
export function HighlightPanel({ kicker, title, body, specimen }: HighlightPanelProps) {
  return (
    <div className="editorial-grid">
      <div data-slot="panel-prose">
        <p
          data-slot="panel-kicker"
          className="text-muted-foreground text-xs tracking-[0.14em] uppercase"
        >
          {kicker}
        </p>
        <h3 className="mt-4 max-w-[18ch] text-[length:var(--text-display-sm)] leading-tight font-semibold tracking-[var(--tracking-display-sm)] text-balance">
          {title}
        </h3>
        <p className="text-muted-foreground mt-5 max-w-[42ch] leading-relaxed">{body}</p>
      </div>

      <div data-slot="specimen" className="specimen">
        {specimen}
      </div>
    </div>
  );
}
