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
- Vitest 3 + React Testing Library + jsdom configured (`vitest.config.ts`, `src/test/setup.ts`)
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
  - `Relation` table: `id`, `project_id`, `created_by_id` (nullable, `onDelete: SetNull` — not `user_id`), `from_type` (enum), `from_id`, `to_type` (enum), `to_id`, `relation_type_id`, `notes`, `certainty` (enum: CERTAIN/PROBABLE/POSSIBLE/UNKNOWN), plus temporal-validity columns `valid_from_year`/`valid_from_month`/`valid_from_cert`, `valid_to_year`/`valid_to_month`/`valid_to_cert` (same year/month/certainty triple as Person and Event dates — relations are temporally bounded, not just entities), `created_at`, `updated_at`
  - `RelationType` table: `id`, `project_id`, `name`, `inverse_name`, `description`, `color`, `icon`, `valid_from_types` (array), `valid_to_types` (array)
  - `RelationEvidence` table: `id`, `relation_id`, `source_id`, `notes`, `page_reference`, `quote`, `confidence` (Certainty) — replaces SourceOnRelation
- Person attributes: **partial dates**, not a single `birth_date`/`death_date` field — `birth_year`/`birth_month`/`birth_day` and `death_year`/`death_month`/`death_day` (all nullable integers; year-only and year+month are valid), `birth_date_certainty`, `death_date_certainty`, plus `birth_place_certainty`/`death_place_certainty` — certainty applies separately to places, not only dates (see Epic 2.1 for the shipped model). Person name variants live in the separate `PersonName` table (`name`, `language`, `is_primary`) — not a JSON array; see Epic 2.1.
- `Event` likewise carries `location_certainty` alongside its free-text/FK location fields — certainty on place is a schema-wide pattern, not specific to Person.
- Naming convention: **snake_case throughout** — no mixed conventions
- Prisma migrate workflow (`prisma migrate dev` locally, `prisma migrate deploy` in CI)
- Database seed script with demo project, sample persons, events, and relations
- Neon PostgreSQL: pooled connection for serverless, unpooled for migrations

**Verifiable:** `prisma studio` shows schema; health check endpoint returns DB connection status and migration version.

---

### Epic 1.3 — Authentication & Authorization

**Deliverable:** Full auth flow: register, login, email verification, password reset, session management. All pages accessible in browser.

- Auth.js v5 with a Credentials provider (bcrypt). No Email / magic-link provider: Resend sends
  the custom verification and password-reset token emails instead (`src/lib/email.ts`).
- JWT session strategy, 30-day max age. No refresh-token rotation and no server-side
  revocation check exists — `signOut` only clears the browser cookie, so a captured token
  stays valid for its full lifetime after logout (issue #103, fixed in Epic 2.7).
- Email verification: custom token flow (EmailConfirmation table), 24h expiry, branded HTML emails via Resend
- Password reset: token flow (PasswordReset table), 1h expiry, single-use
- Password strength: min 8 chars, uppercase/lowercase/number/special char; strength indicator component
- Pages: `/auth/login`, `/auth/register`, `/auth/verify`, `/auth/forgot-password`, `/auth/reset-password`
- Middleware: `PUBLIC_PATHS` allow-list is defined in `src/auth.config.ts`, but its
  `authorized()` callback returns a boolean, which next-auth's dispatch only honours when
  it is a `Response` — so the allow-list has no runtime effect today (issue #88, fixed in
  Epic 2.7). Authenticated pages and API routes still self-protect via `requireUser()` /
  `requireUserOrRedirect()`, so no data is exposed; only the defence-in-depth layer is inert.
- `requireUser()` server helper for API route protection
- System roles: `USER`, `ADMIN` (UserRole enum)
- Project roles: `OWNER`, `EDITOR`, `VIEWER` (proper enum, not string)
- Auth audit log: LOGIN_SUCCESS, LOGIN_FAILED, REGISTER, PASSWORD_RESET, EMAIL_VERIFIED

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
- **EventType table:** `EventType` is a proper DB table per project (`id, project_id, name, color, icon`). Epic 2.2 creates this table via migration and exposes CRUD for event types in project settings. `Event.event_type_id` is the FK to `EventType` (migration `20260312000000_add_event_types`), replacing the earlier free-text `event_type` String.
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
- API: `GET/POST /api/sources`, `GET/PUT/DELETE /api/sources/[id]`, `POST /api/sources/bulk`

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
  — auf Epic 3.5 verschoben (hat keine Konsumenten bis der PDF-Viewer gebaut wird)

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
    action       ActivityAction // CREATE | UPDATE | DELETE | MERGE | SUGGEST | ACCEPT | REJECT
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

**Scope note (shipped incomplete):** Epic 2.5 is recorded as complete in `## History`
(PR #18, merge `9700a9f`), and every other bullet above did ship — brand tokens, dark/light
and page transitions, sidebar animation, and the empty-state/skeleton pass. The DataTable
column-visibility toggle did not: `grep -rniE "columnVisibility|toggleColumn|VisibilityState" src/`
returns no matches, and the only `localStorage` consumers in `src/` are `use-sidebar.ts` and
its test. This bullet remains open work, not delivered scope.

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

> **Scope note:** the implemented scope is narrower than this list. Epic 2.6 was split; Part A
> (issue #82, closed) shipped one landing page, a changelog page and the two legally required
> pages. Features, About and Pricing are deferred. Part B — the closed-alpha access-request and
> single-use invite-token flow specified in `docs/specs/2-6-marketing-landing/specification.md`
> §4.1–4.2 — has **not** shipped: there is no `Invite`/`AccessRequest` model in
> `prisma/schema.prisma`, no migration creates one, and `src/app/api/auth/register/route.ts`
> has no invite check (its own `token` code is the email-verification mechanism, not a gate).
> **Registration is open to the public today.** Tracked as issue #29 (open).

**Verifiable:** Homepage renders with brand styling, hero CTA navigates to `/de/auth/register`, all text available in DE and EN, Lighthouse score >90 on public pages.

---

### Epic 2.7 — Session & Authorization Hardening

**Deliverable:** Session invalidation and route-level authorization actually take effect at
runtime, closing the gap between what Epic 1.3 documents and what the middleware and session
strategy enforce today. Added to the roadmap during the September 2026 grooming pass: the
product is live and public (Epic 2.6), and these are three `priority: high` defects on it.

**Depends on:** Epic 1.3 (Auth.js configuration) and Epic 1.4 (Redis). No new external
dependency.

> **Disclosure note.** This repository is public and this document is published. The defects
> below are described by class and by fix, not by reproduction. Step-by-step reproductions
> live in the private security advisories; do not copy them back into this file.

- **Server-side session invalidation on logout (issue #103):** Under the JWT strategy,
  `signOut` clears the cookie client-side but nothing server-side refuses a token that was
  captured beforehand, so it stays valid for the remainder of its `maxAge`. Confirmed by
  measurement against a production build on 2026-09-13; the reproduction is recorded in the
  private security advisory rather than here, because this document is published.
  Fix: a Redis-backed revocation check (denylist of revoked session/`jti` ids, checked in the
  `session` callback) so a replayed pre-logout token is rejected.
- **Make `authorized()` actually gate requests (issue #88):** per next-auth's dispatch logic
  the `authorized()` callback's return value is only honoured when it is a `Response`; the
  boolean `src/auth.config.ts` returns today is silently ignored, so `PUBLIC_PATHS` is dead
  code with no runtime effect. **No user data leaks** — `requireUserOrRedirect()` and the API
  routes' own guards still hold the line — but a future page that forgets its own guard would
  have nothing behind it. Fix: return a `Response` (redirect) from `authorized()` for
  unauthenticated requests to non-public paths, and add a test asserting a real HTTP redirect
  for an anonymous request to a protected route.
- **Root-cause TC-AUTH-13 (issue #27):** The logout E2E test flaked once in CI, showing a
  fully authenticated dashboard render immediately after `signOut` had already navigated to
  `/auth/login`. Not yet root-caused — deliberately filed rather than dismissed as a fluke,
  because the failure is indistinguishable from a session surviving logout. The leading
  theory is the same client-side-meta-refresh mechanism as #88 (an anonymous request briefly
  rendering authenticated chrome before the refresh fires); confirm this explicitly once #88
  is fixed rather than assuming it resolved as a side effect, since the alternative reading
  (a session that outlives `signOut`) is the more serious one.
- **Auth.js session fixation check:** carried over from Epic 5.4's security review — a
  distinct control from the three defects above (regenerating the session identifier after
  authentication, not logout invalidation or route gating). Verify next-auth issues a fresh
  session/JWT on login rather than reusing a pre-authentication one, so a session id set
  before login cannot be fixed and ridden through it. Grouped here because it is another
  session-hardening item being worked ahead of Phase 3 on a live product, not because it is
  related to #103/#88/#27.
- **Regression coverage:** an E2E test that captures a session token, calls `signOut`, and
  replays the captured token — asserting `401`, not `200` — as a permanent guard against #103
  recurring.

**Verifiable:** Replay a session token captured before logout — `401`, not `200`. Anonymous
request to `/dashboard` — a real HTTP redirect to `/auth/login`, not a `200` with a
client-side meta-refresh. TC-AUTH-13 passes 20/20 consecutive CI runs. A session id captured
before login is invalid after it (fixation check).

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
- **Wire Location FKs on Person and Event:** the `birth_location_id`/`death_location_id` columns on Person and the `location` relation on Event already exist in the schema (added ahead of this epic, with their indexes); this epic wires the UI — a Location autocomplete in the edit form, replacing free-text-only entry from Epic 2.1. Free-text fallback fields (`birth_place`, `death_place`, `location`) are retained and pre-populated from the linked Location name when set.
- **Note — place FK vs. place certainty:** since this section was written, `Person.birth_place_certainty`/`death_place_certainty` and `Event.location_certainty` were added — a separate axis from the Location FK ("we know which place" vs. "we are sure it was that place"). This epic does not yet say how the two interact, and neither does the historical-name-normalization dictionary above. Resolve alongside issue #72 (the model can't express one place with several historical names, or one place absorbing another), which is the same gap from the data side.

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

**Precondition (unstated above, from README "Known limitations"):** `Literature` currently
has no soft delete despite being a full member of the relation graph — deleting one
permanently orphans relations that reference it. README records this as something to be
addressed before Literature's CRUD is built. This epic should add soft delete to `Literature`
as part of its scope, not after.

**Verifiable:** Connect Zotero API key, sync a collection, see entries appear in literature list. Import a RIS file. Export a single entry as BibTeX.

---

### Epic 3.4 — Import System

**Deliverable:** Bulk data import for persons and events from CSV and XLSX, with preview, validation, and history.

- Supported formats: CSV (PapaParse), XLSX (ExcelJS)
- Person import: maps columns to Person fields; fuzzy date parsing ("c. 1850", "1790?", "before 1900", DD/MM/YYYY); place normalization; name variant detection
- Event import: title, description, date, end_date, location, event_type (matched to project's event types or created)
- **Import preview:** Before committing, show parsed records with validation warnings and uncertainty flags
- **Duplicate detection:** Levenshtein similarity for names + date comparison; show potential duplicates with confidence; user decides merge/skip/import. **Note:** Epic 5.2 specifies on-demand duplicate detection for manually-entered records using the same algorithm — build the matching engine once here (or there, whichever ships first) and have the other epic consume it.
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

### Requirement-Check: Source-First-Prinzip

Das Source-First-Prinzip fordert: Jeder Datenpunkt muss direkt zu einem Pixel im
Quellen-Scan rückführbar sein.

#### Offene Schema- und Infrastruktur-Lücken

| Lücke                                                   | Befund (geprüft 2026-09-20)     | Adressiert in   |
| ------------------------------------------------------- | ------------------------------- | --------------- |
| `Source.file_url` (Blob-URL für Scan-Upload)            | Fehlt im Schema                 | Epic 3.5 Schema |
| `Source.file_hash` (SHA-256, Tampering-Schutz)          | Fehlt im Schema                 | Epic 3.5 Schema |
| `PropertyEvidence.source_scan_region` (Pixel-Anchoring) | Fehlt im Schema                 | Epic 3.5 Schema |
| PDF/Scan-Viewer mit Annotations-Support                 | Keine Abhängigkeit, keine Route | Epic 3.5        |
| Blob-Storage-Integration (Vercel Blob / S3)             | Keine Abhängigkeit, keine Route | Epic 3.5        |
| URL-Archivierung (Wayback Machine API)                  | Kein Plan, kein Code            | Epic 3.5        |

All six rows re-checked directly against `prisma/schema.prisma` and `src/` (a March 2026 check
had only re-verified the first three). The two rows previously assigned to "Epic 6.0 Schema"
are corrected here: Epic 6.0's schema block (Phase 6, below) does not define `file_url`/
`file_hash` — they belong to Epic 3.5, which is also where `Source.file_hash` is described as
being computed on upload. `PropertyEvidence.source_scan_region` is likewise corrected from
"Epic 2.4 Agentic layer" to Epic 3.5: Epic 2.4 explicitly defers it there (see that epic's
Agentic layer section) rather than addressing it.

**Note (Phase-3 move, September 2026 grooming pass):** this epic shipped as Epic 6.3 in Phase 6
under the name "Source Scan & Pixel Anchoring." It was moved to Phase 3 and renumbered to 3.5
because none of it needs AI — it delivers value on its own and should not wait behind the
agentic phase (Phase 6). The move added per-region transcription and region tagging; everything
previously specified is unchanged. See `## History` below and decisions 19–22 in
[`decisions.md`](./decisions.md).

---

### Epic 3.5 — Source Media & Region Transcription

**Deliverable:** Scan-Upload für Primärquellen mit Regions-Annotation und
Direktverlinkung zu PropertyEvidence.

- File upload zu Vercel Blob: PDF, JPG, PNG — max. 50MB pro Datei
- PDF-Viewer (react-pdf oder pdf.js): inline Rendering
- Annotations-Tool: Benutzer markiert Textstelle → Region wird als JSON gespeichert
  `{page: 3, x: 120, y: 450, w: 800, h: 60}`
- `PropertyEvidence.source_scan_region` verknüpft Annotation mit Datenpunkt
- EvidenceStrip-Erweiterung: Klick auf Quelle → öffnet PDF-Viewer an der Seite +
  scrollt zu markierter Region. **Hinweis (aus dem Phase-3-Umzug):** `<EvidenceStrip>`
  selbst wird erst in Epic 6.1 (Phase 6) gebaut; bis dahin läuft dieser Link über das
  bereits existierende `PropertyEvidencePanel`/`PropertyEvidenceBadge`-Paar, das
  `.quote`/`.raw_transcription` schon heute rendert.
- `Source.file_hash` (SHA-256) wird bei Upload berechnet, dient als Integritätsnachweis

**Neu (Erweiterung beim Phase-3-Umzug — funktioniert vollständig ohne KI):**

- **Per-Region-Transkription:** Zusätzlich zum Markieren einer Region tippt der Historiker
  ein, was der Text in dieser Region sagt. Die Transkription wird zusammen mit der Region
  gespeichert (`PropertyEvidence.raw_transcription`, aus Epic 2.4).
- **Region-Tagging:** Regionen können mit benutzerdefinierten Tags versehen werden (z.B.
  "Geburtsdatum", "Unterschrift", "Randnotiz"), um sie später wiederzufinden und zu filtern.

**Verifiable:** Scan hochladen, Zeile "geboren 1848" markieren, als Evidence für
Person.birth_year verknüpfen. Transkription "geboren 1848" eintippen und mit dem Tag
"Geburtsdatum" versehen — beides erscheint zusammen mit der Region im
PropertyEvidence-Panel. (Sobald Epic 6.1 verfügbar ist: EvidenceStrip auf der
Personendetailseite → klicken → PDF öffnet sich auf S.12 mit hervorgehobener Region.)

---

## Phase 4 — Discovery & Intelligence

> Goal: Make the data speak. Visualization, search, and analytical insight.

**Sequencing note:** the epics below are ordered 4.1 → 4.3 → 4.2 → 4.4, not by number
(approved re-prioritisation, September 2026 grooming pass). 4.3 (Network Graph) is built
before 4.2 (Timeline) because Epic 5.1's GEXF export consumes 4.3's `/api/graph` endpoint —
delivering the graph second in this phase unblocks Phase 5 early, and nothing in Phase 4 or 5
depends on 4.2. 4.4 (Analytics Dashboard) is sequenced last because it extends
`GET /api/projects/[id]/stats`, which belongs to unshipped Epic 3.1 (see 4.4 below).

### Epic 4.1 — Cross-Entity Search & Full-Text Discovery

**Deliverable:** A single search box that searches across all entity types simultaneously, with faceted filtering.

- Search endpoint: `GET /api/search?q=&types=&project_id=`
- PostgreSQL full-text search (`tsvector`/`tsquery`) on: Person names + notes, Event titles + descriptions, Source titles + notes, Location names, Literature titles + keywords + abstracts
- Unified search results page: grouped by entity type, relevance ranked
- Faceted filter sidebar: filter results by entity type, date range, location, certainty level
- Autocomplete: per-entity type search in relation form dropdowns (**already shipped** in Epic 2.4 via `src/components/relations/EntitySelector.tsx` — no new work here, kept in this list only so the epic's original scope is legible)
- "Connected to X" exploration: from any entity detail page, see all entities within 1-2 relation hops

**Verifiable:** Search "Vienna 1848", get persons born there, events that occurred there, sources about it — all in one results page.

---

### Epic 4.3 — Network Graph Visualization

**Deliverable:** Interactive force-directed graph of the universal relation model.

- Library: **deliberately undecided.** Shortlist, narrowed: **Cytoscape.js** (purpose-built,
  real layout algorithms, comfortable into the low thousands of nodes), **Sigma.js**
  (WebGL, comfortable past 10k), **D3-force** (maximum control, every interaction built by
  hand). React Flow is **ruled out**: it is built for user-arranged node editors, not
  force-directed exploration of a discovered graph.
  **The deciding measurement:** the p95 node count of a real research project, which the
  MVP validation produces by definition — a historian migrating a live project off their
  current tool (see `vision.md` §1). Below roughly 2,000 nodes any of the three works and
  DX decides; past that, SVG stops being viable and the choice narrows to Sigma.js.
  Do not re-debate this before that number exists.
- Nodes: Person (circle), Event (diamond), Source (square), Location (pin) — visually distinct by shape and color
- Edges: labeled with relation type; thickness or color encodes certainty
- Filter panel: filter by entity types to show, relation types to show, minimum certainty level
- Click node → open entity detail side panel
- Expand/collapse node neighborhood (click to reveal connected nodes up to N hops)
- Zoom, pan, drag nodes to rearrange
- Layout options: force-directed, hierarchical, circular
- Graph data endpoint: `GET /api/graph?project_id=&depth=` returns nodes + edges in a graph-compatible format — **built before Epic 4.2** specifically so Epic 5.1's GEXF export has this endpoint to consume.

**Verifiable:** Project with 30+ entities and 50+ relations renders as a navigable graph. Filter to show only Person nodes and family relation types. Click a node and see the detail panel.

#### Agentic layer

> Graph-Daten (`/api/graph`) werden AX-Layer-3-Chat als Kontext-Endpoint dienen.

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

### Epic 4.4 — Analytics Dashboard & Activity Feed

**Deliverable:** A meaningful project dashboard showing research state and real activity.

**Depends on:** Epic 3.1 — the stats endpoint this epic extends does not exist until 3.1 ships
it. Sequenced last in Phase 4 for that reason, not by number.

- **Real activity log:** Track CRUD actions on all entities (not auth events). Uses the
  `EntityActivity` model introduced in Epic 2.4 (table `entity_activity`,
  `prisma/schema.prisma:554`): `project_id`, `entity_type`, `entity_id`, `user_id`,
  `agent_name`, `action`, `field_path`, `old_value`, `new_value`, `reason`, `source_id`,
  `created_at`. **Note:** there is no `entity_label` column — rendering "You added Person
  'Karl Maier' 2 hours ago" requires either a migration adding a denormalised label or
  read-time resolution of the polymorphic `entity_id` (see issue #20 on dangling ids).
- Dashboard cards (meaningful, not just counts):
  - "Persons with uncertain birth dates" (actionable)
  - "Unconnected entities" (persons/events with 0 relations — data gaps)
  - "Sources with no evidence links" (orphaned sources)
  - "Recent additions this week" (bar chart)
  - Entity type distribution (pie chart)
- Charts: **shadcn charts** (Recharts underneath), per locked decision 23 — same
  CSS-variable token system as the rest of the UI, components owned in
  `src/components/ui/`. Load the `dataviz` skill before writing chart code.
- Per-project stats endpoint: `GET /api/projects/[id]/stats` — extended to return research
  quality metrics. The base endpoint is Epic 3.1's "Project stats page"; no `/api/projects`
  route exists yet, so this epic cannot start before 3.1 ships it.
- Quick-create shortcuts on dashboard (add person, add event, add relation)

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

- **Duplicate detection:** Run on demand (not only at import time) for manually-entered persons and events. Levenshtein + date matching. Results in a review queue. **Note:** this is the same algorithm Epic 3.4 specifies for import-time duplicate detection. Specify the matching engine once — in whichever of 3.4 or 5.2 is built first — and have the other consume it; do not implement it twice.
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

- All strings externalized to `messages/de.json` and `messages/en.json` (**already shipped** in Epic 1.1; open issue #40 says the job is incomplete — hardcoded strings still leak in both locale directions — so this bullet is "keep it complete," not "build it")
- Date formatting per locale (de-DE, en-US) via `Intl.DateTimeFormat`
- Number formatting per locale
- Relation type default seeds available in both languages
- **Locale persistence:** the shipped mechanism is a client-side `NEXT_LOCALE` cookie (`localeDetection: false` in `src/i18n/routing.ts`), not a `User` profile column. Persisting locale to the `User` row instead would be a schema change this epic does not currently scope — decide explicitly whether the cookie is sufficient or a profile column is worth adding before treating this as a deliverable.
- UI polish pass: consistent spacing, typography scale, empty states, loading skeletons, error states on all pages (**already shipped** in Epic 2.5 for the authenticated app shell; re-scope this bullet to any pages 2.5 did not cover, if any remain)
- Accessibility pass: ARIA labels, keyboard navigation, focus management
- All Zod validation messages externalized (no hardcoded German strings in code)

**Verifiable:** Switch locale to English, verify all UI text changes. Switch back to German. Date "15. März 1848" in DE, "March 15, 1848" in EN.

---

### Epic 5.4 — Testing, Security & Production Hardening

**Deliverable:** 80% test coverage, security audit completed, production monitoring in place.

- **Unit tests:** All utility functions, validation schemas, data transformation logic — target 90%+ on lib/utils
- **Integration tests:** All API routes with MSW mocking; auth flows; relation engine; import parser
- **E2E tests (Playwright):** Critical paths: register→verify→login, create person, create event, link relation, import CSV, export CSV, project invite flow
- **CSP hardening:** `next.config.ts` currently allows `'unsafe-inline'` on **both** `script-src`
  and `style-src`. `style-src` is the easy half (Tailwind v4 needs it for now). `script-src`
  is the one that actually needs a nonce strategy — the in-file comment records why: Next.js
  App Router injects inline RSC streaming scripts (`self.__next_f.push`). Plan the nonce
  strategy for both directives, not just `style-src`.

- **Security review:** Session/JWT and middleware-authorization hardening (logout not
  invalidating a captured session, the `authorized()` allow-list being inert) moved to Epic
  2.7 — see that epic for issues #103, #88, #27. What remains here:
  - Remove any remaining test/debug routes
  - Verify rate limiting works under load
  - Verify Redis tokens not exposed
  - Input validation on all API route parameters
  - SQL injection: verify Prisma parameterization (should be safe by default)
- **Monitoring:** Sentry (error tracking), Vercel Analytics (performance), the `EntityActivity`
  log (table `entity_activity`, introduced in Epic 2.4 — not a separate `activity_log` table)
  as audit trail
- **Performance:** Bundle analysis, image optimization, lazy loading for graph visualization and maps
- **Documentation:** README with setup instructions, `.env.example` complete and documented
- **UI Library** Add Storybook

**Verifiable:** `pnpm test:coverage` meets the 80% thresholds already configured in
`vitest.config.ts:13`. Lighthouse score >85. Security headers grade A on securityheaders.com. Sentry catches and reports a test error.

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

// Kein `agent_confidence Float?` auf diesen Entitäten (Korrektur 2026-09-21): Decision 6
// ersetzte Dezimal-Konfidenz durch kategoriale Certainty, Decision 15 hält den Float-Track
// bewusst intern bei Agenten. Ein Entity-weites Float-Feld würde entweder die Certainty
// einzelner Assertions auf einer gemischt manuell/agentisch gepflegten Entität verfälschen
// oder beim nächsten Vorschlag überschrieben werden — und holt numerische
// Wahrscheinlichkeit zurück in ein Modell, das genau das bewusst ablehnt (README §2,
// `src/components/research/CertaintyMarker.tsx`). Modell-Scores bleiben auf
// AgentSuggestion.confidence; akzeptierte Aussagen tragen kategoriale Certainty
// (PropertyEvidence.confidence, Epic 2.4).

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
| `/api/entities/[type]/[id]/conflicts` | GET     | Offene Datenkonflikte                                 |
| `/api/grounding/verify`               | POST    | Prüft: Unterstützt Source X Claim Y?                  |

**Nicht neu:** `GET /api/entities/[type]/[id]/activity` ist bereits in Epic 2.4 spezifiziert
und existiert (`src/app/api/entities/[type]/[id]/activity/route.ts`). Ursprünglich hier
fälschlich unter "Neue API-Endpunkte" doppelt aufgeführt.

#### Agentic Guardrails (API-Enforcement)

```
CONSTRAINT 1 — Kein direkter Write:
  Agent-API hat NUR POST /api/agents/suggestions.
  Kein PUT /api/persons/[id] für Agent-Auth-Token.

CONSTRAINT 2 — Grounding-Zwang:
  POST /api/agents/suggestions → 422 wenn source_ids.length === 0.

CONSTRAINT 3 — Confidence-Cap:
  AgentSuggestion.confidence (das Top-Level-Feld, NICHT ein Feld in suggested_value —
  suggested_value ist beliebiges JSON) wird serverseitig auf Math.min(value, 0.95) gecappt.
  Korrektur 2026-09-21: ursprünglich stand hier "suggested_value.confidence", was nichts
  cappt, das die Verification-Szenarien unten tatsächlich prüfen ("Mit confidence 0.99 →
  gespeichert als 0.95" bezieht sich auf das Top-Level-Feld, Zeile ~796).

CONSTRAINT 4 — Reasoning-Pflicht:
  AgentSuggestion.reasoning: NOT NULL, minLength: 50.

CONSTRAINT 5 — Source- und Entity-Scoping-Check:
  Jede source_id in source_ids UND die Ziel-Entität (entity_type/entity_id) müssen aktiv
  (deleted_at: null, wo die Tabelle das Feld hat) und im selben project_id liegen wie der
  anfragende Agent — sonst 403. Bloße Existenz reicht nicht (Korrektur 2026-09-21): ohne
  Projekt-Check kann ein Aufrufer eine Suggestion an die Source oder Entität eines fremden
  Projekts binden, solange die CUID irgendwo existiert (cross-tenant). Präzedenzfall, den
  diese Epic 1:1 übernimmt: `src/app/api/property-evidence/route.ts:156-160` prüft
  `source_id` bereits so (`where: { id, project_id, deleted_at: null }`), und
  `src/lib/entity-validation.ts` (`validateEntityExists`) macht dasselbe für die Ziel-Entität.

CONSTRAINT 6 — Rate Limiting per Agent:
  Max. 100 AgentSuggestions/Stunde/Projekt pro agent_name (Redis sliding window).

CONSTRAINT 7 — EntityActivity Immutabilität:
  Kein DELETE-Endpoint für /api/entities/[type]/[id]/activity.
  Prisma: Kein deleteMany auf EntityActivity.

CONSTRAINT 8 — Approval Gate:
  PENDING-Vorschläge werden in der UI als "Vorschlag" (nicht Fakt) gerendert.
  Nur ACCEPTED-Vorschläge fließen in Berechnungen ein.
  Rollen-Check (Ergänzung 2026-09-21 — fehlte in der ursprünglichen Fassung): `PUT
  /api/agents/suggestions/[id]` muss vor jedem ACCEPT/REJECT `requireProjectMembership(userId,
  project_id, WRITE_ROLES)` prüfen (Decision 16: "explicit ACCEPT by a project EDITOR or
  OWNER", bekräftigt in `vision.md` §2). Ohne diesen Check ist die einzige technische
  Durchsetzung von Decision 16 die UI-Rendering-Regel oben, die ein direkter API-Aufruf
  umgeht. Präzedenzfall, den diese Epic übernimmt: `requireProjectMembership()` +
  `WRITE_ROLES` (`src/lib/api.ts:191-210`), bereits verwendet in
  `src/app/api/{relations,sources,persons,events}/bulk/route.ts` und `persons/route.ts`.

CONSTRAINT 9 — User Override:
  Manuelle Bearbeitung durch Historiker überschreibt ACCEPTED-Vorschläge automatisch
  und loggt in EntityActivity: action = "USER_OVERRIDE".
  Hinweis: `enum ActivityAction` (Epic 2.4, `prisma/schema.prisma`) kennt heute nur
  CREATE/UPDATE/DELETE/MERGE/SUGGEST/ACCEPT/REJECT — USER_OVERRIDE fehlt. Diese Migration
  muss den Enum-Wert per `ALTER TYPE` ergänzen, sonst schlägt der Log-Write fehl.

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
- Zeigt: agent_name, suggestion_type, reasoning (Volltext), confidence-Badge — kategorisiert
  (niedrig/mittel/hoch, farbcodiert wie `CertaintyMarker`), NICHT als Prozentzahl (Korrektur
  2026-09-21: eine Prozent-Badge widerspricht Decision 15 ["categorical enum for historians
  (UI)"] und dem bereits verworfenen Ansatz in
  `src/components/research/CertaintyMarker.tsx` — README §2: "a number implies a
  statistical basis that does not exist"). Der rohe Float bleibt intern (API), nicht in der UI.
- Niemals direkt editierbar — nur ACCEPT / REJECT / "Zur Quelle" Buttons
- Erscheint in: PersonDetailTabs ("KI-Vorschläge"-Tab), EventDetailTabs

**3. `<AgentSuggestionCard>`**

- Karten-Komponente für jede AgentSuggestion im PENDING-Status
- Props: suggestion, onAccept, onReject
- Zeigt: suggested_value (formatiert), confidence — kategorisiert (niedrig/mittel/hoch,
  farbcodiert), NICHT als proportionaler Farbbalken (Korrektur 2026-09-21, selbe Begründung
  wie bei `<ReasoningBox>` oben), reasoning (gekürzt → "mehr"), source_ids als
  CitationLink-Badges
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
           Claude API (aktuelle Sonnet-Tier-Generation — Modell-ID erst bei
           Implementierung fixieren, nicht hier: `claude-sonnet-4-6` war die
           gepinnte ID, als dieser Abschnitt geschrieben wurde, und ist inzwischen
           eine ältere Generation)
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

1. Frage → Embedding (text-embedding-3-small); Vektor-Speicherung via pgvector.
   **Hinweis:** keine pgvector-Extension ist heute aktiv und keine Embedding-Spalte existiert
   in `prisma/schema.prisma` — diese Epic muss beides als Teil ihres Scopes hinzufügen, nicht
   voraussetzen.
2. Vektor-Suche über Source.notes + PropertyEvidence.quote + EntityActivity.reason — Letzteres
   NUR für Einträge mit gesetztem `source_id` (Korrektur 2026-09-21). `EntityActivity.reason`
   ist eine freie menschliche Notiz; `EntityActivity.source_id` ist heute "reserved for agents"
   und bei jedem menschlichen Eintrag null (`prisma/schema.prisma:566`). Ungegroundete
   Freitext-Notizen dürfen nicht in den Korpus — sonst wird eine Audit-Notiz als
   quellenbelegte historische Aussage präsentiert, was der These in `vision.md` §2
   widerspricht ("Jede Aussage eines Agenten muss durch einen vorhandenen Quellen-Datensatz
   belegt sein").
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
- `<ChatMessage>` — Einzelne Nachricht mit: Text, CitationLinks, confidence-Badge —
  kategorisiert wie bei `<ReasoningBox>` (Epic 6.1), nicht als Prozentzahl (Korrektur
  2026-09-21, gleiche Begründung: Decision 15 + README §2) —, "Vorschlag einreichen"-Button
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

### Epic 6.4 — Document AI (OCR & Structured Extraction)

**Deliverable:** Optionale KI-gestützte Vorverarbeitung gespeicherter Quellen-Scans, die
ausschließlich Vorschläge erzeugt, denen ein Mensch zustimmt — nie direkte Schreibzugriffe.

- **Self-hosted OCR** über die in Epic 3.5 erfassten/hochgeladenen Bilder. Läuft auf eigener
  Infrastruktur; Bilder verlassen diese Infrastruktur nie.
- **Optionale LLM-Interpretation** des OCR-_Texts_ (nicht des Bilds): strukturierte Extraktion
  von Namen, Daten, Orten — als `AgentSuggestion`-Records unter den in Epic 6.0 festgelegten
  Grounding-Regeln (jeder Vorschlag referenziert mindestens einen existierenden `Source.id`;
  kein direkter Write; Akzeptanz erfordert ein explizites menschliches Gate).
  - Da mit Epic 3.5 Regionen (nicht nur ganze Quellen) existieren, ist die Region — nicht die
    gesamte Quelle — die korrekte Grounding-Einheit für einen Document-AI-Vorschlag; sonst
    führt dieser Epic exakt die "welches Pixel?"-Unschärfe wieder ein, die das
    Source-First-Prinzip beseitigen soll ("Jeder Datenpunkt muss direkt zu einem Pixel im
    Quellen-Scan rückführbar sein" — siehe Requirement-Check unter Epic 3.5). `AgentSuggestion`
    erhält daher ein optionales Feld für eine Region-Referenz (z.B. `source_region_ref`,
    verweist auf `PropertyEvidence.source_scan_region`) zusätzlich zu `source_ids`.
- **Asynchron:** OCR und Interpretation laufen als Queue-Jobs, nicht blockierend. Ein Nutzer
  stößt sie an und sieht sich die Ergebnisse später an.
- **Egress-Durchsetzung pro Asset** (Decision 20): Die zum Zeitpunkt der Aufnahme eines Assets
  geltende Egress-Policy wird auf dem Asset gespeichert und dauerhaft befolgt — ein späterer
  OCR-/Interpretations-Lauf auf einem alten Scan folgt der Policy von damals, nicht der
  aktuellen Projekt- oder Session-Einstellung.
- Abhängigkeiten: Epic 6.0 (`AgentSuggestion`-Schema und Grounding-API) und Epic 3.5 (die
  gespeicherten Scans und Regionen).

**Verifiable:** OCR auf einem in Epic 3.5 hochgeladenen Scan anstoßen → erscheint als
asynchroner Job, blockiert die UI nicht. Ergebnis erscheint später als Vorschlag, nicht als
direkter Feld-Write. LLM-Interpretation des OCR-Texts liefert einen `AgentSuggestion` mit
Region-Referenz und ≥1 `Source.id`; ohne `source_ids` → 422 (wie in Epic 6.0 CONSTRAINT 2). Ein
Asset, dessen Egress-Policy bei Aufnahme "kein Hosted-LLM" war, wird auch nach einer späteren
Projekt- oder Session-Policy-Änderung nicht an das gehostete Modell gesendet.

---

## Phase 7 — Field Capture

> Goal: The app has to work in an archive or a library reading room, from a phone, with poor
> or no connectivity.

### Epic 7.1 — Mobile Capture Client

**Deliverable:** A Capacitor application bundling a small, dedicated web client — **not** the
Next.js app.

- **Measured reason for the separate architecture (Decision 21):** all 28 `page.tsx` files in
  this app are React Server Components, `next.config.ts` sets no `output: "export"`, and
  `src/middleware.ts` performs auth and locale routing per request. The app requires a server
  by construction and cannot be bundled into a Capacitor shell.
- OS document scanners: Apple VisionKit (`VNDocumentCameraViewController`) and Google ML Kit
  Document Scanner — edge detection, perspective correction, multi-page capture.
- Local capture queue that survives being offline.
- Background upload sync when connectivity returns.

**Verifiable:** In airplane mode, capture several pages with the document scanner (edges are
detected and perspective-corrected automatically); close and reopen the app — the captures are
still in the local queue. Restore connectivity → captures upload in the background without the
app needing to be in the foreground.

---

### Epic 7.2 — Scanning-Session Review

**Deliverable:** A capture session groups everything scanned during one archive visit; at the
end of the session the researcher reviews in one pass instead of item by item.

- A session groups all scans captured during one visit.
- The review view shows, per session: what was captured, what OCR (Epic 6.4) produced from it,
  and any drafted data additions (`AgentSuggestion` records).
- The researcher accepts, edits, or discards in one pass, rather than opening each item
  individually.

**Verifiable:** Close out a session with 5 scans → the review view shows all 5 with their OCR
result and any suggestions; one scan is accepted, one edited, one discarded — without leaving
the review view.

---

## Summary

| Phase | Theme               | Epics        | Outcome                                                                                                                   | Agentic layer                                                 |
| ----- | ------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| 1     | Foundation & Auth   | 1.1–1.4      | Secure, authenticated shell with infrastructure                                                                           | Bestehend, unverändert                                        |
| 2     | Core Research Loop  | 2.1–2.7      | MVP: persons, events, sources, relations + UI polish + marketing pages + session/authz hardening                          | Augmentiert: EntityActivity, PropertyEvidence.confidence      |
| 3     | Research Context    | 3.1–3.5      | Projects, locations, literature, bulk import, source scans with pixel-anchored transcription                              | Augmentiert: Geocoding als AgentSuggestion, Import-Provenance |
| 4     | Discovery           | 4.1–4.4      | Search, timeline, network graph, analytics                                                                                | Augmentiert: AX-Dashboard-Karten                              |
| 5     | Export & Production | 5.1–5.4      | Export, data quality, i18n, 80% test coverage                                                                             | Augmentiert: created_via in Exports, AX-Security-Review       |
| 6     | Agentic Experience  | 6.0–6.2, 6.4 | AX infrastructure, collaborative UI, scholarly chat, self-hosted OCR + optional hosted-LLM interpretation of stored scans | Die Phase selbst                                              |
| 7     | Field Capture       | 7.1–7.2      | Mobile capture client for archive/reading-room work, offline queueing, per-session review                                 | Nutzt AgentSuggestion (Epic 6.0/6.4) für Review-Vorschläge    |

`source_scan_region` was removed from Phase 2's Agentic-layer cell above: Epic 2.4 explicitly
defers it to Epic 3.5 (no consumer exists until the scan viewer is built), so it never landed
in Phase 2. Phase 6 as a _phase_ exists only from the September 2026 roadmap merge — see
`## History` below for the provenance note this cell used to carry inline.

**MVP for university validation = Phase 1 + Phase 2 (including 2.5) complete.**
Phase 3 adds collaborative workspace, import, and source scanning with pixel-anchored
transcription, making it suitable for a research group. Phases 4 and 5 make it a complete,
production-ready product.

**AX-Alpha** = Epic 6.0 + 6.1 (Provenance-Infrastruktur + Lego-Bricks-UI).
**AX-Beta** = Epic 6.2 (Scholarly Chat) nach Historian-Feedback aus AX-Alpha.
**Source-First-Vollständigkeit** = Epic 3.5 (Scan-Upload + Pixel-Anchoring + Transkription),
erreicht bereits in Phase 3 — Epic 6.4 (Document AI) baut darauf auf, ist aber keine
Voraussetzung dafür.

---

## History

Work that shipped without appearing in either predecessor roadmap. Recorded here so the
gap between the epic list and the repository is visible; progress against the epics
themselves lives on GitHub Issues and the Evidoxa Backlog project board
(`gh project 1 --owner mathisthomsen`), not written down here. (Measured 2026-09-20: the repo
has zero GitHub milestones — `gh api repos/mathisthomsen/historian-app/milestones` returns
`[]`. A milestone-based status generator has been discussed but does not exist yet; if one is
built, it belongs here as a planned mechanism, not a present-tense one.)

Phase 6 exists as a phase only from the September 2026 roadmap merge: `ai_aided_roadmap.md`
carried Epics 6.0–6.3 as a proposal, and the merge presented them as committed
(commit `56c83e3`; rationale in `docs/specs/docs-consolidation/plan.md:103`).

Epic 2.7 (Session & Authorization Hardening) was added to Phase 2 during the September 2026
roadmap grooming pass, carrying forward three `priority: high` session/authorization defects
(issues #103, #88, #27) that predate this roadmap and were previously undocumented here.

Epic 6.3 (Source Scan & Pixel Anchoring) was moved to Phase 3 and renumbered to **3.5** on
2026-09-20 (Maintainer-Entscheidung; decisions 19–22), because none of its scope needs AI and
it should not wait behind the agentic phase. The move added per-region transcription and
region tagging to the epic; nothing already specified was removed. 6.3's freed number was
deliberately **not** reused — a new Document AI epic was added to Phase 6 as **6.4** instead,
to keep older commits and issues that cite "Epic 6.3" traceable to the scan/pixel-anchoring
work rather than to an unrelated OCR epic. Phase 7 (Field Capture) was added in the same pass.

### UI polish and brand tokens (Epic 2.5)

Shipped without a spec directory under `docs/specs/`. The work was carried out as the
design-system build-out and merged from `feat/epic-2-5-design-system` (PR #18, merge
commit `9700a9f`). Its documentation lives in `docs/design-system/` and
`docs/implementation/` rather than in a spec folder, which is why the epic has no
`docs/specs/2-5-*` counterpart.

### Cleanup workstreams

Four workstreams were specified and executed outside the epic numbering, each closing
gaps left by an epic that had already been declared done.

| Workstream        | Spec                                            | What was done                                                                                                                                           |
| ----------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `2-1_2-4 cleanup` | `docs/archive/2-1_2-4-cleanup/specification.md` | Person detail page: data-mapping bugs, unwired features, dialog pre-population, and activity-log accuracy across Epics 2.1 and 2.4 (commit `72d58ea`)   |
| `events-cleanup`  | `docs/archive/events-cleanup/specification.md`  | Event detail page brought to parity with the person detail page, including the shared `EntityEvidenceTab` generalisation (commits `d9cf0a4`, `7fcb8a1`) |
| `sources-cleanup` | `docs/archive/sources-cleanup/specification.md` | Source detail page brought to the same parity; depends on the `EntityEvidenceTab` generalisation from `events-cleanup` (commits `d9cf0a4`, `7fcb8a1`)   |
| `2-4-delta`       | `docs/archive/2-4-delta/gaps-by-epic.md`        | Gap analysis of Epics 1.1–2.4 against the running app, severity-rated, and the nine resulting fixes (commits `22066c8`, `a54fce9`)                      |

Epic 2.6 was also cut down on the way into implementation: `docs/specs/2-6-marketing-landing/specification.md`
ships one landing page, a changelog and the two legally required pages, and defers
Features, About and Pricing. See the scope note on Epic 2.6.

---

## Open Items for Epic Refinement

These questions should be resolved per-epic during refinement:

- **Graph visualization library:** D3.js vs. Cytoscape.js vs. React Flow — performance vs. API ergonomics trade-off
- **Chart library:** Recharts vs. Tremor vs. shadcn charts — to be decided in Epic 4.4 refinement
- **Async import processing:** Vercel background functions vs. Inngest vs. simple polling — depends on import volume expectations
- **PostgreSQL full-text vs. Meilisearch:** For Epic 4.1 — Postgres FTS is zero-dependency; Meilisearch gives better relevance for larger datasets
- **Person name model — DACH convention gap (issue #56):** the shipped `PersonName` table
  (`name`, `language`, `is_primary`) has no title field and no particle-aware sort key, so it
  cannot correctly express names in the DACH convention. This is the live open question — the
  earlier "JSON array vs. separate table" question is resolved (the table exists, Epic 2.1
  shipped against it).
- **LiteratureEvidence:** Extend RelationEvidence to support Literature (not just Source) as evidence — evaluate in Epic 3.3 refinement
- **OCR engine choice (Epic 6.4):** which self-hosted OCR engine (e.g. Tesseract, PaddleOCR, a
  self-hosted layout-aware model) meets the "images never leave our infrastructure" guarantee
  (Decision 20) at acceptable accuracy on historical handwriting/typewriting — evaluate in
  Epic 6.4 refinement.
- **Capacitor data-sync contract (Epic 7.1):** the exact API contract between the mobile
  capture client's local queue and the Next.js backend (batch upload shape, conflict handling
  for a session started offline and finished online, retry/backoff policy) is not yet
  specified — evaluate in Epic 7.1 refinement.
