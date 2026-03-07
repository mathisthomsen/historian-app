# Evidoxa Rebuild — Roadmap

> Full clean-slate rebuild. No data migration required. Target: university MVP validation → future SaaS commercialization. Highly complex data, easy to handle with a great UI, because the UX Concept keeps the complexity awy from the user.

---

## Strategic Decisions (locked)

| Decision                | Choice                                                                                          |
| ----------------------- | ----------------------------------------------------------------------------------------------- |
| UI framework            | shadcn/ui + Tailwind CSS (replacing MUI entirely)                                               |
| Auth                    | Auth.js v5 (replacing NextAuth v4)                                                              |
| Relation model          | Universal graph — any entity to any entity, user-defined relation types                         |
| Life events             | Events are events; birth/death stay as Person attributes for display but are first-class events |
| Source vs. Literature   | Explicit split: Source = primary source evidence; Literature = secondary scholarly reference    |
| Uncertainty UX          | Categorical: `certain / probable / possible / unknown` (replacing Decimal confidence scores)    |
| Caching & rate limiting | Upstash Redis (Vercel KV) — no in-memory state                                                  |
| i18n                    | next-intl from day one; German first, English second                                            |
| Build command           | `prisma migrate deploy && next build` (replacing `prisma db push`)                              |
| Test coverage target    | 80%                                                                                             |
| Real-time collab        | Architecture must not preclude it; defer WebSocket implementation to v2                         |
| Export                  | First-class feature, designed in from Phase 1 API contracts                                     |

---

## Phase 1 — Foundation & Auth

> Goal: A running, secured, authenticated shell. Nothing domain-specific yet. Every epic is verifiable in the browser.

### Epic 1.1 — Project Bootstrap & Developer Experience

**Deliverable:** A clean Next.js 15 App Router project that starts, renders a styled shell, and has all tooling in place.

- Next.js 15, TypeScript (strict), App Router
- shadcn/ui + Tailwind CSS: base component set installed (Button, Input, Dialog, Table, Card, Badge, Tabs, Toast)
- next-intl: i18n provider configured, German (de) + English (en) locale files, locale switcher component
- ESLint (strict), Prettier, Husky pre-commit hooks
- Jest 30 + React Testing Library + jest-environment-jsdom configured
- Playwright E2E configured
- Path aliases (`@/components`, `@/lib`, `@/types`)
- Global error boundary, not-found page, loading skeleton pattern established
- Environment variable validation via Zod (`env.ts` checked at startup)

**Verifiable:** App loads, language switcher toggles DE/EN, component showcase page renders all base components.

---

### Epic 1.2 — Database Schema & Data Layer

**Deliverable:** A clean, migration-tracked Prisma schema implementing the universal graph model, with seed data.

**Core schema decisions:**

- All entities: `User`, `Project`, `UserProject`, `Person`, `Event`, `Source`, `Location`, `Literature`
- Universal relation model:
  - `Relation` table: `id`, `project_id`, `user_id`, `from_type` (enum), `from_id`, `to_type` (enum), `to_id`, `relation_type_id`, `notes`, `certainty` (enum: CERTAIN/PROBABLE/POSSIBLE/UNKNOWN), `created_at`, `updated_at`
  - `RelationType` table: `id`, `project_id`, `name`, `inverse_name`, `description`, `color`, `icon`, `valid_from_types` (array), `valid_to_types` (array)
  - `RelationEvidence` table: `id`, `relation_id`, `source_id`, `notes` — replaces SourceOnRelation
- Person attributes: `birth_date`, `birth_date_certainty`, `death_date`, `death_date_certainty` + person name variants as JSON or separate `PersonName` table
- Naming convention: **snake_case throughout** — no mixed conventions
- Prisma migrate workflow (`prisma migrate dev` locally, `prisma migrate deploy` in CI)
- Database seed script with demo project, sample persons, events, and relations
- Neon PostgreSQL: pooled connection for serverless, unpooled for migrations

**Verifiable:** `prisma studio` shows schema; health check endpoint returns DB connection status and migration version.

---

### Epic 1.3 — Authentication & Authorization

**Deliverable:** Full auth flow: register, login, email verification, password reset, session management. All pages accessible in browser.

- Auth.js v5 with Credentials provider (bcrypt) and Email provider (magic link via Resend)
- JWT session strategy, 30-day max age, refresh token rotation
- Email verification: custom token flow (EmailConfirmation table), 24h expiry, branded HTML emails via Resend
- Password reset: token flow (PasswordReset table), 1h expiry, single-use
- Password strength: min 8 chars, uppercase/lowercase/number/special char; strength indicator component
- Pages: `/auth/login`, `/auth/register`, `/auth/verify`, `/auth/forgot-password`, `/auth/reset-password`
- Middleware: all `/app/*` routes protected; public routes explicit allow-list
- `requireUser()` server helper for API route protection
- System roles: `USER`, `ADMIN` (UserRole enum)
- Project roles: `OWNER`, `EDITOR`, `VIEWER` (proper enum, not string)
- Auth audit log: LOGIN_SUCCESS, LOGIN_FAILED, REGISTER, PASSWORD_RESET, EMAIL_VERIFIED

**Verifiable:** Register → verify email → login → see dashboard shell → logout cycle works end-to-end in browser.

---

### Epic 1.4 — Security Infrastructure & CI/CD

**Deliverable:** Production-grade security primitives and automated deployment pipeline.

- **Upstash Redis** (Vercel KV compatible): sliding-window rate limiter middleware (configurable per-route limits), durable across all serverless instances
- **Durable caching**: Redis-backed cache with TTL for API responses (persons list, events list, dashboard stats)
- Security headers via `next.config.ts`: `X-Content-Type-Options`, `X-Frame-Options: DENY`, `X-XSS-Protection`, `Referrer-Policy`, `Content-Security-Policy`
- `poweredByHeader: false`
- All API routes: `Cache-Control: no-store`
- Output sanitization utility (React escapes by default; sanitizer applied only at DB write boundaries)
- `/api/health` endpoint: returns DB status, Redis status, app version — no secrets exposed
- Remove all debug/test routes (`/api/debug/*`, `/api/test*`) — blocked at middleware level in production
- **GitHub Actions CI/CD:** lint → typecheck → unit tests → E2E tests → deploy to Vercel
- `prisma migrate deploy` in CI pipeline (not `db push`)

**Verifiable:** Rate limiter returns 429 after limit; security headers visible in DevTools; health endpoint returns all-green; CI pipeline runs and deploys.

---

## Phase 2 — Core Research Loop

> Goal: A working research tool covering the MVP scope agreed for university validation. Persons, Events, Sources, and universal Relations with evidence linking.

### Epic 2.1 — Person Management

**Deliverable:** Full CRUD for persons with search, filtering, pagination, and the detail profile view.

- Person list: DataTable (shadcn Table + server-side pagination, search, column sort)
- Create/Edit form: react-hook-form + Zod, all fields with German + English labels (i18n)
- Fields: first_name, last_name, name_variants (array), birth_date + birth_date_certainty (categorical selector), birth_place, death_date + death_date_certainty, death_place, notes
- Person detail page: all attributes, tab for related events, tab for related persons, tab for related sources
- Bulk delete (checkbox selection + confirm dialog)
- Server-side search: first_name, last_name, name_variants (PostgreSQL full-text on person names)
- API: `GET/POST /api/persons`, `GET/PUT/DELETE /api/persons/[id]`, `POST /api/persons/bulk`
- Redis cache for list queries; cache invalidated on write
- Uncertainty UI: four-state selector component (Certain / Probable / Possible / Unknown) reusable across entities

**Verifiable:** Create a person with uncertain birth date, view profile, edit, search by name, bulk delete.

---

### Epic 2.2 — Event Management

**Deliverable:** Full CRUD for events with hierarchical sub-events, date uncertainty, and location fields.

- Event list: DataTable with search, filter by type, date range, location; server-side pagination
- Create/Edit form: title, description, event_type (user-defined), start_date + certainty, end_date + certainty, location (free text + optional geocoded Location FK), parent event (for sub-events)
- Event types: user-defined per project (name, color, icon) — no hardcoded types. Seeded defaults provided.
- Sub-event display: indented in list view; breadcrumb chain in detail view
- Event detail page: all attributes, sub-events list, related persons tab, related sources tab
- Date uncertainty: same four-state selector; display hints in list ("c. 1850", "before 1900")
- API: `GET/POST /api/events`, `GET/PUT/DELETE /api/events/[id]`, `POST /api/events/bulk`

**Soft delete note**
Prisma does not auto-filter deleted_at. A middleware extension is deferred to Epic 2.1 to
avoid boilerplate — the spec calls this out explicitly so it doesn't get forgotten.

**Verifiable:** Create a parent event (WWI), add sub-events, assign event type with color, view hierarchy, search by date range.

---

### Epic 2.3 — Source Management (Primary Sources)

**Deliverable:** Full CRUD for primary sources (archival documents, letters, records) with reliability scoring and relation linking.

- Source list: DataTable with search by title/author, filter by reliability tier
- Create/Edit form: title, type (archival_document, letter, newspaper, official_record, photograph, other — user-extendable), author, date, repository/archive, call_number, url, reliability (categorical: HIGH / MEDIUM / LOW / UNKNOWN — replaces decimal), notes
- Source detail page: all attributes, list of all relations where this source is attached as evidence
- Reliability display: color-coded badge
- API: `GET/POST /api/sources`, `GET/PUT/DELETE /api/sources/[id]`

**Distinction from Literature:** Sources are primary evidence. They appear in the relation evidence linking UI. Literature is secondary reference (handled in Phase 3).

**Verifiable:** Create a source (archival letter), set reliability, view detail page with linked relations.

---

### Epic 2.4 — Universal Relationship Engine

**One critical gotcha from previous implementations**
Relation.from_id / to_id have no DB-level FK — they're polymorphic. Referential integrity is
enforced at the application layer (Epic 2.4). Every Phase 2 epic that touches relations must
account for this.

**Deliverable:** The architectural centerpiece. Create typed, evidenced relations between any two entities. User-defined relation type taxonomies per project.

- **Relation type management:** Per-project CRUD for RelationTypes. Fields: name, inverse_name, description, color, icon, valid_from_types (multi-select entity types), valid_to_types. Seeded defaults per domain (family, professional, event participation, geographic).
- **Relation creation UI:**
  - Entity selector (type dropdown + search autocomplete for that entity type) for both sides
  - RelationType selector (filtered by the two selected entity types)
  - Certainty selector (four-state)
  - Notes field
  - Evidence attachment: attach one or more Sources to this relation with optional notes
- **Relation list view:** Tabular list, filterable by entity type pair, relation type, certainty. Shows both ends of the relation with links.
- **Entity relation tabs:** Each entity detail page (Person, Event, Source) has a "Relations" tab listing all relations where that entity is a participant.
- **Relation detail/edit/delete:** Inline in list or modal.
- API: `GET/POST /api/relations`, `GET/PUT/DELETE /api/relations/[id]`, `GET/POST/DELETE /api/relations/[id]/evidence`

**Key design constraint:** The relation model must be queryable efficiently. Add composite index on `(from_type, from_id)` and `(to_type, to_id)`. Prisma raw queries may be needed for complex graph traversal.

**Verifiable:** Link Person A to Event B as "participant" (PROBABLE certainty), attach a Source as evidence. Link Person A to Person B as "colleague". View Person A's profile and see both relations in the Relations tab.

---

## Phase 3 — Research Context

> Goal: Multi-project workspaces, geographic context, secondary literature, and bulk import. The full research workflow.

### Epic 3.1 — Project & Collaboration Workspace

**Deliverable:** Multi-project workspaces with member management and project-scoped data isolation.

- Project CRUD: create, rename, describe, delete (soft-delete with 30-day recovery window)
- Project context: global project switcher in nav bar, all data queries scoped to active project
- Member management: invite by email, assign role (OWNER/EDITOR/VIEWER), remove member
- Permission enforcement: API middleware checks project membership and role before any data operation
- Project stats page: counts of persons, events, sources, relations; data completeness indicators
- Project-level RelationType management (from Epic 2.4 lives here in the settings panel)
- Project settings: name, description, default locale, custom event types, custom relation types
- API: full project and membership API set

**Note:** VIEWER role is read-only; EDITOR can CRUD all data entities; OWNER can additionally manage project settings and members.

**Verifiable:** Create two projects, invite a colleague as Editor to one, verify data isolation (entities in project A not visible in project B), verify VIEWER cannot create records.

---

### Epic 3.2 — Location System & Mapping

**Deliverable:** Normalized location database with geocoding and interactive Leaflet map.

- Location entity CRUD: name, normalized, country, region, city, lat/lng, geocoded_at
- Historical name normalization dictionary: Constantinople→Istanbul, Leningrad→Saint Petersburg, etc. (shipped as a configurable JSON file, extensible)
- Geocoding via Nominatim: forward + reverse; **durable Redis cache** (not in-memory); rate-limited queue (1 req/sec Nominatim policy); failed request tracking
- Location search with autocomplete in entity forms (replaces free-text location fields on Person/Event)
- Leaflet map view: plot all locations as pins; click pin to see linked entities; filter by entity type
- Temporal filter on map: slider to show "who/what was at this location in year X"
- Location management page: bulk geocoding trigger for un-geocoded locations, merge duplicate locations
- Person/Event: `location_id` FK (optional); free-text `location` field retained as fallback for un-geocoded data

**Verifiable:** Search "Vienna", get autocomplete, select it, it geocodes and shows on map with a pin. Temporal filter slider changes which pins are visible.

---

### Epic 3.3 — Literature & Bibliography

**Deliverable:** Secondary literature management with Zotero sync and RIS import.

- Literature entity CRUD: all bibliographic fields (title, author, year, type, publisher, journal, volume, issue, pages, DOI, ISBN, ISSN, language, keywords, abstract, url)
- Literature types: journal, book, chapter, thesis, conference, report, website, other
- Zotero integration: API key auth, optional collection filter, item type mapping, upsert by externalId+syncSource
- RIS file import: GenericImportService parsing RIS format, type mapping
- **No Mendeley:** Deprioritized due to declining academic adoption and OAuth complexity. Can be re-evaluated.
- Literature detail page: full bibliographic display, related relations (any relation where this literature was cited — via a `LiteratureEvidence` extension to the relation evidence model)
- Citation export per entry: Chicago, BibTeX format (foundation for Phase 5 full export)
- Last synced timestamp, sync metadata display

**Verifiable:** Connect Zotero API key, sync a collection, see entries appear in literature list. Import a RIS file. Export a single entry as BibTeX.

---

### Epic 3.4 — Import System

**Deliverable:** Bulk data import for persons and events from CSV and XLSX, with preview, validation, and history.

- Supported formats: CSV (PapaParse), XLSX (ExcelJS)
- Person import: maps columns to Person fields; fuzzy date parsing ("c. 1850", "1790?", "before 1900", DD/MM/YYYY); place normalization; name variant detection
- Event import: title, description, date, end_date, location, event_type (matched to project's event types or created)
- **Import preview:** Before committing, show parsed records with validation warnings and uncertainty flags
- **Duplicate detection:** Levenshtein similarity for names + date comparison; show potential duplicates with confidence; user decides merge/skip/import
- Import history: per-project log of imports (file, date, record counts, errors, batch_id)
- Imported records tagged: `created_via_import: true`, `import_batch_id`
- **Async processing:** Long imports run in background (Vercel background functions or queue); polling endpoint for status
- Column mapper UI: drag-and-drop or dropdown column assignment before import

**Verifiable:** Upload a CSV of 100 persons, preview parsed data, see duplicate warnings, confirm import, check import history, see persons in list.

---

## Phase 4 — Discovery & Intelligence

> Goal: Make the data speak. Visualization, search, and analytical insight.

### Epic 4.1 — Cross-Entity Search & Full-Text Discovery

**Deliverable:** A single search box that searches across all entity types simultaneously, with faceted filtering.

- Search endpoint: `GET /api/search?q=&types=&project_id=`
- PostgreSQL full-text search (`tsvector`/`tsquery`) on: Person names + notes, Event titles + descriptions, Source titles + notes, Location names, Literature titles + keywords + abstracts
- Unified search results page: grouped by entity type, relevance ranked
- Faceted filter sidebar: filter results by entity type, date range, location, certainty level
- Autocomplete: per-entity type search in relation form dropdowns
- "Connected to X" exploration: from any entity detail page, see all entities within 1-2 relation hops

**Verifiable:** Search "Vienna 1848", get persons born there, events that occurred there, sources about it — all in one results page.

---

### Epic 4.2 — Timeline Visualization

**Deliverable:** Interactive chronological timeline of events with person life spans.

- Event timeline: events plotted on horizontal time axis; grouped by event type (color-coded); zoom in/out
- Person life spans: optionally overlay person birth-death ranges as bands beneath events
- Filter controls: by event type, by person (show only events linked to selected persons), by location, by date range
- Uncertainty display: events with uncertain dates shown with a fuzzy range indicator
- Click event → open event detail panel (side panel, no navigation)
- Click person band → open person detail panel
- Export: timeline as PNG/SVG (Phase 5 delivers full export, this Epic delivers visual; export hook designed in)

**Verifiable:** Project with 20+ events renders timeline, zoom to decade level, filter to show only events linked to one person, click an event and see detail panel.

---

### Epic 4.3 — Network Graph Visualization

**Deliverable:** Interactive force-directed graph of the universal relation model.

- Library: D3.js force simulation or Cytoscape.js (TBD in refinement based on performance needs)
- Nodes: Person (circle), Event (diamond), Source (square), Location (pin) — visually distinct by shape and color
- Edges: labeled with relation type; thickness or color encodes certainty
- Filter panel: filter by entity types to show, relation types to show, minimum certainty level
- Click node → open entity detail side panel
- Expand/collapse node neighborhood (click to reveal connected nodes up to N hops)
- Zoom, pan, drag nodes to rearrange
- Layout options: force-directed, hierarchical, circular
- Graph data endpoint: `GET /api/graph?project_id=&depth=` returns nodes + edges in a graph-compatible format (designed to be reusable for GEXF export in Phase 5)

**Verifiable:** Project with 30+ entities and 50+ relations renders as a navigable graph. Filter to show only Person nodes and family relation types. Click a node and see the detail panel.

---

### Epic 4.4 — Analytics Dashboard & Activity Feed

**Deliverable:** A meaningful project dashboard showing research state and real activity.

- **Real activity log:** Track CRUD actions on all entities (not auth events). Table: `activity_log` with: user_id, project_id, action (CREATE/UPDATE/DELETE), entity_type, entity_id, entity_label, timestamp. Displayed as "You added Person 'Karl Maier' 2 hours ago."
- Dashboard cards (meaningful, not just counts):
  - "Persons with uncertain birth dates" (actionable)
  - "Unconnected entities" (persons/events with 0 relations — data gaps)
  - "Sources with no evidence links" (orphaned sources)
  - "Recent additions this week" (bar chart)
  - Entity type distribution (pie chart)
- Charts: shadcn/ui compatible chart library (Recharts or Tremor — TBD in refinement)
- Per-project stats endpoint: `GET /api/projects/[id]/stats` — extended to return research quality metrics
- Quick-create shortcuts on dashboard (add person, add event, add relation)

**Verifiable:** Perform 5 CRUD actions across entities; activity feed updates correctly. "Unconnected entities" card shows accurate count. Charts render.

---

## Phase 5 — Export, Quality & Production

> Goal: Complete the research tool, harden for production, reach 80% test coverage.

### Epic 5.1 — Export System

**Deliverable:** Export research data in formats usable outside the app.

- **Person/Event export:** CSV and JSON; filterable (export only filtered results, or entire project)
- **Source/Literature export:** RIS format, BibTeX format
- **Relations export:** JSON-LD (Linked Data) and CSV adjacency list
- **Network graph export:** GEXF format (Gephi-compatible) — uses graph endpoint from Epic 4.3
- **Project export bundle:** ZIP containing all of the above for a full project backup
- Export UI: triggered from list views ("Export CSV") and from project settings ("Export Project")
- Async for large exports: Vercel background function generates and uploads to temporary URL; user gets download link
- API: `POST /api/export` with entity type, format, filter params

**Verifiable:** Export 500 persons as CSV, open in Excel. Export literature list as BibTeX, import in Zotero. Export network graph, open in Gephi.

---

### Epic 5.2 — Data Quality & Uncertainty Management

**Deliverable:** Tools for ongoing data quality: duplicate management, uncertainty review, bulk operations.

- **Duplicate detection:** Run on demand (not only at import time) for manually-entered persons and events. Levenshtein + date matching. Results in a review queue.
- **Uncertainty review queue:** List of all records with `UNKNOWN` or `POSSIBLE` certainty. Link to edit. Bulk "mark as reviewed" action.
- **Bulk operations:** Bulk update certainty, bulk assign event type, bulk assign to location
- **Orphan report:** Entities with no relations; sources not attached as evidence to any relation
- **Data completeness score:** Per project, per entity type — percentage of required fields filled

**Verifiable:** Import 50 persons with duplicates, run duplicate detection, resolve duplicates in the review queue. View orphan report.

---

### Epic 5.3 — Internationalization & UI Polish

**Deliverable:** Complete German + English localization, locale switcher, polished UI.

- All strings externalized to `messages/de.json` and `messages/en.json`
- Date formatting per locale (de-DE, en-US) via `Intl.DateTimeFormat`
- Number formatting per locale
- Relation type default seeds available in both languages
- Locale switcher: persisted in user profile settings
- UI polish pass: consistent spacing, typography scale, empty states, loading skeletons, error states on all pages
- Accessibility pass: ARIA labels, keyboard navigation, focus management
- All Zod validation messages externalized (no hardcoded German strings in code)
- Language/Locale Persistence in Account

**Verifiable:** Switch locale to English, verify all UI text changes. Switch back to German. Date "15. März 1848" in DE, "March 15, 1848" in EN.

---

### Epic 5.4 — Testing, Security & Production Hardening

**Deliverable:** 80% test coverage, security audit completed, production monitoring in place.

- **Unit tests:** All utility functions, validation schemas, data transformation logic — target 90%+ on lib/utils
- **Integration tests:** All API routes with MSW mocking; auth flows; relation engine; import parser
- **E2E tests (Playwright):** Critical paths: register→verify→login, create person, create event, link relation, import CSV, export CSV, project invite flow
- **Security review:**
  - Remove any remaining test/debug routes
  - Verify rate limiting works under load
  - Verify Redis tokens not exposed
  - Input validation on all API route parameters
  - SQL injection: verify Prisma parameterization (should be safe by default)
  - Auth.js session fixation check
- **Monitoring:** Sentry (error tracking), Vercel Analytics (performance), custom `activity_log` as audit trail
- **Performance:** Bundle analysis, image optimization, lazy loading for graph visualization and maps
- **Documentation:** README with setup instructions, `.env.example` complete and documented
- **UI Library** Add Storybook

**Verifiable:** `npm run test:coverage` reports 80%+. Lighthouse score >85. Security headers grade A on securityheaders.com. Sentry catches and reports a test error.

---

## Summary

| Phase | Theme               | Epics   | Outcome                                            |
| ----- | ------------------- | ------- | -------------------------------------------------- |
| 1     | Foundation & Auth   | 1.1–1.4 | Secure, authenticated shell with infrastructure    |
| 2     | Core Research Loop  | 2.1–2.4 | MVP: persons, events, sources, universal relations |
| 3     | Research Context    | 3.1–3.4 | Projects, locations, literature, bulk import       |
| 4     | Discovery           | 4.1–4.4 | Search, timeline, network graph, analytics         |
| 5     | Export & Production | 5.1–5.4 | Export, data quality, i18n, 80% test coverage      |

**MVP for university validation = Phase 1 + Phase 2 complete.**
Phase 3 adds collaborative workspace and import, making it suitable for a research group.
Phases 4 and 5 make it a complete, production-ready product.

---

## Open Items for Epic Refinement

These questions should be resolved per-epic during refinement:

- **Graph visualization library:** D3.js vs. Cytoscape.js vs. React Flow — performance vs. API ergonomics trade-off
- **Chart library:** Recharts vs. Tremor vs. shadcn charts — to be decided in Epic 4.4 refinement
- **Async import processing:** Vercel background functions vs. Inngest vs. simple polling — depends on import volume expectations
- **PostgreSQL full-text vs. Meilisearch:** For Epic 4.1 — Postgres FTS is zero-dependency; Meilisearch gives better relevance for larger datasets
- **Person name variants:** JSON array on Person table vs. separate `PersonName` table — normalization trade-off
- **LiteratureEvidence:** Extend RelationEvidence to support Literature (not just Source) as evidence — evaluate in Epic 3.3 refinement
