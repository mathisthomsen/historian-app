# Evidoxa

A research environment for historians: a workspace for recording people, events, and archival
sources, the relationships between them, and — critically — the evidence and degree of confidence
behind every claim.

The domain is deliberately complex; the UI's job is to keep that complexity away from the user.
Target: university MVP validation, then commercialization.

---

## Tech Stack

| Layer            | Choice                                    | Notes                                                                                                  |
| ---------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Framework        | Next.js 15 (App Router) + React 19        | Server Components by default, client leaves only where interactivity needs it                          |
| Language         | TypeScript 5.8, `strict`                  | Plus `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitOverride`                    |
| Package manager  | pnpm 9.15 (Node ≥ 22)                     | Always pnpm — never npm or yarn                                                                        |
| Styling          | Tailwind CSS v4                           | CSS-first. **No `tailwind.config.js`** — design tokens live in `src/styles/globals.css` under `@theme` |
| Components       | shadcn/ui on Radix primitives             | Local, editable source in `src/components/ui/`                                                         |
| Database         | PostgreSQL (Neon, serverless)             | Pooled + direct (unpooled) endpoints; migrations require the direct one                                |
| ORM              | Prisma 6                                  | `migrate dev` locally, `migrate deploy` in CI — never `db push`                                        |
| Auth             | Auth.js (next-auth) v5, Credentials + JWT | Split config: `auth.config.ts` is Edge-safe for middleware, `auth.ts` carries Prisma + bcrypt          |
| Cache / limiting | Upstash Redis (Vercel Marketplace)        | No in-memory state — the app scales horizontally                                                       |
| Validation       | Zod 3                                     | Shared schemas in `src/lib/schemas/` — one source of truth per entity                                  |
| Forms            | react-hook-form + `@hookform/resolvers`   |                                                                                                        |
| i18n             | next-intl 3                               | `de` (default) and `en`, always locale-prefixed; `localeDetection: false`                              |
| Email            | Resend                                    | Verification and password-reset flows                                                                  |
| Testing          | Vitest + Testing Library; Playwright      | Unit + E2E across Chromium and Firefox                                                                 |
| Hosting / CI     | Vercel; GitHub Actions                    | Lint → typecheck → unit → build → E2E → deploy                                                         |

### Getting started

```bash
pnpm install
cp .env.example .env.local        # then fill in the values (see src/lib/env.ts for what is required)
pnpm prisma migrate dev
pnpm prisma db seed
pnpm dev
```

| Command          | Purpose                |
| ---------------- | ---------------------- |
| `pnpm dev`       | Dev server (Turbopack) |
| `pnpm test`      | Unit tests             |
| `pnpm test:e2e`  | Playwright E2E         |
| `pnpm typecheck` | `tsc --noEmit`         |
| `pnpm lint`      | ESLint                 |

> Prisma CLI reads `.env`, not `.env.local`. Pass the vars explicitly when needed:
> `DATABASE_URL="…" DATABASE_URL_UNPOOLED="…" pnpm prisma migrate dev`

---

## Scientific Background — Why the Data Model Looks Like This

Most database schemas assume the world is knowable: a person has _a_ birth date, a fact is
either true or absent. Historical research does not work that way. The evidence is fragmentary,
contradictory, and always mediated by a source. A schema that cannot express _"probably March
1848, according to one parish register, though a letter suggests otherwise"_ forces the
researcher to either fabricate precision or discard information.

Every decision below follows from that single constraint.

### 1. Partial dates, stored as integer triples

Dates are **not** `DATE` columns. Each is a nullable `year` / `month` / `day` triple:

```prisma
birth_year           Int?
birth_month          Int?
birth_day            Int?
birth_date_certainty Certainty @default(UNKNOWN)
```

A `DATE` column cannot represent "1769" or "March 1848" without inventing the missing
components — and an invented `1769-01-01` is indistinguishable from a real one once written.
Separate fields let the record state exactly what the source states, no more.

The ordering rules (a month requires a year; a day requires a month) are enforced in the shared
Zod schema rather than the type system, since they are a semantic constraint, not a structural one.

### 2. Certainty is categorical and per-field

```prisma
enum Certainty { CERTAIN  PROBABLE  POSSIBLE  UNKNOWN }
```

Two deliberate choices:

- **Categorical, not numeric.** An earlier design used decimal confidence scores. Researchers
  cannot meaningfully distinguish 0.7 from 0.75, and a number implies a statistical basis that
  does not exist. Four named states map onto how historians actually qualify claims.
- **Per-field, not per-record.** A historian may be certain of a person's name and merely
  guessing at their birth year. Certainty attaches to the individual assertion — birth date,
  death date, a relation, a single piece of evidence — never to the row as a whole.

### 3. Evidence is a first-class entity, not a footnote

This is the core of the model. Two tables attach sources to claims:

- **`RelationEvidence`** — cites a source for a relationship.
- **`PropertyEvidence`** — cites a source for _one specific field_ on any entity.

Both carry `page_reference` (`"S. 47"`, `"fol. 12r"`, `"col. 3"`), a `quote`, and their own
`confidence`. `PropertyEvidence` additionally separates `raw_transcription` (verbatim, diplomatic)
from `quote` (normalized/interpreted) — the distinction between what the document literally says
and what the researcher reads it as saying.

The key design point: **evidence supplements the entity, it does not replace it.** The entity
holds the researcher's current best estimate; `PropertyEvidence` records what each source claims
about that property. When two sources disagree, both records persist and the UI can surface the
conflict rather than silently resolving it. Scholarly work is reproducible only if every claim
traces back to what supports it.

### 4. A universal relation graph, not a fixed vocabulary

Genealogy tools ship a closed set of relationships (parent, spouse, sibling). Historical research
needs "was patron of", "corresponded with", "was imprisoned at", "cites". So relations are
polymorphic and their taxonomy is **user-defined per project**:

```prisma
from_type  EntityType   // PERSON | EVENT | SOURCE | LOCATION | LITERATURE
from_id    String       // NOT a foreign key — see below
to_type    EntityType
to_id      String
```

`RelationType` declares which entity types are legal on each side (`valid_from_types`,
`valid_to_types`), so the vocabulary is extensible without schema migrations.

**The trade-off is explicit and documented in the schema:** because `from_id` may reference any
of five tables, no SQL foreign key can be declared. Referential integrity for polymorphic columns
is enforced at the application layer only. This is a real cost, accepted knowingly in exchange
for an open relationship vocabulary. Composite indexes on `(from_type, from_id)` and
`(to_type, to_id)` keep graph traversal efficient.

### 5. Relations are temporally bounded

A relationship is rarely timeless. "Married 1848–1867" is a different fact from "married":

```prisma
valid_from_year  Int?
valid_from_month Int?
valid_from_cert  Certainty
valid_to_year    Int?
valid_to_month   Int?
valid_to_cert    Certainty
```

The same partial-date-plus-certainty pattern as entity dates, applied to the edge itself. This
also means two otherwise-identical relations may legitimately coexist with different validity
periods.

### 6. Source and Literature are separate on purpose

- **`Source`** — primary evidence: an archival document, letter, newspaper, photograph. Carries
  `repository`, `call_number`, and a `SourceReliability` rating, because locating and appraising
  the artefact is part of the work.
- **`Literature`** — secondary scholarly references, with bibliographic fields.

Collapsing them into one "reference" table would erase the primary/secondary distinction that
historical method rests on. Only `Source` can serve as evidence.

### 7. Name variants

Historical figures appear under varying spellings, languages, Latinized forms, titles, and
married names. `PersonName` stores every variant with an optional ISO 639-1 `language` and an
`is_primary` display flag. A single `name` column would silently privilege one form and make the
others unsearchable.

### 8. Soft delete and an append-only activity log

Research is iterative and revisable, so `Person`, `Event`, `Source`, and `Relation` carry
`deleted_at` rather than being destroyed. `EntityActivity` is an append-only audit log of every
create/update/delete — deliberately **never** given a DELETE endpoint, so the provenance of the
research record itself is preserved.

`Location` and `Literature` are treated as reference data and currently have no soft delete
(see _Known limitations_).

### 9. Multi-tenancy from day one

Every user-data table carries `project_id`, and access runs through `UserProject` with
`OWNER` / `EDITOR` / `VIEWER` roles. Retrofitting tenancy is notoriously error-prone; it was
designed in from the first migration.

Because every write needs a project, one is provisioned on first sign-in and the user is made
its `OWNER` (`src/lib/project.ts`). The active project is then the user's first `OWNER`/`EDITOR`
membership, carried in the session — a stopgap until the project switcher replaces it, and the
reason there is no "no project" state to design around.

---

## Relationship to CIDOC CRM

[CIDOC CRM](https://www.cidoc-crm.org/) (ISO 21127) is the reference ontology for cultural
heritage information. Evidoxa is **deliberately CRM-informed but not CRM-compliant.** This was
an explicit, documented decision, not an oversight — four candidate architectures were evaluated
in [`docs/specs/1-2-database-schema-data-layer/architecture-evaluation.md`](docs/specs/1-2-database-schema-data-layer/architecture-evaluation.md),
including a claim-centric model noted there as "academically correct (aligns with CIDOC CRM,
ResearchSpace)" and a full bitemporal claim graph described as "the correct long-term target for
a Phase 5+ academic edition."

### Where the model already agrees with CRM

- **Evidence-first.** Every assertion can be traced to a source with a precise citation — the
  same commitment CRM encodes through `E13 Attribute Assignment`.
- **Events are first-class**, not attributes of a person.
- **Temporal validity is separate from record time** on relations.
- **Places and actors are distinct entity types** participating in a shared graph.
- **Confidence is explicit** rather than implied by presence or absence of data.

### Where it diverges

| CRM approach                                                  | Evidoxa                                                                                    |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Everything is an event; properties are reified assignments    | Entities hold properties directly as columns; evidence _supplements_ them                  |
| Formal class/property URIs (`E21 Person`, `P4 has time-span`) | Application-local table and column names                                                   |
| Global, resolvable URI identity for every resource            | Project-scoped CUIDs                                                                       |
| Bitemporal: transaction-time and valid-time both modelled     | Valid-time on relations only; no transaction-time dimension                                |
| Contradictory claims coexist as separate assignments          | One best-estimate value per field, with `PropertyEvidence` recording what each source says |

The last row is the substantive gap. In CRM, "Source A says 1848, Source B says 1851" is two
equally-weighted assignments with no privileged answer. In Evidoxa the entity carries the
researcher's current best estimate and `PropertyEvidence` records the competing testimony
alongside it. The information is preserved and conflicts can be surfaced — but the schema still
privileges one value.

### Why not go fully compliant

**Pros of the current position**

- A person is **one row**. Rendering a profile is a single query, not a 10–20 row aggregation
  with conditional grouping.
- **Prisma's type safety survives.** A claim table stores values as `String`, which discards the
  schema contract at exactly the layer that makes the TypeScript strictness worth having.
- **The UI stays tractable.** Full CRM semantics turn every input into a claim editor with a
  source picker. The project's stated goal is keeping domain complexity away from the user.
- Estimated **3–5× implementation cost** for Phase 1–2 under the claim-centric model.
- CRM is a _documentation and interchange_ ontology. It is designed for publishing and federating
  records, not as an operational transaction schema — most CRM systems keep a working model and
  map to CRM on export.

**Cons — what it genuinely costs**

- **No out-of-the-box interoperability.** Data cannot be federated with ResearchSpace, Wikidata,
  or museum aggregators without a mapping layer.
- **Conflicting testimony is second-class**, as described above.
- **No interpretation history.** Who changed a birth year and on what grounds is captured only by
  the activity log, not modelled as a scholarly revision.
- **Academic credibility risk.** For a university validation audience, CRM alignment is a
  recognised marker of methodological seriousness.
- The longer entity-centric assumptions spread through the API and UI, the more expensive the
  migration becomes.

### A realistic path to compliance

Compliance is best treated as **export-first, then internal** — the ordering matters, because a
mapping layer delivers most of the interoperability benefit at a fraction of the cost.

1. **JSON-LD export with CRM vocabulary** _(already on the roadmap as a Phase 5 export format)_.
   Map `Person → E21`, `Event → E5`, `Location → E53`, `Source → E31`, `RelationType → P` terms.
   No schema change; a serialization layer only. This alone buys most interoperability.
2. **Stable, resolvable identifiers.** Give every entity a persistent URI and record external
   authority IDs (GND, VIAF, Wikidata, Geonames). Cheap, additive, and independently valuable for
   deduplication.
3. **Promote `PropertyEvidence` to a full claim layer.** It already carries `entity_type`,
   `entity_id`, `property`, `source_id`, `confidence`, `quote`, and `raw_transcription` — it is
   deliberately one `value` column and a `superseded_by_id` away from Option B's `Claim` table.
   Entity columns then become a materialized "preferred reading" derived from claims rather than
   the source of truth.
4. **Add transaction-time** alongside valid-time to reach the bitemporal model, enabling "what did
   we believe in March, and why did that change?"
5. **Reify events fully** for the CRM-native shape, where participation itself is an event.

Steps 1–2 are low-cost and worth doing regardless. Step 3 is the real paradigm shift and should
be driven by evidence that researchers actually need multi-claim workflows — the evaluation
deliberately deferred it rather than imposing it on users from day one.

---

## Why PostgreSQL and not a graph database

The domain is a graph, so the question is fair. The model is a property graph in all but storage:
polymorphic edges, composite indexes on `(from_type, from_id)` and `(to_type, to_id)`, and a
user-defined edge taxonomy.

**Why relational won**

- **The workload is not actually graph-shaped.** The dominant queries are paginated, filtered,
  sorted entity lists — `WHERE project_id = ? AND deleted_at IS NULL ORDER BY last_name` — which
  is precisely what a relational planner with B-tree indexes is built for. Graph databases pay
  for traversal power with weaker performance on this bread-and-butter case.
- **Traversal depth is shallow.** Current features need one or two hops ("relations of this
  person", "sources for this relation"). The variable-length path queries where Cypher or Gremlin
  decisively beat SQL recursive CTEs are not yet on the roadmap.
- **Mixed workload.** The same database holds users, auth tokens, rate-limit state, audit logs,
  and multi-tenant scoping. That is squarely relational, and one datastore beats two.
- **Transactional integrity.** Creating a relation with its evidence is a multi-row write that
  must be atomic. Postgres gives ACID across the whole model without qualification.
- **Ecosystem.** Prisma's generated types are load-bearing for the strict-TypeScript approach.
  Neon adds branching, serverless scaling, and point-in-time recovery. Graph-database tooling for
  type-safe TypeScript is markedly thinner.
- **Postgres scales into the graph use case** via recursive CTEs, and can adopt `pgvector` or
  `pg_trgm` for search without changing stores.

**What it costs**

- **Deep traversal is awkward.** "All people connected to X within four hops" is a recursive CTE:
  writable, but neither elegant nor fast. A graph database answers it natively.
- **Polymorphic edges get no database-level integrity** — the single largest structural
  compromise in the model. A graph database enforces that edges connect real nodes by
  construction.
- **No native path algorithms.** Shortest path, centrality, and community detection would have to
  be implemented in application code or offloaded.
- **Schema rigidity.** Adding an entity type means an `EntityType` enum migration plus a table;
  in a schema-optional graph store it is just a new label.

**When to revisit**

If network analysis becomes a headline feature — centrality, clustering, "how are these two
figures connected", six-degrees exploration over large corpora — the sound move is a **read-only
graph projection** (Neo4j, Memgraph, or Apache AGE in-place on Postgres) fed from the relational
store, rather than migrating the system of record. Postgres stays authoritative for
transactions, tenancy, and auth; the graph store serves the traversal-heavy queries it is good
at. Committing to that split before the analytical requirements are concrete would be premature.

---

## Known limitations of the model

Documented honestly, since these are live constraints rather than oversights:

- **Polymorphic integrity is application-enforced.** Nothing at the database level prevents a
  relation pointing at a deleted or non-existent entity.
- **Soft delete is not universally filtered.** The Prisma client extension covers `findMany` and
  `findFirst`; `count`, `update`, `updateMany`, `delete`, and `groupBy` bypass it and must filter
  explicitly.
- **Soft-deleting an entity does not cascade to its relations**, which remain active and can
  appear as edges to nowhere.
- **`Location` and `Literature` lack soft delete** despite being full members of the relation
  graph — deleting one permanently orphans relations that reference it. To be addressed before
  their CRUD is built.
- **No database CHECK constraints on partial dates.** Zod rejects month 13, but nothing at the
  database level rejects 31 February, and bulk import would write outside Zod.
- **BCE dates are undefined.** `Person` years are bounded 1–2100 while event and relation years
  are unbounded — an inconsistency to resolve before the model claims pre-Common-Era coverage.

A full architectural review lives in [`docs/project-review-2026-07-13.md`](docs/project-review-2026-07-13.md);
specs are under [`docs/specs/`](docs/specs/).
