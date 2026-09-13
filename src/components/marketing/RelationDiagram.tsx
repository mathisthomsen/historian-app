import type { Certainty } from "@prisma/client";

interface RelationDiagramProps {
  labels: {
    person: string;
    event: string;
    place: string;
    source: string;
    relation: string;
  };
  /**
   * The full accessible description. It must name every node and every edge the
   * diagram draws, with each edge's certainty — see the note on `role="img"`.
   */
  description: string;
}

const NODES = [
  { key: "person", cx: 70, cy: 110 },
  { key: "event", cx: 200, cy: 45 },
  { key: "place", cx: 200, cy: 175 },
  { key: "source", cx: 330, cy: 110 },
] as const;

const NODE_RADIUS = 34;

/**
 * How a certainty level is drawn on an edge.
 *
 * `CertaintyMarker` encodes the four levels as filled / thick ring / thin ring /
 * dashed ring, deliberately differing by shape so they survive desaturation
 * (WCAG 1.4.1). A line cannot be a ring, so this is the same idea in the medium
 * available: weight and dash pattern carry the level, colour only reinforces it.
 * The ordering is preserved — decreasing ink from CERTAIN to UNKNOWN.
 */
const EDGE_STYLE: Record<Certainty, { width: number; dash?: string }> = {
  CERTAIN: { width: 3 },
  PROBABLE: { width: 1.75 },
  POSSIBLE: { width: 1.75, dash: "7 4" },
  UNKNOWN: { width: 1.75, dash: "1.5 4" },
};

const TOKEN: Record<Certainty, string> = {
  CERTAIN: "var(--color-certainty-certain)",
  PROBABLE: "var(--color-certainty-probable)",
  POSSIBLE: "var(--color-certainty-possible)",
  UNKNOWN: "var(--color-certainty-unknown)",
};

/**
 * Every edge is drawn as a relation carrying its own certainty. That is not
 * decoration — it is the panel's claim, and the model's: `Relation.certainty`
 * is `Certainty @default(UNKNOWN)`, so there is no relation without a level. An
 * unannotated edge would depict a relation exempt from the question, which the
 * schema does not allow and the copy explicitly denies.
 */
const EDGES = [
  { d: "M104 110 L166 55", certainty: "PROBABLE", labelled: true },
  { d: "M104 110 L166 165", certainty: "POSSIBLE", labelled: false },
  { d: "M234 55 L296 110", certainty: "CERTAIN", labelled: false },
  { d: "M234 165 L296 110", certainty: "UNKNOWN", labelled: false },
] as const satisfies ReadonlyArray<{ d: string; certainty: Certainty; labelled: boolean }>;

/**
 * Four entity nodes and the relations between them, each annotated the way a
 * real relation is: with a certainty of its own, and — for one of them — a type
 * the user named.
 *
 * ## Certainty belongs to the edges, never the nodes
 *
 * An earlier version stroked each *node* from the `--color-certainty-*` family:
 * Person certain, Event probable, Place possible, Source unknown. On a page
 * whose first panel has just taught that palette, that invents certainty at the
 * wrong scope — a node is an entity *type*, not an assertion, and nothing about
 * "Person" is better evidenced than "Source". `RelationType` endpoints are
 * constrained (`valid_from_types`/`valid_to_types`), but none of that is a
 * credence.
 *
 * A first fix moved certainty onto a single edge, which then understated the
 * claim in the other direction: the copy says *every* relation carries one, and
 * the picture showed one of five. Hence all four edges, at four levels.
 *
 * ## The dashes mean a level, not a kind of line
 *
 * The version before this drew one edge with `strokeDasharray` to mean
 * "secondary connection". Dash is already this design system's shape for
 * UNKNOWN (`CertaintyMarker`'s `dashed-ring`), so that quietly said something
 * false about that edge. Dash patterns here only ever encode certainty.
 *
 * `src/test/certainty-vocabulary.test.ts` keeps this file on a short allowlist
 * of places permitted to use the vocabulary at all.
 */
export function RelationDiagram({ labels, description }: RelationDiagramProps) {
  return (
    // role="img" + aria-label, not a bare graphic: the SVG's own text nodes are
    // not an equivalent alternative, because the edges — which carry the whole
    // argument — have almost no text. The label must therefore represent every
    // node and every edge. An earlier version named three of four nodes and
    // reduced five edges to a single chain.
    <svg
      role="img"
      aria-label={description}
      viewBox="0 0 400 220"
      className="h-auto w-full max-w-[26rem]"
    >
      {EDGES.map((edge) => (
        <path
          key={edge.d}
          d={edge.d}
          fill="none"
          stroke={TOKEN[edge.certainty]}
          strokeWidth={EDGE_STYLE[edge.certainty].width}
          strokeDasharray={EDGE_STYLE[edge.certainty].dash}
          strokeLinecap="round"
        />
      ))}

      <g transform="translate(96 64)">
        {/* Thick ring = PROBABLE, matching CertaintyMarker's shape vocabulary,
            so the labelled edge names its level as well as drawing it. */}
        <circle
          r="5.75"
          fill="none"
          stroke={TOKEN.PROBABLE}
          strokeWidth="3.5"
          strokeDasharray="none"
        />
        <text x="12" y="4" fontSize="11" fill="var(--color-foreground)" fontStyle="italic">
          {labels.relation}
        </text>
      </g>

      <g fontSize="12" fill="var(--color-muted-foreground)" textAnchor="middle">
        {NODES.map((node) => (
          <g key={node.key}>
            <circle
              cx={node.cx}
              cy={node.cy}
              r={NODE_RADIUS}
              fill="var(--color-card)"
              stroke="var(--color-border)"
              strokeWidth="1.5"
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
