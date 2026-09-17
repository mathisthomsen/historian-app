# Evidoxa Rebuild — Roadmap

> Full clean-slate rebuild. No data migration required. Target: university MVP validation → future SaaS commercialization. Highly complex data, easy to handle with a great UI, because the UX Concept keeps the complexity awy from the user.

---

## Strategic Decisions (locked)

All 18 locked strategic decisions — the original 12 plus the 6 AX/agentic-layer
additions — live in one place: [`docs/strategy/decisions.md`](./decisions.md),
with each decision's source document recorded.

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

> **TODO(content-pass):** "Jest 30 + jest-environment-jsdom" does not describe the
> repository. Unit tests run on Vitest (`vitest.config.ts`, `src/test/`) and there is no
> Jest dependency in `package.json`.

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

> **TODO(content-pass):** `src/auth.ts` registers the Credentials provider only. No Email
> / magic-link provider is configured, although Resend does send the custom verification
> and password-reset token emails.

**Verifiable:** Register → verify email → login → see dashboard shell → logout cycle works end-to-end in browser.

---

### Epic 1.4 — Security Infrastructure & CI/CD

**Deliverable:** Production-grade security primitives and automated deployment pipeline.

- **Upstash Redis** (Vercel KV compatible): sliding-window rate limiter middleware (configurable per-route limits), durable across all serverless instances.
  **Note (from Epic 1.3):** The `RateLimiter` abstraction is defined in Epic 1.3 at `src/lib/rate-limit.ts` with an in-process `lru-cache` shim. Epic 1.4 must replace `createLruRateLimiter()` with `createRedisRateLimiter()` (Upstash sliding-window), keeping the same `RateLimiter` interface (`check(key, limit, windowMs): Promise<RateLimitResult>`). Auth route code must not change. Rate limit values per auth route are locked in Epic 1.3 and remain unchanged.
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

- Person list: DataTable (shadcn Table + server-side pagination, search, column sort) — SSR, URL-param driven
- Create/Edit form: react-hook-form + Zod, all fields with German + English labels (i18n)
- Fields:
  - `first_name`, `last_name` — direct columns, canonical display name
  - **Partial dates** — `birth_year / birth_month / birth_day` (Int, all nullable; year-only and year+month are valid). `birth_date_certainty` (four-state enum). Same triple for death. No DateTime field — dates are stored as integer components to support historical partial dates.
  - `birth_place`, `death_place` — free text. Location FK (`birth_location_id`, `death_location_id`) is wired in Epic 3.2 only.
  - `notes`
  - **Name variants** — managed via the separate `PersonName` table (`name`, `language: ISO 639-1`, `is_primary`). Not a JSON array. In-form dynamic rows: add/remove name variants, mark one as primary, set language code. Searched alongside first_name/last_name.
- Person detail page: all attributes, name variants tab, tabs for related events/persons/sources. **Relations tab content is placeholder text in this epic; full content populated by Epic 2.4.**
- Bulk delete (checkbox selection + confirm dialog)
- Server-side search: first_name, last_name, and PersonName.name records (case-insensitive ILIKE JOIN). PostgreSQL `tsvector` upgrade deferred to Epic 4.1.
- API: `GET/POST /api/persons`, `GET/PUT/DELETE /api/persons/[id]`, `POST /api/persons/bulk`
- Redis cache for list queries; cache invalidated on write
- Uncertainty UI: four-state selector component (Certain / Probable / Possible / Unknown) reusable across entities
- **Soft-delete Prisma extension:** Add a Prisma client extension to `src/lib/db.ts` that transparently filters `deleted_at: null` on `findMany`/`findFirst` for Person (and stubs for Event, Source, Relation). This is the extension referenced in the Epic 2.2 soft-delete note — implemented here as the first entity with soft-delete exposed in the UI.
- **Output sanitization:** Replace the `sanitize()` stub from Epic 1.4 with `sanitize-html` library. Apply at all DB write boundaries for text fields. (Epic 1.4 ships a thin strip-tags stub; this epic upgrades it.)
- **Temporary project scope scaffold:** Since the multi-project workspace UI is Epic 3.1, a default project (user's first OWNER/EDITOR project) is derived from the session JWT. All API routes read `projectId` from the session. This scaffold is replaced by the project switcher in Epic 3.1.

**Verifiable:** Create a person with uncertain partial birth date (year + month only), add a Latin name variant, view profile, edit, search by name variant, bulk delete.

---

### Epic 2.2 — Event Management

**Deliverable:** Full CRUD for events with hierarchical sub-events, date uncertainty, and location fields.

- Event list: DataTable with search, filter by type, date range, location; server-side pagination
- Create/Edit form: title, description, event_type (FK to EventType table), start_date + certainty, end_date + certainty, location (free text + optional geocoded Location FK), parent event (for sub-events)
- **EventType table:** `EventType` is a proper DB table per project (`id, project_id, name, color, icon`). Epic 2.2 creates this table via migration and exposes CRUD for event types in project settings. The `event_type` column on `Event` is currently a free-text String in the schema stub; this epic adds the FK and migrates it.
- Event types: user-defined per project — no hardcoded types. Seeded defaults provided (Battle, Treaty, Birth, Death, etc.).
- Sub-event display: indented in list view; breadcrumb chain in detail view
- Event detail page: all attributes, sub-events list, related persons tab, related sources tab
- Date uncertainty: same four-state selector; display hints in list ("c. 1850", "before 1900")
- API: `GET/POST /api/events`, `GET/PUT/DELETE /api/events/[id]`, `POST /api/events/bulk`

**Soft delete note**
The Prisma client extension that auto-filters `deleted_at: null` is implemented in Epic 2.1
(the first entity with soft-delete exposed in the UI). Epic 2.2 extends the same extension to
cover the `event` model — no boilerplate needed here.

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
- **Entity relation tabs:** Each entity detail page (Person, Event, Source) has a "Relations" tab listing all relations where that entity is a participant. (Epics 2.1, 2.2, and 2.3 render these tabs as placeholders; this epic populates them for all three entity types.)
- **PropertyEvidence UI:** Attach a Source as evidence for a specific property value on any entity (e.g., "Source X supports birth_year=1848 for Person Y"). UI surfaces on entity detail pages as a secondary annotation alongside each field. Uses the `PropertyEvidence` table (already in schema). Exposes: add evidence for a property, view all evidence for a property, remove evidence.
- **Relation detail/edit/delete:** Inline in list or modal.
- API: `GET/POST /api/relations`, `GET/PUT/DELETE /api/relations/[id]`, `GET/POST/DELETE /api/relations/[id]/evidence`, `GET/POST/DELETE /api/property-evidence`

**Key design constraint:** The relation model must be queryable efficiently. Add composite index on `(from_type, from_id)` and `(to_type, to_id)`. Prisma raw queries may be needed for complex graph traversal.

**Verifiable:** Link Person A to Event B as "participant" (PROBABLE certainty), attach a Source as evidence. Link Person A to Person B as "colleague". View Person A's profile and see both relations in the Relations tab.

#### Agentic layer

> Base scope unchanged. Add the following AX-ready requirements:

**AX Addition — PropertyEvidence Schema Upgrade:**

- `PropertyEvidence` erhält `confidence Certainty @default(UNKNOWN)` — in Epic 2.4 umgesetzt
- `PropertyEvidence` erhält `quote String?` (normalisiertes Zitat) — in Epic 2.4 umgesetzt
- `PropertyEvidence` erhält `raw_transcription String?` (diplomatische Transkription, verbatim) — in Epic 2.4 umgesetzt
- `PropertyEvidence` erhält `source_scan_region String?` (JSON: `{page, x, y, w, h}`)
  — Grundlage für das Source-First-Pixel-Anchoring-Prinzip
  — auf Epic 6.3 verschoben (hat keine Konsumenten bis der PDF-Viewer gebaut wird)

**AX Addition — EntityActivity Log (vorgezogen aus Epic 4.4):**

- Neues Modell `EntityActivity` (append-only) wird in Epic 2.4 eingeführt:

  ```prisma
  model EntityActivity {
    id           String     @id @default(cuid())
    project_id   String
    entity_type  EntityType
    entity_id    String
    user_id      String?    // null wenn Agent
    agent_name   String?    // null wenn Mensch
    action       String     // CREATE | UPDATE | DELETE | MERGE | SUGGEST | ACCEPT | REJECT
    field_path   String?    // z.B. "birth_year"
    old_value    Json?
    new_value    Json?
    reason       String?
    source_id    String?    // Grounding-Referenz
    created_at   DateTime   @default(now())

    project      Project    @relation(fields: [project_id], references: [id])
    user         User?      @relation(fields: [user_id], references: [id])
  }
  ```

- API: `GET /api/entities/[type]/[id]/activity` (read-only; no DELETE endpoint)

---

### Epic 2.5 — UI Polish & Brand Tokens

**Deliverable:** A visually cohesive, transition-polished UI with a defined brand token foundation — ready for alpha testing.

**Depends on:** All Phase 2 feature epics (2.1–2.4) complete. Brand direction agreed before implementation.

- **Brand tokens in `@theme`:** Define CSS custom properties for primary/secondary/accent colors, typography scale (font family, size, weight), border-radius, and shadow levels. All existing components reference these tokens instead of raw Tailwind values.
- **Dark/light mode transitions:** Smooth `transition: color, background-color, border-color` on `:root` / theme classes — eliminates harsh flash when toggling.
- **Sidebar collapse animation:** CSS `width` or `translate` transition on the sidebar panel; icon-only state animates smoothly.
- **Page transitions:** Subtle fade or slide transition between routes using Next.js App Router layout animations (or a lightweight wrapper).
- **Component consistency pass:** Verify spacing, border-radius, and shadow tokens are applied uniformly across all Phase 2 pages.
- **Empty states & loading skeletons:** Ensure every list/detail page has a designed empty state and skeleton — no raw spinners.
- **DataTable column visibility:** Add show/hide column toggle to the DataTable component (all list views: Persons, Events, Sources, Relations). Each user's visible-column preference persisted in `localStorage` per table key.

**Note:** This epic does _not_ include marketing/public-facing pages (see Epic 2.6). It focuses exclusively on the authenticated app shell and its components.

**Verifiable:** Toggle dark/light mode — transition is smooth, no flash. Collapse/expand sidebar — animation is smooth. Navigate between Person list and detail page — transition is visible. All pages use brand colors.

---

### Epic 2.6 — Marketing & Pre-Auth Pages

**Deliverable:** Public-facing marketing pages (Homepage, Features, About, etc.) using the brand tokens established in Epic 2.5.

**Depends on:** Epic 2.5 (brand tokens must be in place before building marketing pages).

**Target:** Beta/public launch — not required for internal alpha.

- **Pages:** Homepage (`/`), Features, About, Pricing (if applicable), Privacy Policy, Terms of Service
- **Layout:** Dedicated marketing layout (distinct from AppShell) — full-width, hero sections, no sidebar
- **SEO:** `<title>`, `<meta description>`, Open Graph tags & schema.org, structured data on key pages
- **Navigation:** Public nav bar with login/register CTA; footer with links
- **Copy & design:** Requires brand direction and copy to be finalized before development
- **i18n:** All pages fully translated (de + en)
- **Performance:** Static generation (`generateStaticParams` / no dynamic rendering where possible); images optimized

**Note:** Auth pages (`/auth/login`, `/auth/register`, etc.) are already implemented. This epic adds the _pre-auth_ marketing funnel pages only.

> **TODO(content-pass):** the implemented scope is narrower than this list. See
> `docs/specs/2-6-marketing-landing/specification.md`: one landing page, a changelog page
> and the two legally required pages shipped; Features, About and Pricing are deferred,
> and a closed-alpha invite-token flow that this text does not mention was added.

**Verifiable:** Homepage renders with brand styling, hero CTA navigates to `/de/auth/register`, all text available in DE and EN, Lighthouse score >90 on public pages.

---

## Phase 3 — Research Context

> Goal: Multi-project workspaces, geographic context, secondary literature, and bulk import. The full research workflow.

### Epic 3.1 — Project & Collaboration Workspace

**Deliverable:** Multi-project workspaces with member management and project-scoped data isolation.

- Project CRUD: create, rename, describe, delete (soft-delete with 30-day recovery window)
- Project context: global project switcher in nav bar, all data queries scoped to active project. **Replaces the temporary default-project scaffold introduced in Epic 2.1** (where projectId was derived from the session JWT as a stopgap).
- Member management: invite by email, assign role (OWNER/EDITOR/VIEWER), remove member
- Permission enforcement: API middleware checks project membership and role before any data operation
- Project stats page: counts of persons, events, sources, relations; data completeness indicators
- Project-level RelationType management (from Epic 2.4 lives here in the settings panel)
- Project settings: name, description, default locale, custom event types, custom relation types. **Note:** A basic `/settings/event-types` CRUD page is scaffolded in Epic 2.2 (the first settings page). Epic 3.1 integrates it into the full project settings panel and adds the project switcher context. The sidebar settings navigation pattern (settings items visually separated at the bottom of the sidebar, divided from primary data navigation) is also established in Epic 2.2.
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
- **Wire Location FKs on Person and Event:** Person gets `birth_location_id` and `death_location_id` wired to a Location autocomplete in the edit form (previously free-text only in Epic 2.1). Event gets `location_id` wired similarly. Free-text fallback fields (`birth_place`, `death_place`, `location`) are retained and pre-populated from the linked Location name when set.

**Verifiable:** Search "Vienna", get autocomplete, select it, it geocodes and shows on map with a pin. Temporal filter slider changes which pins are visible.

#### Agentic layer

> Base scope unchanged. AX Addition:

- Location-Geocoding via Nominatim wird als erste "agentic action" modelliert:
  - Geocoding result wird als `AgentSuggestion` (type: GEO_RESOLVE) gespeichert
  - Historiker bestätigt oder korrigiert lat/lng vor dem DB-Write
  - Precedent für das Suggestion-Pattern aller späteren Agenten

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

#### Agentic layer

> Base scope unchanged. AX Additions:

- Import-provenance erweitern: `created_via: IMPORT`, `import_batch_id` (bestehend) +
  `agent_name: "ImportAgent v{version}"` → vollständige Traceability
- Duplicate detection in Import nutzt `AgentSuggestion` (type: POTENTIAL_DUPLICATE)
  statt direktem Merge — Historiker entscheidet im Review-Queue

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

#### Agentic layer

> Uncertainty display (fuzzy range) ist bereits AX-kompatibel.

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

#### Agentic layer

> Graph-Daten (`/api/graph`) werden AX-Layer-3-Chat als Kontext-Endpoint dienen.

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

> **TODO(content-pass):** the activity log was pulled forward into Epic 2.4 and exists as
> the `EntityActivity` model, mapped to the table `entity_activity` — not `activity_log`
> as written above.

**Verifiable:** Perform 5 CRUD actions across entities; activity feed updates correctly. "Unconnected entities" card shows accurate count. Charts render.

#### Agentic layer

> AX-Upgrade: Der "Real Activity Log" ist in Epic 2.4 als `EntityActivity` vorgezogen.
> Epic 4.4 nutzt diesen Log für das Dashboard.
> Zusätzlich: Dashboard-Karten für AX-Metriken:

- "Offene Agent-Vorschläge" (AgentSuggestion.status = PENDING)
- "Abgelehnte Vorschläge diese Woche" (Feedback-Signal für Agent-Tuning)
- "Daten-Konflikte offen" (DataConflict.is_resolved = false)

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

#### Agentic layer

> GEXF-Export enthält `created_via` und `agent_name` als Knoten-Attribute für
> nachgelagerte Analyse.

---

### Epic 5.2 — Data Quality & Uncertainty Management

**Deliverable:** Tools for ongoing data quality: duplicate management, uncertainty review, bulk operations.

- **Duplicate detection:** Run on demand (not only at import time) for manually-entered persons and events. Levenshtein + date matching. Results in a review queue.
- **Uncertainty review queue:** List of all records with `UNKNOWN` or `POSSIBLE` certainty. Link to edit. Bulk "mark as reviewed" action.
- **Bulk operations:** Bulk update certainty, bulk assign event type, bulk assign to location
- **Orphan report:** Entities with no relations; sources not attached as evidence to any relation
- **Data completeness score:** Per project, per entity type — percentage of required fields filled

**Verifiable:** Import 50 persons with duplicates, run duplicate detection, resolve duplicates in the review queue. View orphan report.

#### Agentic layer

> AX-Upgrade: Uncertainty Review Queue integriert AgentSuggestion-Workflow:

- "Ungewisse Felder" (UNKNOWN/POSSIBLE certainty) erhalten automatisch einen
  AgentSuggestion-Trigger (passiv, nicht automatisch ausgeführt)
- Duplicate Detection läuft als AgentSuggestion (POTENTIAL_DUPLICATE), nie als
  direktes Merge
- Orphan Report: "Quellen ohne Evidence-Verknüpfung" → Trigger für Source-First-Hinweis

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
- **Advice from previous implementation:** Du hast style-src 'unsafe-inline' wegen Tailwind v4 erlaubt. Hinweis: Das ist für die Entwicklung notwendig. Sobald die App stabil läuft (Phase 5), solltest du auf Nonces umstellen, um CSS-Injections komplett zu unterbinden.

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

> **TODO(content-pass):** the package manager is pnpm, not npm. The script exists as
> `pnpm test:coverage`.

**Verifiable:** `npm run test:coverage` reports 80%+. Lighthouse score >85. Security headers grade A on securityheaders.com. Sentry catches and reports a test error.

#### Agentic layer

> Agent-API erhält eigenen Security-Review-Checkpoint.

---

## Phase 6 — Agentic Experience (AX)

> Core principle: The AI is a **Transparent Research Assistant**, never an author.
> Every agent claim must be grounded in an existing Source record. Historians retain
> full data sovereignty at all times.

> Goal: Den manuellen Forschungsworkflow um einen transparenten KI-Assistenten
> erweitern, der Historiker unterstützt ohne Datenhoheit zu übernehmen.
> Nutzerbasis: KI-skeptische Historiker. Jede KI-Ausgabe ist ein Vorschlag,
> kein Fakt. Jeder Vorschlag muss mit einer Primärquelle belegt sein.

---

### Epic 6.0 — AX Infrastructure (Schema & API Foundation)

**Deliverable:** DB-Schema und API-Schicht, die Agenten-Aktionen von manuellen
Aktionen sauber trennt. Keine UI-Änderungen in diesem Epic.

#### Schema-Erweiterungen (neue Migration)

```prisma
// 1. created_via auf allen Forschungs-Entitäten
enum CreatedVia { MANUAL IMPORT AGENT }

// Felder hinzufügen zu: Person, Event, Source, Relation
created_via      CreatedVia @default(MANUAL)
agent_name       String?    // z.B. "DeduplicatorAgent v1.2"
agent_confidence Float?     // 0.0–1.0; null wenn MANUAL

// 2. AgentSuggestion — Kernmodell des AX-Systems
enum SuggestionType {
  FILL_MISSING        // fehlende Felder ergänzen
  POTENTIAL_DUPLICATE // mögliche Duplikate
  DATE_INCONSISTENCY  // Datumsinkonsistenz
  RELATION_INFERENCE  // neue Relation vorschlagen
  GEO_RESOLVE         // Ortsname → Koordinaten
  SOURCE_LINK         // Vorhandene Quelle verknüpfen
}

enum SuggestionStatus { PENDING ACCEPTED REJECTED SUPERSEDED }

model AgentSuggestion {
  id                 String           @id @default(cuid())
  project_id         String
  entity_type        EntityType
  entity_id          String
  agent_name         String           // z.B. "GapFillerAgent v1.0"
  agent_version      String?          // z.B. "1.2.3" — für wissenschaftliche Reproduzierbarkeit
  system_prompt_hash String?          // SHA-256 des verwendeten System-Prompts — Reproduzierbarkeit
  suggestion_type    SuggestionType
  field_path         String?          // betroffenes Feld, z.B. "birth_year"
  suggested_value    Json?            // vorgeschlagener Wert
  confidence         Float            // 0.0–0.95 (API-seitig gecappt)
  reasoning          String           // NICHT NULL, mind. 50 Zeichen
  source_ids         String[]         // PFLICHT: ≥1 Source.id — Grounding-Zwang
  status             SuggestionStatus @default(PENDING)
  reviewed_by_id     String?
  reviewed_at        DateTime?
  review_note        String?
  created_at         DateTime         @default(now())

  project            Project          @relation(fields: [project_id], references: [id])
  reviewer           User?            @relation(fields: [reviewed_by_id], references: [id])
}

// Hinweis: agent_version und system_prompt_hash wurden in Epic 2.4-Brainstorming
// identifiziert und gehören auf AgentSuggestion (nicht EntityActivity), da sie
// nur bei Agenten-Aktionen sinnvoll sind. EntityActivity-Einträge aus Epic 2.4
// sind ausschließlich menschliche Aktionen (user_id gesetzt, agent_name null).

// 3. DataConflict — automatisch erkannte Widersprüche zwischen Quellen
model DataConflict {
  id              String     @id @default(cuid())
  project_id      String
  entity_type     EntityType
  entity_id       String
  property        String     // betroffenes Feld
  source_ids      String[]   // widersprechende Quellen
  is_resolved     Boolean    @default(false)
  resolved_by_id  String?
  resolution_note String?
  created_at      DateTime   @default(now())
  resolved_at     DateTime?

  project         Project    @relation(fields: [project_id], references: [id])
  resolver        User?      @relation(fields: [resolved_by_id], references: [id])
}
```

#### Neue API-Endpunkte

| Endpoint                              | Methode | Beschreibung                                          |
| ------------------------------------- | ------- | ----------------------------------------------------- |
| `/api/agents/suggestions`             | GET     | Liste aller Vorschläge (filter: status, entity, type) |
| `/api/agents/suggestions`             | POST    | Agent reicht Vorschlag ein (Grounding-Check)          |
| `/api/agents/suggestions/[id]`        | PUT     | Historiker akzeptiert/lehnt ab                        |
| `/api/entities/[type]/[id]/activity`  | GET     | Provenance-Trail einer Entität                        |
| `/api/entities/[type]/[id]/conflicts` | GET     | Offene Datenkonflikte                                 |
| `/api/grounding/verify`               | POST    | Prüft: Unterstützt Source X Claim Y?                  |

#### Agentic Guardrails (API-Enforcement)

```
CONSTRAINT 1 — Kein direkter Write:
  Agent-API hat NUR POST /api/agents/suggestions.
  Kein PUT /api/persons/[id] für Agent-Auth-Token.

CONSTRAINT 2 — Grounding-Zwang:
  POST /api/agents/suggestions → 422 wenn source_ids.length === 0.

CONSTRAINT 3 — Confidence-Cap:
  suggested_value.confidence wird serverseitig auf Math.min(value, 0.95) gecappt.

CONSTRAINT 4 — Reasoning-Pflicht:
  AgentSuggestion.reasoning: NOT NULL, minLength: 50.

CONSTRAINT 5 — Source-Existenz-Check:
  Jede source_id in source_ids muss in Source-Tabelle existieren (App-layer FK-Check).

CONSTRAINT 6 — Rate Limiting per Agent:
  Max. 100 AgentSuggestions/Stunde/Projekt pro agent_name (Redis sliding window).

CONSTRAINT 7 — EntityActivity Immutabilität:
  Kein DELETE-Endpoint für /api/entities/[type]/[id]/activity.
  Prisma: Kein deleteMany auf EntityActivity.

CONSTRAINT 8 — Approval Gate:
  PENDING-Vorschläge werden in der UI als "Vorschlag" (nicht Fakt) gerendert.
  Nur ACCEPTED-Vorschläge fließen in Berechnungen ein.

CONSTRAINT 9 — User Override:
  Manuelle Bearbeitung durch Historiker überschreibt ACCEPTED-Vorschläge automatisch
  und loggt in EntityActivity: action = "USER_OVERRIDE".

CONSTRAINT 10 — Domain Scope Lock:
  suggested_value.field_path muss einem bekannten Prisma-Feld entsprechen.
  Freiformtext des Agenten geht nur in reasoning, nie in Entitätsfelder.
```

**Verifiable:** `POST /api/agents/suggestions` ohne `source_ids` → 422. Mit leerem
`reasoning` → 422. Mit confidence 0.99 → gespeichert als 0.95. Mit gültiger source_id
→ 201 Created, status = PENDING.

---

### Epic 6.1 — Layer 2: Collaborative UI (The Lego-Bricks)

**Deliverable:** Modulare UI-Komponenten, die Agent-Antworten visuell belegbar machen.
Kein neues Feature-Set — Ergänzung der bestehenden Detail- und Formular-Seiten.

#### Neue Komponenten (`src/components/ax/`)

**1. `<EvidenceStrip>`**

- Angehängt an jedes `<dt>/<dd>`-Paar in PersonDetailCard, EventDetailCard
- Zeigt: `[Quelltitel] S.42 · PROBABLE` (kompakt, aufklappbar)
- Aufgeklappt: Zitat-Text aus `PropertyEvidence.quote`, diplomatische Transkription aus
  `PropertyEvidence.raw_transcription` (falls vorhanden), Link zur Source-Detailseite
- Datenbasis: PropertyEvidence mit `.confidence`, `.quote`, `.raw_transcription` (alle in Epic 2.4 eingeführt)
- **Beweistyp-Kategorisierung (aus Epic 2.4-Brainstorming):** In diesem Epic wird ein strukturiertes
  JSON-Schema für die Kategorisierung von Beweistypen (Lexikalisch / Kontextuell / Statistisch)
  entworfen und in der `<EvidenceStrip>`-Darstellung umgesetzt. Das Schema wird als
  `PropertyEvidence.evidence_category Json?` in einer eigenen Migration hinzugefügt.
  Beispiel: `{ "type": "LEXICAL", "subtype": "DIRECT_MENTION" }` vs.
  `{ "type": "CONTEXTUAL", "subtype": "INFERENCE" }`.
  Dies wurde in Epic 2.4 zurückgestellt, da die UI-Anforderungen erst hier bekannt sind.
- i18n: de + en Labels

**2. `<ReasoningBox>`**

- Kollabierbare Box, deutlich als "KI-Vorschlag" markiert (Rahmen + Icon: Sparkles)
- Zeigt: agent_name, suggestion_type, reasoning (Volltext), confidence-Badge (% mit Farbe)
- Niemals direkt editierbar — nur ACCEPT / REJECT / "Zur Quelle" Buttons
- Erscheint in: PersonDetailTabs ("KI-Vorschläge"-Tab), EventDetailTabs

**3. `<AgentSuggestionCard>`**

- Karten-Komponente für jede AgentSuggestion im PENDING-Status
- Props: suggestion, onAccept, onReject
- Zeigt: suggested_value (formatiert), confidence als Farbbalken, reasoning (gekürzt → "mehr"),
  source_ids als CitationLink-Badges
- Accept → PUT /api/agents/suggestions/[id] {status: ACCEPTED, review_note?}
- Reject → PUT /api/agents/suggestions/[id] {status: REJECTED, review_note}

**4. `<ProvenanceBadge>`**

- Winziges Badge neben Form-Feld-Labels (in PersonForm, EventForm)
- Zeigt: Anzahl der PropertyEvidence für dieses Feld (z.B. "3 Quellen")
- Click → Popover mit EvidenceStrip-Inhalt
- Dient als Motivator für Source-First-Verhalten

**5. `<CitationLink>`**

- Inline-klickbarer Verweis, öffnet Source-Detail-Popover
- Props: sourceId, label, pageRef?
- Nutzung in: ReasoningBox, EvidenceStrip, AgentSuggestionCard

**6. `<ConflictWarning>`**

- Alert-Banner oberhalb betroffener Felder in Detail-Ansichten
- Erscheint wenn: DataConflict für diese Entität + property vorhanden
- Zeigt: "2 Quellen widersprechen sich bezüglich Geburtsjahr" + Auflösungs-Button

**7. `<ActivityTimeline>`**

- Chronologisches Log aller EntityActivity-Einträge für eine Entität
- Unterscheidet visuell: Mensch (User-Icon) vs. Agent (Sparkles-Icon) vs. Import (Upload-Icon)
- Neuer "Verlauf"-Tab in PersonDetailTabs, EventDetailTabs

#### Wo die Komponenten eingesetzt werden

| Komponente          | Detail-Seite              | Formular            | Liste |
| ------------------- | ------------------------- | ------------------- | ----- |
| EvidenceStrip       | dd/dt-Paare in DetailCard | —                   | —     |
| ReasoningBox        | "KI-Vorschläge"-Tab       | —                   | —     |
| AgentSuggestionCard | "KI-Vorschläge"-Tab       | —                   | —     |
| ProvenanceBadge     | —                         | Neben Labels        | —     |
| CitationLink        | Notes, Relations          | —                   | —     |
| ConflictWarning     | Oberhalb des Feldes       | Oberhalb des Feldes | —     |
| ActivityTimeline    | "Verlauf"-Tab             | —                   | —     |

#### DataTable-Erweiterungen

- Neue optionale Spalte: "Vollständigkeit" (% der Pflichtfelder + Evidence-Coverage)
- Row-level AX-Badge: Kreis-Icon wenn AgentSuggestion PENDING für diese Entität

**Verifiable:** Person mit PropertyEvidence → EvidenceStrip zeigt Quelle mit Seitenangabe.
AgentSuggestion PENDING → AgentSuggestionCard erscheint im KI-Vorschläge-Tab.
ACCEPT drücken → Status wechselt, EntityActivity-Eintrag sichtbar im Verlauf-Tab.

---

### Epic 6.2 — Layer 3: Scholarly Dialogue (The MVP Chat Interface)

**Deliverable:** Ein eingebetteter Forschungs-Chat, der Fragen über die Projektdaten
beantwortet, ausschließlich auf Basis belegter Quellen. Der Chat kann Vorschläge
einreichen (→ AgentSuggestion), aber niemals direkt schreiben.

#### Architektur

```
Historian → ChatPanel UI
             ↓ POST /api/chat/message {context, question, projectId}
           ChatRouter (Server)
             ↓ RAG: Suche Source + PropertyEvidence + EntityActivity
           Claude API (claude-sonnet-4-6)
             ↓ Structured response schema (Zod-validated):
           {
             answer: string,           // Antwort in Historiker-Sprache
             confidence: 0.0–0.95,     // Gesamtkonfidenz
             citations: [{             // PFLICHT
               sourceId: string,
               pageRef?: string,
               quote?: string
             }],
             suggestions: [{           // Optional: AgentSuggestion-Drafts
               entityType, entityId, fieldPath, suggestedValue,
               reasoning, confidence, sourceIds
             }]
           }
```

#### Chat-Kontext-Modi

| Modus        | Kontext                                | Trigger                              |
| ------------ | -------------------------------------- | ------------------------------------ |
| Entity-Chat  | Aktuelle Person/Event + ihre Evidence  | "KI-Chat"-Button auf Detailseite     |
| Project-Chat | Alle Entitäten + Sources des Projekts  | Sidebar-Icon / globaler Chat         |
| Source-Chat  | Spezifische Quelle + verlinktes Wissen | Source-Detailseite "Quelle befragen" |

#### RAG-Pipeline (Retrieval-Augmented Generation)

1. Frage → Embedding (text-embedding-3-small oder pgvector in PostgreSQL)
2. Vektor-Suche über Source.notes + PropertyEvidence.quote + EntityActivity.reason
3. Top-K-Treffer als Kontext-Fenster an Claude übergeben
4. Claude generiert Antwort **ausschließlich** aus dem Kontext (System-Prompt: Grounding-First)
5. Zod-Validierung des Response-Schemas — bei Validierungsfehler: Retry (max. 2×)

#### System-Prompt Template (nicht änderbar durch User)

```
Du bist ein historischer Forschungsassistent für die App Evidoxa.
REGELN:
1. Antworte NUR auf Basis der bereitgestellten Quellen.
2. Beginne JEDE Aussage mit einem Quellenverweis.
3. Wenn keine Quelle eine Aussage belegt, antworte: "Dazu liegen keine belegten Daten vor."
4. Formuliere Unsicherheit explizit: "Die Quelle deutet darauf hin, dass..."
5. Schlage keine Änderungen vor, die du nicht mit einer Source.id belegen kannst.
6. Halluziniere keine historischen Fakten.
```

#### Chat-UI-Komponenten

- `<ChatPanel>` — Collapsible right-side panel (400px), persistiert Status in localStorage
- `<ChatMessage>` — Einzelne Nachricht mit: Text, CitationLinks, confidence-Badge, "Vorschlag einreichen"-Button
- `<ChatContext>` — Zeigt aktiven Kontext-Modus (Entity-Name oder "Gesamtes Projekt")
- `<SuggestionDraft>` — Expandierbare Karte für vorgeschlagene AgentSuggestions aus dem Chat
  → Klick "Einreichen" → POST /api/agents/suggestions → erscheint in KI-Vorschläge-Tab

#### Neue API-Endpunkte

| Endpoint                       | Methode | Beschreibung                               |
| ------------------------------ | ------- | ------------------------------------------ |
| `/api/chat/message`            | POST    | Sendet Frage, erhält strukturierte Antwort |
| `/api/chat/history/[entityId]` | GET     | Gesprächshistorie pro Entität              |
| `/api/embeddings/reindex`      | POST    | Admin: pgvector-Index neu aufbauen         |

**Verifiable:** Frage "Wann wurde Person X geboren?" → Antwort mit Quelle und Seitenangabe.
Frage ohne belegte Antwort → "Dazu liegen keine belegten Daten vor." Vorschlag aus
Chat einreichen → erscheint in KI-Vorschläge-Tab als PENDING AgentSuggestion.

---

### Requirement-Check: Source-First-Prinzip

Das Source-First-Prinzip fordert: Jeder Datenpunkt muss direkt zu einem Pixel im
Quellen-Scan rückführbar sein.

#### Offene Schema- und Infrastruktur-Lücken

> **TODO(content-pass):** diese Lückenliste stammt aus März 2026. Die drei Schema-Zeilen
> wurden beim Zusammenführen der beiden Roadmaps gegen `prisma/schema.prisma` nachgeprüft
> und gelten weiterhin; die Zeilen zu PDF-Viewer, Blob-Storage und URL-Archivierung wurden
> nicht gegen `src/` geprüft.

| Lücke                                                   | Befund          | Adressiert in          |
| ------------------------------------------------------- | --------------- | ---------------------- |
| `Source.file_url` (Blob-URL für Scan-Upload)            | Fehlt im Schema | Epic 6.0 Schema        |
| `Source.file_hash` (SHA-256, Tampering-Schutz)          | Fehlt im Schema | Epic 6.0 Schema        |
| `PropertyEvidence.source_scan_region` (Pixel-Anchoring) | Fehlt im Schema | Epic 2.4 Agentic layer |
| PDF/Scan-Viewer mit Annotations-Support                 | Kein Plan       | Epic 6.3               |
| Blob-Storage-Integration (Vercel Blob / S3)             | Kein Plan       | Epic 6.3               |
| URL-Archivierung (Wayback Machine API)                  | Kein Plan       | Epic 6.3               |

---

### Epic 6.3 — Source Scan & Pixel Anchoring (Source-First MVP)

**Deliverable:** Scan-Upload für Primärquellen mit Regions-Annotation und
Direktverlinkung zu PropertyEvidence.

- File upload zu Vercel Blob: PDF, JPG, PNG — max. 50MB pro Datei
- PDF-Viewer (react-pdf oder pdf.js): inline Rendering
- Annotations-Tool: Benutzer markiert Textstelle → Region wird als JSON gespeichert
  `{page: 3, x: 120, y: 450, w: 800, h: 60}`
- `PropertyEvidence.source_scan_region` verknüpft Annotation mit Datenpunkt
- EvidenceStrip-Erweiterung: Klick auf Quelle → öffnet PDF-Viewer an der Seite +
  scrollt zu markierter Region
- `Source.file_hash` (SHA-256) wird bei Upload berechnet, dient als Integritätsnachweis

**Verifiable:** Scan hochladen, Zeile "geboren 1848" markieren, als Evidence für
Person.birth_year verknüpfen. EvidenceStrip auf Personendetailseite → klicken →
PDF öffnet sich auf S.12 mit hervorgehobener Region.

---

## Summary

| Phase | Theme               | Epics   | Outcome                                                                | Agentic layer                                                                                          |
| ----- | ------------------- | ------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| 1     | Foundation & Auth   | 1.1–1.4 | Secure, authenticated shell with infrastructure                        | Bestehend, unverändert                                                                                 |
| 2     | Core Research Loop  | 2.1–2.6 | MVP: persons, events, sources, relations + UI polish + marketing pages | Augmentiert: EntityActivity, PropertyEvidence.confidence, source_scan_region                           |
| 3     | Research Context    | 3.1–3.4 | Projects, locations, literature, bulk import                           | Augmentiert: Geocoding als AgentSuggestion, Import-Provenance                                          |
| 4     | Discovery           | 4.1–4.4 | Search, timeline, network graph, analytics                             | Augmentiert: AX-Dashboard-Karten                                                                       |
| 5     | Export & Production | 5.1–5.4 | Export, data quality, i18n, 80% test coverage                          | Augmentiert: created_via in Exports, AX-Security-Review                                                |
| 6     | Agentic Experience  | 6.0–6.3 | AX infrastructure, collaborative UI, scholarly chat, source-first      | Die Phase selbst _(editorial addition, not sourced from either original roadmap — TODO(content-pass))_ |

**MVP for university validation = Phase 1 + Phase 2 (including 2.5) complete.**
Phase 3 adds collaborative workspace and import, making it suitable for a research group.
Phases 4 and 5 make it a complete, production-ready product.

**AX-Alpha** = Epic 6.0 + 6.1 (Provenance-Infrastruktur + Lego-Bricks-UI).
**AX-Beta** = Epic 6.2 (Scholarly Chat) nach Historian-Feedback aus AX-Alpha.
**Source-First-Vollständigkeit** = Epic 6.3 (Scan-Upload + Pixel-Anchoring).

---

## History

Work that shipped without appearing in either predecessor roadmap. Recorded here so the
gap between the epic list and the repository is visible; progress against the epics
themselves is generated from GitHub milestones, not written down here.

### UI polish and brand tokens (Epic 2.5)

Shipped without a spec directory under `docs/specs/`. The work was carried out as the
design-system build-out and merged from `feat/epic-2-5-design-system` (PR #18, merge
commit `9700a9f`). Its documentation lives in `docs/design-system/` and
`docs/implementation/` rather than in a spec folder, which is why the epic has no
`docs/specs/2-5-*` counterpart.

### Cleanup workstreams

Four workstreams were specified and executed outside the epic numbering, each closing
gaps left by an epic that had already been declared done.

| Workstream        | Spec                                          | What was done                                                                                                                                           |
| ----------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `2-1_2-4 cleanup` | `docs/specs/2-1_2-4 cleanup/specification.md` | Person detail page: data-mapping bugs, unwired features, dialog pre-population, and activity-log accuracy across Epics 2.1 and 2.4 (commit `72d58ea`)   |
| `events-cleanup`  | `docs/specs/events-cleanup/specification.md`  | Event detail page brought to parity with the person detail page, including the shared `EntityEvidenceTab` generalisation (commits `d9cf0a4`, `7fcb8a1`) |
| `sources-cleanup` | `docs/specs/sources-cleanup/specification.md` | Source detail page brought to the same parity; depends on the `EntityEvidenceTab` generalisation from `events-cleanup` (commits `d9cf0a4`, `7fcb8a1`)   |
| `2-4-delta`       | `docs/specs/2-4-delta/gaps-by-epic.md`        | Gap analysis of Epics 1.1–2.4 against the running app, severity-rated, and the nine resulting fixes (commits `22066c8`, `a54fce9`)                      |

Epic 2.6 was also cut down on the way into implementation: `docs/specs/2-6-marketing-landing/specification.md`
ships one landing page, a changelog and the two legally required pages, and defers
Features, About and Pricing. See the content-pass marker on Epic 2.6.

---

## Open Items for Epic Refinement

These questions should be resolved per-epic during refinement:

- **Graph visualization library:** D3.js vs. Cytoscape.js vs. React Flow — performance vs. API ergonomics trade-off
- **Chart library:** Recharts vs. Tremor vs. shadcn charts — to be decided in Epic 4.4 refinement
- **Async import processing:** Vercel background functions vs. Inngest vs. simple polling — depends on import volume expectations
- **PostgreSQL full-text vs. Meilisearch:** For Epic 4.1 — Postgres FTS is zero-dependency; Meilisearch gives better relevance for larger datasets
- **Person name variants:** JSON array on Person table vs. separate `PersonName` table — normalization trade-off
- **LiteratureEvidence:** Extend RelationEvidence to support Literature (not just Source) as evidence — evaluate in Epic 3.3 refinement

> **TODO(content-pass):** "Person name variants: JSON array vs. separate `PersonName`
> table" is no longer open — the `PersonName` table exists in `prisma/schema.prisma`
> and Epic 2.1 shipped against it. Epic 1.2 above still states the same either/or.
