# Evidoxa - Feature Review & Critical Analysis

> Critical review of the legacy feature set from two perspectives: the historian as end user, and the tech architect. Each decision is questioned; recommendations are directional, not prescriptive. This document feeds into the roadmap and epic definition process.

---

## 1. Core Concept: Is This the Right Tool?

The app positions itself as a research tool for historians to manage persons, events, locations, sources, and relationships. This is a **prosopography and event network tool** at its core — a legitimate category of digital humanities software with real demand.

**The fundamental tension:** Historians think in narratives, arguments, and interpretations. The current design forces them to think in rows, columns, relations, and confidence decimal scores. Every design decision should be weighed against the question: *does this help a historian build knowledge, or does it make them manage a database?*

---

## 2. Data Model — Critical Review

### 2.1 User & Auth (Sections 2.1, 4.1, 4.2)

**Historian perspective:**
- The auth model is fine; historians don't care how it works. What matters is that it gets out of the way.
- The project/member role model (owner/editor/viewer) is probably sufficient for most collaborative research teams. "Commenter" is notably absent — a historian reviewer who can annotate without editing is a common need.

**Architect perspective:**
- `workosUserId` is a dead field. No migration, no cleanup, just noise in the schema.
- Storing OAuth tokens (Mendeley `accessToken`, `refreshToken`, Zotero `apiKey`) in the same `bibliography_syncs` table as plaintext strings is a security smell. These should be encrypted at rest or stored in a secrets manager.
- Custom `EmailConfirmation`, `PasswordReset`, and `RefreshToken` tables are hand-rolling what NextAuth already provides or what a dedicated auth provider handles. This is maintenance surface without strategic value.
- `AuthAuditLog` logs auth events, not data events. Calling the dashboard widget "Recent Activity" while only showing login/logout events is actively misleading to users. Either build real activity tracking or rename it honestly.
- NextAuth v4 is the legacy version. v5 (Auth.js) has a fundamentally different API and is the direction of travel. Building on v4 now means a breaking migration in the medium term.

### 2.2 Project Scoping

**Historian perspective:**
- Every core entity (persons, events, sources, statements, relations) carries a nullable `project_id`. "Nullable" is significant — it implies entities can exist outside any project, which is either a useful personal workspace concept or an accident. It should be a deliberate, named concept.
- There is no project-level description beyond `name` and `description`. No project-level bibliography, no project-level notes, no research question field. Projects are containers, not workspaces with context.

**Architect perspective:**
- Nullable `project_id` on every entity creates a class of orphaned or "global" records with no clear ownership semantics. This complicates every query, every permission check, and every cascade.
- The `UserProject` join table with a string `role` field instead of an enum is a consistency risk — any typo creates a broken role.
- There is no soft-delete anywhere. Deleting a project cascades destructively. For research data that may represent years of work, this is a critical omission.

### 2.3 Person (Section 2.4)

**Historian perspective:**
- The confidence score fields (`birth_place_confidence`, `name_confidence`, etc.) as `Decimal(3,2)` values are a correct instinct — historical data is uncertain — but the UX for entering and communicating these scores is unclear. Historians don't think in 0.00–1.00 decimal values. They think in "probably," "possibly," "unknown."
- The uncertainty enum (`exact/approximate/estimated/unknown`) is better because it maps to how historians actually describe uncertainty, but it exists only on dates, not places.
- Birth and death location are stored in three places: free-text `birth_place`/`death_place`, normalized `birth_place_normalized`, and FK `birth_location_id`. This triple redundancy creates synchronization problems.
- There is no field for a person's occupation, social class, religion, ethnicity, or other prosopographic dimensions. These are fundamental to historical analysis. The model is a skeleton.
- There is no name variant support. Historical figures are known by multiple names (aliases, transliterations, honorifics, maiden names). The model assumes one canonical name.

**Architect perspective:**
- The `notes` field is a single unstructured text blob. Notes are likely the most-used field in the app; making them unstructured forecloses search, categorization, and linking.
- The 12+ indexes on the `persons` table suggest query patterns that were discovered empirically rather than designed. Some may be unused.
- `created_via_import` and `import_batch_id` on every entity row is denormalization that belongs in a join table or a separate provenance log.

### 2.4 Event (Section 2.5)

**Historian perspective:**
- Sub-events via `parentId` self-reference is a good idea for modeling hierarchical history (a battle as sub-event of a war). But infinite depth via self-reference is hard to navigate and visualize without specific UI investment.
- The event model lacks a type field (battle, legislation, migration, marriage, natural disaster, etc.). Without this, filtering and visualizing events by category is impossible. The `event_types` table exists for this purpose but is explicitly marked as unused.
- The `date` field is a `DateTime`, but many historical events are known only by year or decade. Storing these as `DateTime` (midnight on Jan 1 of a year) silently loses the grain of the original record. The `date_original` and `date_uncertainty` fields partially address this but create a two-field redundancy.

**Architect perspective:**
- The same triple-redundancy problem as Person: `location` (free text), `location_normalized`, `location_id` FK, PLUS inline `latitude`, `longitude`, `country`, `region`, `city`. Six location-related fields on one entity.
- The `event_types` table existing in schema but being unused is unacceptable in a production system. Either use it or drop it.

### 2.5 Location (Section 2.6)

**Historian perspective:**
- The location normalization system (Constantinople -> Istanbul) is genuinely valuable for historical research. This is a feature worth keeping and expanding.
- Multi-language support is needed — historians regularly work across linguistic traditions.
- There is no concept of a location's historical extent, its administrative context at a given time, or its relationship to other locations (city within region, colony of empire). The location model is purely geographic, not historically contextual.

**Architect perspective:**
- Nominatim (OpenStreetMap) is a free service with a strict 1 req/sec rate limit and a usage policy that prohibits bulk geocoding. Using it as the sole geocoding provider is a reliability and compliance risk.
- The in-memory geocoding cache is not durable. On serverless deployments (Vercel), each function invocation starts fresh. The cache is effectively useless in production.
- Similarly, the in-memory rate limiter will not work correctly in a serverless environment where there is no shared process state.

### 2.6 Source vs. Literature (Sections 2.7, 2.12)

**Historian perspective:**
- This is the most conceptually muddled area of the data model. Historians make a clear distinction:
  - **Primary sources:** archival documents, letters, church records, newspaper articles — original historical evidence.
  - **Secondary literature:** books, articles, theses written by other historians — scholarly interpretations.
- The app has `sources` (with reliability score, linked to statements and person-event relations) and `literature` (rich bibliographic metadata with Zotero/Mendeley sync). The intent seems to be: sources = primary sources, literature = secondary literature. But this is never explicitly stated, and the `sources` table has fields like `publication` and `year` that blur the distinction.
- A statement (`Statement` table, Section 2.8) is defined as a "historical statement/claim" with a confidence score, linked to a source and to person-event relations. This is a legitimate scholarly concept (a claim made by a source), but the name "Statement" is too generic to be self-explanatory.

**Architect perspective:**
- Having two separate bibliographic models with no formal relationship between them creates orphaned citation chains. A literature entry cannot be directly cited as evidence for a person-event relation; only a `Source` record can.
- The Zotero sync is on `Literature` but not on `Source`. If a historian wants to cite a Zotero-synced entry as primary evidence, they must manually create a duplicate entry as a `Source`.

### 2.7 Relations (Sections 2.9, 2.10, 2.11)

**Historian perspective:**
- 32 person-to-person relation types and 24 person-event relation types. This is a large fixed vocabulary that will inevitably be wrong for some historians' domains. A medievalist's relational vocabulary differs from a social historian of 20th-century labor movements.
- All labels are in German, hardcoded. A French or English historian using this tool cannot meaningfully use it.
- The `PersonRelation` model has no `project_id`. A person-to-person relation spans projects, which may be intentional (a kinship network transcends a single research project) but is architecturally inconsistent with everything else.
- The `SourceOnRelation` concept (attaching a source as evidence to a person-event relation) is genuinely sophisticated. It reflects real scholarly practice. But the constraint "unique on (source_id, relation_id)" means only one source can evidence one relation — a limitation that will frustrate historians.

**Architect perspective:**
- `PersonRelation` lacks `project_id` and `userId` — it is the only major entity without ownership/project context. This is either a deliberate modeling choice or an oversight; either way, it needs a documented rationale.
- The uniqueness constraint on `PersonEventRelation (person_id, event_id, relationship_type)` means a person can only have one instance of each role in an event. This breaks if a person was, say, both a "participant" and a "victim" — but wait, those are different types, so it would be allowed. However, it means you cannot record two sources independently linking the same person to the same event in the same role, which collapses real evidentiary complexity.

---

## 3. Functional Features — Critical Review

### 3.1 Import System (Section 3.9)

**Historian perspective:**
- CSV/XLSX import is the right entry point for historians who already have data in spreadsheets. This is a high-value feature.
- Fuzzy date parsing ("c. 1850", "1790?", "before 1900") is essential and well-conceived.
- There is no export. Data enters the system but cannot leave. This is a research tool anti-pattern — historians need to export their work for publication, sharing, or migration to other tools.
- There is no import for relations, sources, literature, or statements. Only persons and events are importable. A historian migrating a dataset must manually re-enter all relationship data.

**Architect perspective:**
- Duplicate detection via Levenshtein distance is a reasonable start but is run at import time only. There is no ongoing deduplication for manually-entered records.
- Import processing is synchronous (based on the presence of no job queue or background worker mention). Large imports will hit Vercel's function timeout limits.

### 3.2 Search & Filtering (Section 3.10)

**Historian perspective:**
- There is no cross-entity search. You cannot search for "Vienna" and get persons born there, events located there, and sources mentioning it simultaneously.
- There is no full-text search across notes and descriptions — the most likely place historians actually record their findings.
- The autocomplete for persons/events in relation forms is mentioned, but not whether it searches across projects.

**Architect perspective:**
- Postgres `LIKE` queries (implied by the absence of any mention of `pg_trgm`, full-text indexing, or external search) do not scale for large datasets and produce poor relevance ranking.
- There is no mention of search pagination handling edge cases (empty results, single character inputs, etc.).

### 3.3 Data Visualization (Section 3.11)

**Historian perspective:**
- A timeline view exists but is described minimally. Historians need timelines that can show multiple persons' life courses in parallel, zoom in/out, and filter by event type, location, or relationship.
- The map view showing person locations and event locations is valuable. The key missing feature is temporal filtering: show who was where, when.
- Analytics is aggregate counts. This is a dashboard widget, not analysis. Real analytical value would be: network centrality of persons, clustering of events by location over time, relationship network visualization.
- There is no graph/network visualization for person-person or person-event networks, despite the relational data model being well-suited for it.

**Architect perspective:**
- Two chart libraries (ECharts + MUI X Charts) for the same purpose is unnecessary dependency duplication. Pick one.
- Leaflet maps in a Next.js App Router context require careful SSR handling (dynamic imports). This is a known friction point.

### 3.4 Literature & Bibliography Sync (Section 3.7)

**Historian perspective:**
- Zotero integration is the right call — it is the dominant reference manager in academic history.
- Mendeley's academic community has declined since Elsevier's acquisition. The OAuth flow complexity may not justify the user base it serves.
- RIS import is good for compatibility with other reference managers (Endnote, RefWorks, Citavi).
- There is no citation export (BibTeX, Chicago, Harvard, MLA). A historian needs to export their bibliography in a format for publication.

**Architect perspective:**
- Mendeley's OAuth tokens are stored in the database. The token refresh logic is custom-built. This is security and reliability surface that could be avoided by reconsidering the Mendeley integration priority.
- The sync is manually triggered. There is no mention of webhook support or polling jobs. "Auto sync" exists as a field but no background worker is mentioned to execute it.

### 3.5 Dashboard (Section 3.12)

**Historian perspective:**
- Count cards (total persons, events, sources, locations) are the least useful possible dashboard for a researcher. A historian opening the app wants to know: "Where did I leave off? What's unresolved? What's uncertain?"
- The "Recent Activity" feed showing login/logout events is near-useless from a research workflow perspective.

**Architect perspective:**
- A separate `/api/dashboard/stats` endpoint that aggregates counts is a query that will get expensive as data grows. No mention of caching strategy specific to this endpoint.

---

## 4. Non-Functional Features — Critical Review

### 4.1 Caching (Section 4.4)

**Architect perspective:**
- The in-memory `Cache` class with a global singleton is broken in serverless environments. On Vercel, each function invocation is stateless. The cache is populated per-invocation and discarded immediately after. This provides zero benefit in production while adding code complexity.
- The geocoding cache has the same problem.
- The rate limiter has the same problem — it cannot protect against abuse in a serverless environment.
- None of these in-memory solutions should be carried forward without replacement by a durable cache (Redis, Vercel KV, etc.).

### 4.2 Security (Section 4.3)

**Architect perspective:**
- XSS sanitization stripping script tags is good, but the implementation detail (stripping tags vs. encoding output) matters enormously. React already escapes by default; a custom sanitizer applied to inputs before DB storage may be double-handling.
- Storing OAuth tokens and API keys as plaintext strings in the `bibliography_syncs` table should be treated as a security issue, not a known architectural issue.
- The test/debug routes in production (`/api/test`, `/api/debug/env`, etc.) are active attack surface and should not exist in any environment beyond local development. `/api/debug/env` is particularly dangerous — it may expose environment variables.
- Rate limiting via in-memory state is not rate limiting in serverless. There is no effective rate limiting in the current production deployment.

### 4.3 Internationalization (Section 4.8)

**Historian perspective:**
- German-only UI labels (hardcoded strings) means the tool is unusable for historians who do not read German. This is a product-limiting decision for a research tool that could otherwise serve an international scholarly audience.
- Mixed German/English is the worst of both worlds — neither fully localized nor fully accessible to non-German speakers.

**Architect perspective:**
- No i18n framework means adding a second language requires touching every string in the codebase. The cost of this decision compounds linearly with the size of the UI.
- The decision to hardcode German was probably a "ship fast" compromise. It needs a formal decision: commit to German-only and design for it, or build for internationalization from the start of the rebuild.

### 4.4 Testing (Section 4.7)

**Architect perspective:**
- "Limited (not comprehensive)" test coverage is a warning sign, not a known issue. With no coverage baseline, regressions during the rebuild cannot be detected systematically.
- MSW for API mocking is the right tool, but its value is only realized with meaningful test coverage.
- Playwright E2E tests are present but their scope is not described. E2E tests without scope coverage are a false confidence signal.
- Two separate test scripts (`npm test`, `test:watch`, `test:coverage`) against a custom Jest config path is minor but suggests the testing infrastructure was bolted on rather than built in.

### 4.5 Deployment (Section 4.5)

**Architect perspective:**
- Vercel serverless + Neon PostgreSQL is a valid stack for this scale. The connection pooling (pooled + unpooled URLs) handles the serverless connection surge problem correctly via Prisma's data proxy or pgBouncer.
- The build command `prisma generate && prisma db push && next build` is risky: `prisma db push` applies schema changes directly to production with no migration history. This should be `prisma migrate deploy` in production.
- Standalone output mode is correct for Docker/self-hosted, but on Vercel it is unnecessary and potentially counterproductive — Vercel manages its own bundling.

---

## 5. Summary of Critical Questions for the Rebuild

These are the decisions that must be answered before architecture begins:

1. **Who is the primary user?** A solo German-language historian, or an international collaborative research team? This determines the i18n strategy, collaboration model depth, and onboarding complexity.

At first only german researchers, but we should implement i18n fromt the start in order to not have huge refactors later.

2. **What is a "source" vs. "literature"?** Merge into a unified bibliographic model with a type field (primary/secondary), or keep separate? The current split is implicit and confusing.

A source is a primary source (like a diary entry from 1820), literature is secondary literature (like a Article from Prof. Dr. xyz on the topic of Diary Culture in 1820)

3. **Should relation type vocabularies be fixed or user-defined?** Hardcoded 32+24 types make the tool fragile for diverse historical domains. A configurable taxonomy per project is more powerful.

You right, we should keep it flexible.

4. **Is German-only acceptable, or must the rebuild target internationalization?** This is a binary strategic decision with large architectural implications.

International would probably be the way to go.

5. **What replaces in-memory caching and rate limiting?** A durable solution (Redis/Vercel KV) must be selected before the first API route is written.

We need to check that in the Roadmap or Refinement of Epics. Super Important! Security is of utmost importance.

6. **What is the export story?** CSV, JSON, RIS, BibTeX, network graph formats — export is a non-negotiable feature for a research tool and must be designed in from the start.

Absolutely, has to be part of the intitial roadmap!

7. **Does the app need real-time collaboration (WebSockets, operational transforms)?** Or is project-level shared access sufficient?

Is Websocket something that could be added on in a future iteraction (v2.0 or so) without having to rebuild half the app?

8. **What is the confidence/uncertainty UX?** Decimal scores are a bad UX. Categorical uncertainty (certain / probable / possible / unknown) with provenance notes may serve historians better.

We can cut that out for now. The idea was that certain historical dates or facts are not carved in stone, they are open to interpretation and differen researchers have different optinions. I wanted a way of introducing this kind of data uncertainty in to the App. But this way was, you're absolutely right, way unusable.

9. **Should the rebuild be a clean schema redesign or schema-compatible evolution?** This determines whether existing user data can be migrated without transformation.

We do not need to migrate anything, clean slate. The app has never been shipped or used productively.

10. **What is the test coverage target?** Without a mandated baseline, coverage will remain "limited" indefinitely.

A best practice number, from the top of my head 80%

Additionally we need to take a very good look at the modelling of relationships. Persons are related to events, other personens or locations. Every relationship has relationships to sources. Should everything be relatable to everything? At first i had an extra entity of "life-events" to persist dates related to the life of a person in speration to historical events. But i gave that differentiation up for a more generic solution and better interoperability of entities and realtions.

Also as a bit of background to the product status. I know that this is something many researchers would like to have. At some point it should be commercialized (partially), but now it is not even in alpha phase. So what we build is an mvp that can be validated with a couple of researchers at my local university. But in building that mvp i do not want to prohibit any future iterations or additions and build a solid base.
