interface RelationDiagramProps {
  labels: {
    person: string;
    event: string;
    place: string;
    source: string;
    relation: string;
  };
}

const NODES = [
  { key: "person", cx: 70, cy: 110, token: "certain" },
  { key: "event", cx: 200, cy: 45, token: "probable" },
  { key: "place", cx: 200, cy: 175, token: "possible" },
  { key: "source", cx: 330, cy: 110, token: "unknown" },
] as const;

const NODE_RADIUS = 34;

/**
 * Four entity nodes and the edges between them. Colours come from the certainty
 * token family so the diagram reads as part of the same visual language, and
 * every stroke resolves through a CSS variable so both themes work with no
 * second copy of the SVG.
 *
 * Sized for the specimen column rather than a card footer: the earlier 400×130
 * viewBox with 17px nodes and 9px labels was legible only because it was small,
 * and it had no room for the edge label that carries the panel's actual claim —
 * that a relation is a named, first-class thing.
 */
export function RelationDiagram({ labels }: RelationDiagramProps) {
  const description = `${labels.person} → ${labels.event} → ${labels.source}`;

  return (
    <svg
      role="img"
      aria-label={description}
      viewBox="0 0 400 220"
      className="h-auto w-full max-w-[26rem]"
    >
      <g stroke="var(--color-border)" strokeWidth="1.25" fill="none">
        <path d="M104 110 L166 55" />
        <path d="M104 110 L166 165" />
        <path d="M234 55 L296 110" />
        <path d="M234 165 L296 110" />
        <path d="M200 79 L200 141" strokeDasharray="4 4" />
      </g>

      <text
        x="120"
        y="66"
        fontSize="11"
        fill="var(--color-muted-foreground)"
        textAnchor="middle"
        fontStyle="italic"
      >
        {labels.relation}
      </text>

      <g fontSize="12" fill="var(--color-muted-foreground)" textAnchor="middle">
        {NODES.map((node) => (
          <g key={node.key}>
            <circle
              cx={node.cx}
              cy={node.cy}
              r={NODE_RADIUS}
              fill="var(--color-card)"
              stroke={`var(--color-certainty-${node.token}-border)`}
              strokeWidth="1.75"
            />
            <text x={node.cx} y={node.cy + 4}>
              {labels[node.key]}
            </text>
          </g>
        ))}
      </g>
    </svg>
  );
}
