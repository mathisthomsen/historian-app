interface RelationDiagramProps {
  labels: {
    person: string;
    event: string;
    place: string;
    source: string;
    relation: string;
  };
}

/**
 * Four entity nodes and the edges between them. Colours come from the certainty
 * token family so the diagram reads as part of the same visual language, and
 * every stroke resolves through a CSS variable so both themes work with no
 * second copy of the SVG.
 */
export function RelationDiagram({ labels }: RelationDiagramProps) {
  const description = `${labels.person} → ${labels.event} → ${labels.source}`;

  return (
    <svg role="img" aria-label={description} viewBox="0 0 400 130" className="h-auto w-full">
      <g stroke="var(--color-border)" strokeWidth="1" fill="none">
        <path d="M110 65 L200 38" />
        <path d="M110 65 L200 94" />
        <path d="M200 38 L292 65" />
        <path d="M200 94 L292 65" />
        <path d="M200 38 L200 94" strokeDasharray="3 3" />
      </g>
      <g fontSize="9" fill="var(--color-muted-foreground)" textAnchor="middle">
        <circle
          cx="110"
          cy="65"
          r="17"
          fill="var(--color-card)"
          stroke="var(--color-certainty-certain-border)"
          strokeWidth="1.5"
        />
        <text x="110" y="68">
          {labels.person}
        </text>
        <circle
          cx="200"
          cy="38"
          r="17"
          fill="var(--color-card)"
          stroke="var(--color-certainty-probable-border)"
          strokeWidth="1.5"
        />
        <text x="200" y="41">
          {labels.event}
        </text>
        <circle
          cx="200"
          cy="94"
          r="17"
          fill="var(--color-card)"
          stroke="var(--color-certainty-possible-border)"
          strokeWidth="1.5"
        />
        <text x="200" y="97">
          {labels.place}
        </text>
        <circle
          cx="292"
          cy="65"
          r="17"
          fill="var(--color-card)"
          stroke="var(--color-certainty-unknown-border)"
          strokeWidth="1.5"
        />
        <text x="292" y="68">
          {labels.source}
        </text>
        <text x="152" y="42" fontSize="8">
          {labels.relation}
        </text>
      </g>
    </svg>
  );
}
