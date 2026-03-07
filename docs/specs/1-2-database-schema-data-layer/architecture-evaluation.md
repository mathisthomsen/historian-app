# Epic 1.2 — Architecture Evaluation & Revised Brainstorming

**Date:** 2026-03-07
**Status:** Pre-implementation — design decision required before Epic 1.2 begins

---

## 1. Current Schema Summary

The Epic 1.2 specification defines an 11-table schema centred on a **universal graph model**:

- **Entities**: Person, Event, Source, Location, Literature (with PersonName as child)
- **Relations**: Polymorphic `Relation` table with `from_type`/`from_id`/`to_type`/`to_id` (no DB FK)
- **Evidence**: `RelationEvidence` — attaches a `Source` to a `Relation`
- **Temporal data**: year/month/day integer columns with `Certainty` enum on Person and Event
- **Multi-tenancy**: `project_id` on every user-data table from day one
- **Soft-delete**: `deleted_at` on Person, Event, Source, Relation

The schema is clean, idiomatic Prisma, and well-reasoned for its scope. Most brainstorming decisions are sound.

---

## 2. Architecture Evaluation

### 2.1 Strengths

| Strength | Detail |
|----------|--------|
| Project isolation | `project_id` on all user-data tables; correct from day one |
| Partial date support | Year/month/day integer triple + `Certainty` enum handles "c. 1850", year-only, full ISO dates |
| Polymorphic graph | `Relation` with `from_type`/`from_id`/`to_type`/`to_id` enables Person–Event, Person–Person, Event–Source edges |
| PersonName | Separate table supports multilingual name variants (DE/LA/EN) — good historical research feature |
| Evidence linkage | `RelationEvidence` attaches sources to relations; basic provenance is covered |
| Enum strategy | `EntityType` kept minimal (no OBJECT/IMAGE without backing tables); correct decision |
| Soft-delete | On the right tables; documented limitation that Prisma does not auto-filter |
| Prisma/Neon compatibility | Standard patterns throughout; no risky deviations |

### 2.2 Weaknesses

#### W1 — No Temporal Validity on Relations

The `Relation` table has no `valid_from` / `valid_to`. This makes it impossible to model the most common category of historical fact:

> "Person A was married to Person B from 1845 to 1862."
> "Person A held office from 1871 to 1875."
> "Event X was part of Event Y during period Z."

Without temporal validity, every relation is implicitly eternal. This is a fundamental omission for historical research software.

**Impact**: High. Adding this post-MVP requires a migration on potentially large tables and changes query patterns in every graph traversal.

---

#### W2 — No Claim / Assertion Layer

Every entity property (Person.birth_year, Event.start_year, etc.) is a **bare fact** — a single stored value with no source attribution. This ignores how historical data actually works:

- Source X says Person A was born in 1820
- Source Y says Person A was born in 1823
- The researcher prefers the interpretation from Source X with HIGH confidence

The current schema cannot represent:
- Conflicting claims for the same property
- Which source supports a specific field value
- Confidence at the claim level (not just relation level)
- The evolution of an interpretation over time

Attaching a source to a Person's `birth_year` is structurally impossible. `RelationEvidence` only links Sources to Relations.

**Impact**: Medium for Phase 1–2, High for Phase 3+. Once the Phase 2 UI is built around facts, retrofitting a claim layer is a major architectural change.

---

#### W3 — RelationEvidence is Thin

`RelationEvidence` has only `source_id` + `notes`. For archival research this is insufficient:

- No `page_reference` / `folio` / `column`
- No `quote` (direct transcript excerpt from the source)
- No per-evidence `confidence` (distinct from Relation-level certainty)
- No `transcription` for handwritten sources

This is a relatively cheap addition, but omitting it now means evidence records from Phase 2 will need backfilling.

**Impact**: Low-Medium. Additive migration is safe, but data quality suffers until then.

---

#### W4 — Birth/Death Places and Event Locations are Free Text

`Person.birth_place`, `Person.death_place`, and `Event.location` are all `String?`. The spec notes that Epic 3.2 will add a `location_id` FK.

However:
- Free-text place names entered in Phase 2 will not be geocodable without re-entry or fuzzy matching
- Timeline and map visualizations (Phase 4+) need structured location data
- The gap between free-text entry and structured Location is a UX discontinuity

**Impact**: Medium. Manageable but creates technical debt and data quality risk.

---

#### W5 — No Versioning / Interpretation History

There is no mechanism to track how a record changed over time:
- If `Person.birth_year` is revised from 1820 to 1823, the 1820 value is lost
- No `changed_by`, `changed_at`, or `previous_value` is preserved
- Historians cannot audit the evolution of their interpretation

The spec defers a full activity log to Epic 4.4, but even basic field-level versioning is absent.

**Impact**: Low for Phase 1–2, escalating. Once researchers trust the system with production data, the absence of history becomes a trust problem.

---

#### W6 — Polymorphic Cascade Integrity is Discipline-Only

When a Person is soft-deleted, `Relation` rows referencing that person via `from_id`/`to_id` are silently orphaned (no DB FK cascade). The spec documents this and defers handling to Epic 2.4. The risk is:

- Phase 2 queries may surface relations pointing to soft-deleted entities
- Every graph traversal query must join and filter entity soft-delete state
- A bug in the app layer creates invisible data integrity violations

**Impact**: Medium. Prisma middleware can mitigate but not eliminate this risk.

---

## 3. Alignment with Historical Data Concepts

| Concept | Status | Gap |
|---------|--------|-----|
| Claims as historical assertions | Not supported | All data is bare facts; no claim entity |
| Claim versioning / interpretation history | Not supported | No version table; Epic 4.4 deferred |
| Graph-like structures | Partially supported | Relation table works; no hyperedges or weighted edges |
| Temporal validity (valid_from/valid_to) | Not supported | Critical gap for relations |
| Source linkage to assertions | Partially supported | Sources link to Relations only, not to entity properties |
| Multi-user isolation | Supported | project_id on all tables |
| Future visualizations | Partially supported | Graph: yes; Timeline: blocked by W1; Map: blocked by W4 |

---

## 4. Alternative Schema Proposals

### Option A — Current Schema + Targeted Additions (Evolutionary)

Keep the fact-based model. Add the most critical missing features as additive columns:

```
Relation:
  + valid_from_year  Int?
  + valid_from_cert  Certainty  @default(UNKNOWN)
  + valid_to_year    Int?
  + valid_to_cert    Certainty  @default(UNKNOWN)

RelationEvidence:
  + page_reference   String?
  + quote            String?
  + confidence       Certainty  @default(UNKNOWN)
```

And add nullable Location FK to Person and Event:

```
Person:
  + birth_location_id  String?  (FK → locations)
  + death_location_id  String?  (FK → locations)

Event:
  + location_id        String?  (FK → locations)
  (keep location String? as fallback display text)
```

**Pros:**
- Minimal change to current spec; Epic 1.2 implementable now
- All additive (no column removal, no breaking changes)
- Prisma support is straightforward
- Covers the timeline visualization gap (valid_from/valid_to on relations)
- Covers the map visualization gap (Location FK)

**Cons:**
- Claim semantics still absent — source attribution to entity properties impossible
- Versioning still absent
- Technical debt accumulates; a later claim layer would require schema redesign

**Complexity:** Low. 2–3 extra columns per table.

---

### Option B — Claim-Centric Model (Semantic)

Replace entity property columns with a `Claim` table. Entities become thin identity records; all properties are claims with source attribution.

```
Claim {
  id               String   @id
  project_id       String
  entity_type      EntityType
  entity_id        String
  property         String      // "birth_year", "name", "description"
  value            String      // serialized; type-checked at app layer
  source_id        String?     // FK to sources
  confidence       Certainty
  valid_from_year  Int?
  valid_to_year    Int?
  created_by_id    String?
  created_at       DateTime
  superseded_by_id String?     // linked list of versions
}
```

**Pros:**
- Full source attribution for every data point
- Conflict representation (two claims for same property, both stored)
- Natural versioning (superseded_by_id chain)
- Academically correct model (aligns with CIDOC CRM, ResearchSpace)

**Cons:**
- Reconstructing a Person requires aggregating Claims (no single row for "all fields")
- Prisma type safety is mostly lost — `value: String` loses the schema contract
- Query complexity is extreme (GROUP BY + conditional aggregation)
- UI complexity: every field becomes a claim editor with source picker
- Performance: display of a single Person requires 10–20 rows instead of 1
- Prisma migrations must be more carefully managed (schema is data, not structure)
- Phase 1 implementation cost is 3–5x higher

**Complexity:** Very High. Represents a different paradigm, not an evolution.

---

### Option C — Temporal Knowledge Graph (Incremental Enhancement)

Keep entities as-is. Add temporal validity to Relations (covers the most critical gap). Add a `Claim` table as a supplementary evidence layer for entity properties — not replacing columns, but adding optional source attribution alongside them.

```
Relation:
  + valid_from_year    Int?
  + valid_from_month   Int?
  + valid_from_cert    Certainty  @default(UNKNOWN)
  + valid_to_year      Int?
  + valid_to_month     Int?
  + valid_to_cert      Certainty  @default(UNKNOWN)

RelationEvidence:
  + page_reference     String?
  + quote              String?
  + confidence         Certainty  @default(UNKNOWN)

// New supplementary table — attaches sources to entity property values
model PropertyEvidence {
  id           String     @id @default(cuid())
  project_id   String
  entity_type  EntityType
  entity_id    String
  property     String       // "birth_year", "start_year", "name" — stringly-typed
  source_id    String
  notes        String?
  page_reference String?
  created_at   DateTime   @default(now())

  source  Source  @relation(fields: [source_id], references: [id])

  @@index([entity_type, entity_id])
  @@index([source_id])
  @@map("property_evidence")
}
```

**Pros:**
- Temporal validity on Relations (critical gap closed)
- Source attribution for entity properties (via PropertyEvidence — opt-in, non-breaking)
- Entities remain simple, queryable rows — no reconstruction complexity
- All additive changes — no breaking migrations
- Prisma-compatible
- Incremental: researchers can use it with or without PropertyEvidence

**Cons:**
- `property` field in `PropertyEvidence` is a plain String — no schema-level validation of property names
- Versioning still absent (same deferred position as current spec)
- Still not a true claim model — PropertyEvidence supplements facts, doesn't replace them

**Complexity:** Medium. More tables than Option A, less paradigm shift than Option B.

---

### Option D — Bitemporal Full Claim Graph (Academic Standard)

Full CIDOC CRM-inspired bitemporal model: transaction-time (when recorded in DB) + valid-time (when true historically). Inspired by ResearchSpace, Wikidata, and temporal relational databases.

Not detailed here — this is the correct long-term target for a Phase 5+ academic edition but is out of scope for the current development phase. It requires abandoning Prisma as the primary query layer in favour of raw SQL with CTE-based temporal queries.

**Complexity:** Extreme. Not recommended before Phase 4.

---

## 5. Recommended Architecture Direction

**Recommendation: Option C — Temporal Knowledge Graph**

This is the minimum viable architecture that does not accumulate critical technical debt.

### Rationale

1. **Temporal validity on Relations is not optional.** It must exist before the Phase 2 graph UI is built. Retrofitting it after the API layer is built means changing every relation query in the application. The migration itself is safe (additive columns, all nullable), but the query-layer changes are risky and laborious.

2. **PropertyEvidence provides a path to claim semantics without a paradigm shift.** Historians can attach sources to specific entity properties ("birth_year supported by Document X, p. 14") without forcing every researcher to use the claim workflow from day one.

3. **Option A is insufficient.** Temporal validity alone without any source attribution for entity properties leaves a semantic gap that users will immediately encounter ("where did this birth year come from?").

4. **Option B is premature.** The claim-centric model is academically correct but imposes too much complexity on Phase 1–2 implementation and UX design. It should be revisited as a Phase 5 research edition feature, not a foundation constraint.

### Recommended Schema Additions to Epic 1.2

The following additions should be incorporated into the Epic 1.2 spec before implementation begins:

**To `Relation`** (temporal validity):
```prisma
valid_from_year  Int?
valid_from_month Int?
valid_from_cert  Certainty @default(UNKNOWN)
valid_to_year    Int?
valid_to_month   Int?
valid_to_cert    Certainty @default(UNKNOWN)
```

**To `RelationEvidence`** (richer provenance):
```prisma
page_reference  String?
quote           String?
confidence      Certainty @default(UNKNOWN)
```

**New table `PropertyEvidence`** (entity-property source attribution):
```prisma
model PropertyEvidence {
  id             String     @id @default(cuid())
  project_id     String
  entity_type    EntityType
  entity_id      String     // no FK — polymorphic, app-layer integrity
  property       String     // "birth_year", "description", etc.
  source_id      String
  notes          String?
  page_reference String?
  created_at     DateTime   @default(now())

  project Project @relation(fields: [project_id], references: [id], onDelete: Cascade)
  source  Source  @relation(fields: [source_id], references: [id], onDelete: Cascade)

  @@index([project_id])
  @@index([entity_type, entity_id])
  @@map("property_evidence")
}
```

**To `Person`** (structured location FKs):
```prisma
birth_location_id String?  // FK → locations (nullable; free text kept as fallback)
death_location_id String?  // FK → locations

birth_location Location? @relation("PersonBirthLocation", fields: [birth_location_id], references: [id])
death_location Location? @relation("PersonDeathLocation", fields: [death_location_id], references: [id])
```

**To `Event`** (structured location FK):
```prisma
location_id String?  // FK → locations

location_ref Location? @relation(fields: [location_id], references: [id])
```

---

## 6. Open Questions

These require explicit design decisions before implementation:

| # | Question | Options | Impact |
|---|----------|---------|--------|
| OQ-1 | Should `valid_from`/`valid_to` on Relation include month (matching Person/Event date precision), or year-only? | Year-only (simpler) vs. year+month+certainty triple (consistent with rest of schema) | Query complexity |
| OQ-2 | Should `PropertyEvidence.property` be a free-text String, or a constrained enum per entity type? | String (flexible) vs. per-entity enum (validated) | Schema rigidity vs. correctness |
| OQ-3 | Should Location FK on Person be added in Epic 1.2 (before location entry UI exists), or deferred to Epic 3.2 when geocoding is built? | Add now (nullable, no migration later) vs. defer (less schema complexity in Phase 1) | Migration risk |
| OQ-4 | Should the schema include a stub `ClaimVersion` table (empty, reserving the concept) or defer entirely? | Reserve now (commits to claim semantics) vs. defer (less noise) | Future architecture |
| OQ-5 | How should conflicting property values be handled when `PropertyEvidence` points to two sources with contradictory values? | Display all evidence with confidence scores; let researcher resolve | UI design |
| OQ-6 | Should `Relation` support inverse relations explicitly (a separate `inverse_id` column pointing to the inverse Relation row), or derive inverses at query time? | Explicit (faster reads) vs. derived (simpler writes) | Query performance |
| OQ-7 | Is `Event.parent_id` (self-referential hierarchy) sufficient for Phase 1, or do we need an `EventGroup` / `EventSeries` table? | Self-referential (current) vs. separate group entity | Model expressivity |
| OQ-8 | Should the polymorphic cascade problem (soft-deleted entity leaves orphaned Relations) be addressed via a DB trigger, Prisma middleware, or API-layer discipline alone? | Trigger (DB-level safety) vs. middleware (Prisma-level) vs. discipline (current plan) | Data integrity risk |

---

## 7. Identified Risks in Current Spec

| Risk | Severity | Mitigation |
|------|----------|------------|
| Temporal validity absent from Relation before Phase 2 API layer is built | High | Add to Epic 1.2 spec (Option C above) |
| Free-text location fields create geocoding debt before map visualization | Medium | Add nullable Location FK to Person/Event in Epic 1.2 |
| RelationEvidence too thin for archival research; data quality suffers from Phase 2 | Medium | Add page_reference/quote/confidence to Epic 1.2 spec |
| Soft-deleted entity cascade relies entirely on application discipline | Medium | Introduce Prisma middleware in Epic 2.1 (currently deferred); consider DB trigger |
| No versioning before researchers trust system with production data | Medium | Design ClaimVersion/history approach before Epic 3.1 |
| Claim semantics absent; source attribution for entity properties impossible | Medium | PropertyEvidence table (Option C) as incremental bridge |
| Self-referential Event hierarchy may not model complex event structures | Low | Revisit in Epic 2.2 when EventType table is added |

---

## 8. Migration Impact Assessment

All recommended additions are **additive and non-breaking**:

| Change | Migration type | Risk |
|--------|---------------|------|
| Add `valid_from_*`/`valid_to_*` to Relation | ALTER TABLE ADD COLUMN (nullable) | None |
| Add `page_reference`/`quote`/`confidence` to RelationEvidence | ALTER TABLE ADD COLUMN (nullable) | None |
| Create `property_evidence` table | CREATE TABLE | None |
| Add `birth_location_id`/`death_location_id` to Person | ALTER TABLE ADD COLUMN (nullable FK) | None |
| Add `location_id` to Event | ALTER TABLE ADD COLUMN (nullable FK) | None |

No existing data is modified. All new columns are nullable. No index changes required for existing queries.

---

## 9. Recommended Next Step

Before implementing Epic 1.2, update `specification.md` to incorporate:

1. Temporal validity columns on `Relation` (OQ-1 must be resolved first)
2. Richer `RelationEvidence` columns
3. `PropertyEvidence` table
4. Nullable Location FKs on `Person` and `Event` (pending OQ-3 decision)

Then run the Epic 1.2 implementation via the `dev` skill with the revised spec.

The architectural direction for a future claim layer (Phase 4+) should be documented as a separate spec stub to reserve the design space without committing implementation resources now.
