# Evidoxa Rebuild — Strategic Decisions (locked)

All decisions here are locked. This table is the merge of the two decision tables
that used to live in `docs/specs/roadmap.md` and `docs/specs/ai_aided_roadmap.md`
(the "Strategic Decisions (locked)" and "AX-Ergänzungen zu den Strategic Decisions"
tables respectively). Both source documents were deleted once their content moved
into `docs/strategy/roadmap.md`; the **Source** column below is a historical
citation only — it names the document a decision originally came from, not a live
link, since those files no longer exist in the working tree (see git history for
their content prior to deletion).

| #   | Decision                  | Choice                                                                                          | Source                                     |
| --- | ------------------------- | ----------------------------------------------------------------------------------------------- | ------------------------------------------ |
| 1   | UI framework              | shadcn/ui + Tailwind CSS (replacing MUI entirely)                                               | `docs/specs/roadmap.md` (deleted)          |
| 2   | Auth                      | Auth.js v5 (replacing NextAuth v4)                                                              | `docs/specs/roadmap.md` (deleted)          |
| 3   | Relation model            | Universal graph — any entity to any entity, user-defined relation types                         | `docs/specs/roadmap.md` (deleted)          |
| 4   | Life events               | Events are events; birth/death stay as Person attributes for display but are first-class events | `docs/specs/roadmap.md` (deleted)          |
| 5   | Source vs. Literature     | Explicit split: Source = primary source evidence; Literature = secondary scholarly reference    | `docs/specs/roadmap.md` (deleted)          |
| 6   | Uncertainty UX            | Categorical: `certain / probable / possible / unknown` (replacing Decimal confidence scores)    | `docs/specs/roadmap.md` (deleted)          |
| 7   | Caching & rate limiting   | Upstash Redis (Vercel KV) — no in-memory state                                                  | `docs/specs/roadmap.md` (deleted)          |
| 8   | i18n                      | next-intl from day one; German first, English second                                            | `docs/specs/roadmap.md` (deleted)          |
| 9   | Build command             | `prisma migrate deploy && next build` (replacing `prisma db push`)                              | `docs/specs/roadmap.md` (deleted)          |
| 10  | Test coverage target      | 80%                                                                                             | `docs/specs/roadmap.md` (deleted)          |
| 11  | Real-time collab          | Architecture must not preclude it; defer WebSocket implementation to v2                         | `docs/specs/roadmap.md` (deleted)          |
| 12  | Export                    | First-class feature, designed in from Phase 1 API contracts                                     | `docs/specs/roadmap.md` (deleted)          |
| 13  | Agent write authority     | NONE — agents submit AgentSuggestion records only; never direct entity writes                   | `docs/specs/ai_aided_roadmap.md` (deleted) |
| 14  | Grounding policy          | MANDATORY — every AgentSuggestion must reference ≥1 existing Source.id                          | `docs/specs/ai_aided_roadmap.md` (deleted) |
| 15  | Confidence representation | Dual-track: categorical enum for historians (UI); Float 0–1 for agents (internal API)           | `docs/specs/ai_aided_roadmap.md` (deleted) |
| 16  | Approval gate             | All agent suggestions require explicit ACCEPT by a project EDITOR or OWNER                      | `docs/specs/ai_aided_roadmap.md` (deleted) |
| 17  | Agent attribution         | Separate `created_via` enum (MANUAL \| IMPORT \| AGENT) + `agent_name` on all entities          | `docs/specs/ai_aided_roadmap.md` (deleted) |
| 18  | Hallucination suppression | Technical: grounding check, confidence cap (≤0.95), reasoning non-null, immutable audit         | `docs/specs/ai_aided_roadmap.md` (deleted) |

Rows 1–12 are the original "Strategic Decisions (locked)" table; rows 13–18 are the
AX/agentic-layer additions ("AX-Ergänzungen zu den Strategic Decisions"). Both sets
were locked prior to this consolidation — the merge here does not change their
status, only where they live.

See [`docs/strategy/roadmap.md`](./roadmap.md) for the phase-by-phase plan these
decisions apply to.
