# Evidoxa (Historian App) - Legacy Feature Set

> Baseline reference document for the rebuild. Documents all functional and non-functional features of the current application as of March 2025.

---

## 1. Overview

**App Name:** Evidoxa (codebase name: `historian_app`)
**Purpose:** A research tool for historians to manage persons, events, locations, sources, and their relationships within research projects. Supports collaborative research with multi-project workspaces, data import, timeline visualization, and bibliography management.

**Tech Stack:**
- **Framework:** Next.js 15 (App Router, React 19)
- **Language:** TypeScript
- **Database:** PostgreSQL (Neon, via Prisma ORM)
- **Auth:** NextAuth v4 (JWT strategy, credentials + email providers)
- **UI:** MUI (Material UI v7), MUI X (DataGrid, Charts, DatePickers)
- **Maps:** Leaflet + react-leaflet
- **Charts:** ECharts (echarts-for-react), MUI X Charts
- **Forms:** react-hook-form + @hookform/resolvers + Zod
- **Import:** PapaParse (CSV), ExcelJS (XLSX)
- **Email:** Resend
- **Deployment:** Vercel (serverless), standalone output
- **Testing:** Jest 30 + React Testing Library, Playwright (E2E)

---

## 2. Core Data Model

### 2.1 User (`users`)

| Field | Type | Notes |
|---|---|---|
| id | String (cuid) | PK |
| email | String | Unique, indexed |
| name | String | |
| password | String? | bcrypt hash |
| role | UserRole enum | USER or ADMIN |
| emailVerified | Boolean | Default false |
| emailVerifiedAt | DateTime? | |
| createdAt | DateTime | |
| updatedAt | DateTime | |
| lastLoginAt | DateTime? | |
| workosUserId | String? | Unique, unused legacy field |

**Relations:** Owns projects, persons, events, sources, statements, literature, import history, auth records. Member of projects via UserProject.

### 2.2 Project (`projects`)

| Field | Type | Notes |
|---|---|---|
| id | String (cuid) | PK |
| name | String | |
| description | String? | |
| created_at | DateTime | |
| updated_at | DateTime | |
| owner_id | String | FK -> User |

**Relations:** Has many events, persons, literature, sources, statements, personEventRelations, sourceOnRelations. Has many members via UserProject.

### 2.3 UserProject (`user_projects`)

| Field | Type | Notes |
|---|---|---|
| id | Int (autoincrement) | PK |
| user_id | String | FK -> User |
| project_id | String | FK -> Project |
| role | String | "owner", "editor", or "viewer" |

**Constraints:** Unique on (user_id, project_id).

### 2.4 Person (`persons`)

| Field | Type | Notes |
|---|---|---|
| id | Int (autoincrement) | PK |
| userId | String | FK -> User |
| project_id | String? | FK -> Project |
| first_name | String?(100) | |
| last_name | String?(100) | |
| birth_date | Date? | |
| birth_place | String?(255) | |
| birth_location_id | Int? | FK -> locations |
| death_date | Date? | |
| death_place | String?(255) | |
| death_location_id | Int? | FK -> locations |
| notes | String? | |
| birth_date_original | String?(100) | Raw import value |
| birth_date_uncertainty | String?(20) | exact/approximate/estimated/unknown |
| birth_place_confidence | Decimal(3,2) | 0.00-1.00 |
| birth_place_normalized | String?(255) | |
| death_date_original | String?(100) | |
| death_date_uncertainty | String?(20) | |
| death_place_confidence | Decimal(3,2) | |
| death_place_normalized | String?(255) | |
| name_confidence | Decimal(3,2) | |
| created_via_import | Boolean | Default false |
| import_batch_id | String?(100) | |

**Relations:** Has many person_relations (from/to), personEventRelations. Optional FK to locations for birth/death places.

**Indexes:** first_name, last_name, (first_name + last_name), birth_date, death_date, birth_place, death_place, userId, import_batch_id, birth/death_place_normalized, birth/death_location_id.

### 2.5 Event (`events`)

| Field | Type | Notes |
|---|---|---|
| id | Int (autoincrement) | PK |
| userId | String | FK -> User |
| project_id | String? | FK -> Project |
| title | String | |
| description | String? | |
| date | DateTime? | Start date |
| end_date | DateTime? | |
| location | String? | Free text |
| location_id | Int? | FK -> locations |
| parentId | Int? | FK -> events (self-ref for sub-events) |
| latitude | Decimal(10,8)? | |
| longitude | Decimal(11,8)? | |
| country | String?(255) | |
| region | String?(255) | |
| city | String?(255) | |
| date_original | String?(100) | Raw import value |
| date_uncertainty | String?(20) | |
| end_date_original | String?(100) | |
| end_date_uncertainty | String?(20) | |
| location_confidence | Decimal(3,2)? | |
| location_normalized | String?(255) | |
| title_confidence | Decimal(3,2)? | |
| created_via_import | Boolean | Default false |
| import_batch_id | String?(100) | |

**Relations:** Self-referential parent/subEvents for hierarchical events. Has many personEventRelations. Optional FK to locations.

**Indexes:** date, title, location, userId, parentId, import_batch_id, location_normalized, location_id.

### 2.6 Location (`locations`)

| Field | Type | Notes |
|---|---|---|
| id | Int (autoincrement) | PK |
| name | String | Unique |
| normalized | String? | |
| country | String? | |
| region | String? | |
| city | String? | |
| latitude | Decimal(10,8)? | |
| longitude | Decimal(11,8)? | |
| geocoded_at | DateTime? | |
| created_at | DateTime | |
| updated_at | DateTime | |

**Relations:** Referenced by events (location_ref), persons (birth_location, death_location).

**Indexes:** (country, region, city), (latitude, longitude), name, normalized.

### 2.7 Source (`sources`)

| Field | Type | Notes |
|---|---|---|
| id | Int (autoincrement) | PK |
| userId | String | FK -> User |
| project_id | String? | FK -> Project |
| title | String | |
| url | String? | |
| author | String? | |
| publication | String? | |
| year | Int? | |
| reliability | Decimal(3,2)? | 0.00-1.00 |
| notes | String? | |
| created_at | DateTime | |
| updated_at | DateTime | |

**Relations:** Has many statements, sourceOnRelations.

### 2.8 Statement (`statements`)

| Field | Type | Notes |
|---|---|---|
| id | Int (autoincrement) | PK |
| userId | String | FK -> User |
| project_id | String? | FK -> Project |
| content | String | |
| confidence | Decimal(3,2)? | 0.00-1.00 |
| source_id | Int? | FK -> sources (SetNull on delete) |
| created_at | DateTime | |
| updated_at | DateTime | |

**Relations:** Belongs to source. Has many personEventRelations.

### 2.9 PersonRelation (`person_relations`)

| Field | Type | Notes |
|---|---|---|
| id | Int (autoincrement) | PK |
| from_person_id | Int | FK -> persons |
| to_person_id | Int | FK -> persons |
| relation_type | String(100) | See type list below |
| notes | String? | |

**Person-to-Person Relation Types (32 types):**

| Category | Types |
|---|---|
| **Family** | father, mother, son, daughter, brother, sister, grandfather, grandmother, grandson, granddaughter, uncle, aunt, nephew, niece, cousin |
| **Marriage** | husband, wife, spouse |
| **Professional** | colleague, boss, employee, mentor, mentee, teacher, student |
| **Other** | friend, neighbor, acquaintance, business_partner, rival, enemy |

### 2.10 PersonEventRelation (`person_event_relations`)

| Field | Type | Notes |
|---|---|---|
| id | Int (autoincrement) | PK |
| userId | String | FK -> User |
| project_id | String? | FK -> Project |
| person_id | Int | FK -> persons |
| event_id | Int | FK -> events |
| relationship_type | String | See type list below |
| statement_id | Int? | FK -> statements (SetNull on delete) |
| created_at | DateTime | |
| updated_at | DateTime | |

**Constraint:** Unique on (person_id, event_id, relationship_type).

**Person-Event Relation Types (24 types):**
participant, witness, affected, organizer, leader, member, supporter, opponent, victim, perpetrator, observer, reporter, beneficiary, contributor, influencer, follower, mentor, student, family_member, colleague, friend, enemy, ally, rival

### 2.11 SourceOnRelation (`source_on_relations`)

| Field | Type | Notes |
|---|---|---|
| id | Int (autoincrement) | PK |
| userId | String | FK -> User |
| project_id | String? | FK -> Project |
| source_id | Int | FK -> sources |
| relation_id | Int | FK -> person_event_relations |
| created_at | DateTime | |

**Constraint:** Unique on (source_id, relation_id). Links sources as evidence for person-event relationships.

### 2.12 Literature (`literature`)

| Field | Type | Notes |
|---|---|---|
| id | Int (autoincrement) | PK |
| userId | String | FK -> User |
| project_id | String? | FK -> Project |
| title | String(255) | |
| author | String(255) | |
| publication_year | Int? | |
| type | String(100) | journal, book, chapter, thesis, conference, report, website, etc. |
| description | String? | |
| url | String?(500) | |
| publisher | String?(255) | |
| journal | String?(255) | |
| volume | String?(50) | |
| issue | String?(50) | |
| pages | String?(100) | |
| doi | String?(255) | |
| isbn | String?(50) | |
| issn | String?(50) | |
| language | String?(50) | |
| keywords | String? | |
| abstract | String? | |
| externalId | String?(255) | For sync (Zotero key, Mendeley ID) |
| syncSource | String?(50) | "zotero", "mendeley", "ris" |
| lastSyncedAt | DateTime? | |
| syncMetadata | Json? | |
| createdAt | DateTime | |
| updatedAt | DateTime | |

### 2.13 BibliographySync (`bibliography_syncs`)

| Field | Type | Notes |
|---|---|---|
| id | Int (autoincrement) | PK |
| userId | String | FK -> User |
| service | String(50) | "zotero" or "mendeley" |
| name | String(255) | Connection display name |
| isActive | Boolean | |
| apiKey | String?(500) | Zotero API key |
| apiSecret | String?(500) | |
| accessToken | String?(500) | Mendeley OAuth token |
| refreshToken | String?(500) | Mendeley refresh token |
| tokenExpiresAt | DateTime? | |
| collectionId | String?(255) | Zotero collection filter |
| collectionName | String?(255) | |
| autoSync | Boolean | |
| syncInterval | Int? | |
| lastSyncAt | DateTime? | |
| syncMetadata | Json? | |
| createdAt | DateTime | |
| updatedAt | DateTime | |

**Constraint:** Unique on (userId, service).

### 2.14 EventType (`event_types`)

| Field | Type | Notes |
|---|---|---|
| id | Int (autoincrement) | PK |
| userId | String | FK -> User |
| name | String? | |
| icon | String? | |
| color | String? | |

User-definable event categories (currently unused in the restructured system).

### 2.15 Data Quality Entities

#### ImportHistory (`import_history`)

| Field | Type | Notes |
|---|---|---|
| id | String (cuid) | PK |
| userId | String | FK -> User |
| import_type | String | "persons" or "events" |
| batch_id | String | Unique |
| file_name | String | |
| total_records | Int | |
| imported_count | Int | |
| error_count | Int | |
| skipped_count | Int | |
| processing_time | Int | Milliseconds |
| status | String | |
| error_details | Json? | |
| created_at | DateTime | |

#### DataUncertainty (`data_uncertainty`)

| Field | Type | Notes |
|---|---|---|
| id | Int (autoincrement) | PK |
| userId | String | FK -> User |
| table_name | String(50) | "persons" or "events" |
| record_id | Int | |
| field_name | String(50) | |
| original_value | String? | |
| normalized_value | String? | |
| confidence | Decimal(3,2) | |
| uncertainty_type | String(20) | date, place, name, general |
| created_at | DateTime | |

#### DuplicateMatches (`duplicate_matches`)

| Field | Type | Notes |
|---|---|---|
| id | Int (autoincrement) | PK |
| userId | String | FK -> User |
| table_name | String(50) | |
| record_id | Int | |
| duplicate_id | Int | |
| confidence | Decimal(3,2) | |
| match_reason | String(100) | name_similarity, birth_date_match, birth_place_match |
| status | String(20) | pending, resolved, ignored |
| resolved_action | String?(50) | |
| created_at | DateTime | |
| resolved_at | DateTime? | |

### 2.16 Auth Entities

#### Account (`accounts`)
Standard NextAuth account linking table. Fields: id, userId, type, provider, providerAccountId, refresh_token, access_token, expires_at, token_type, scope, id_token, session_state. Unique on (provider, providerAccountId).

#### Session (`sessions`)
NextAuth session table. Fields: id, sessionToken (unique), userId, expires.

#### VerificationToken (`verification_tokens`)
NextAuth verification token table. Fields: identifier, token (unique), expires. Unique on (identifier, token).

#### EmailConfirmation (`email_confirmations`)
Custom email verification flow. Fields: id, userId, token (unique), expiresAt, createdAt. Indexes on token, userId, expiresAt.

#### PasswordReset (`password_resets`)
Password reset tokens. Fields: id, userId, token (unique), expiresAt, used (boolean), createdAt. Indexes on token, userId, expiresAt.

#### RefreshToken (`refresh_tokens`)
JWT refresh tokens. Fields: id, userId, token (unique), expiresAt, createdAt. Indexes on token, userId, expiresAt.

#### AuthAuditLog (`auth_audit_logs`)
Auth event audit trail. Fields: id, userId?, eventType, ipAddress?, userAgent?, details (Json?), createdAt. Indexes on userId, eventType, createdAt.

**Event types logged:** LOGIN_SUCCESS, LOGIN_FAILED, SIGN_IN, SIGN_OUT, USER_CREATED, ACCOUNT_LINKED.

---

## 3. Functional Features

### 3.1 Person Management

**Routes:** `/persons`, `/persons/create`, `/persons/[id]`, `/persons/import`
**API:** `GET/POST /api/persons`, `GET/PUT/DELETE /api/persons/[id]`, `POST /api/persons/bulk`

- Full CRUD for person records
- Search/filter by name, birth/death dates, birth/death places
- Server-side pagination (configurable page size)
- Detail view showing all person data, related events (via personEventRelations), and person-to-person relations
- Bulk delete operations (`POST /api/persons/bulk`)
- Location references linking birth/death places to the locations table
- Import-originated records tracked with `created_via_import`, `import_batch_id`
- Fuzzy data fields for uncertain dates and places with confidence scores

### 3.2 Event Management

**Routes:** `/events`, `/events/create`, `/events/[id]`, `/events/import`
**API:** `GET/POST /api/events`, `GET/PUT/DELETE /api/events/[eventId]`, `POST /api/events/bulk`

- Full CRUD for event records
- Hierarchical sub-events (self-referential `parentId` relationship)
- Date range support (start date + end date)
- Location fields: free-text location, geocoded coordinates (lat/lng), country/region/city breakdown
- Location reference to the locations table
- Search, filter, sort, and paginate
- Bulk delete operations
- Fuzzy date handling (original value, uncertainty level, confidence)
- Detail view shows related persons via personEventRelations

### 3.3 Location Management

**Routes:** `/locations`, `/locations/[location]`, `/locations/manage`, `/locations-manage`
**API:** `GET/POST /api/locations`, `POST /api/locations/manage`, `GET /api/geocoding`

- Dedicated locations table for normalized, reusable place data
- Map view displaying locations on a Leaflet map
- Geocoding via Nominatim (OpenStreetMap):
  - Forward geocoding (location name -> coordinates)
  - Reverse geocoding (coordinates -> location name)
  - Location search with autocomplete
  - Rate-limited to 1 request/second per Nominatim policy
  - In-memory cache for geocoding results (singleton pattern)
  - Failed request tracking to avoid retries
- Location normalization with historical name mappings (e.g., Constantinople -> Istanbul, Leningrad -> Saint Petersburg)
- Multi-language place name support (e.g., Munchen -> Munich, Wien -> Vienna)
- Location management page for bulk geocoding and data cleanup

### 3.4 Source Management

**Routes:** `/sources`
**API:** `GET/POST /api/sources`, `GET/PUT/DELETE /api/sources/[id]`

- Full CRUD for source records
- Reliability scoring (0.00-1.00 scale)
- Fields: title, url, author, publication, year, notes
- View related statements and person-event relations linked via sourceOnRelations
- Project-scoped

### 3.5 Statement Management

**Routes:** `/statements`
**API:** `GET/POST /api/statements`

- Full CRUD for historical statements/claims
- Confidence scoring (0.00-1.00 scale)
- Links to a source for provenance
- Can be attached to person-event relations
- View related person-event relations
- Project-scoped

### 3.6 Relationship Management

#### Person-to-Person Relations

**Routes:** `/person-relations`
**API:** `GET/POST /api/person-relations`, `PUT/DELETE /api/person-relations/[id]`

- Create directed relationships between two persons
- 32 relation types across 4 categories: Family (15), Marriage (3), Professional (7), Other (7)
- All labels in German (e.g., "Vater", "Mutter", "Ehemann", "Kollege")
- Filter by person or relation type
- Card-based UI with category color coding and icons
- Detail view with notes

#### Person-Event Relations

**Routes:** `/person-event-relations`
**API:** `GET/POST /api/person-event-relations`

- Link persons to events with a typed relationship
- 24 relation types (e.g., participant, witness, affected, organizer, victim, perpetrator)
- All labels in German (e.g., "Teilnehmer", "Zeuge", "Betroffener")
- Color-coded by category: primary (participants), secondary (leaders), error (victims), info (observers), success (supporters), warning (opponents)
- Optional statement attachment for evidentiary backing
- Filter by person, event, or relation type
- Server-side pagination

#### Source-on-Relation Evidence Linking

**API:** `GET/POST/DELETE /api/source-on-relations`

- Attach sources as evidence to person-event relations
- Unique constraint: one source per relation
- Bridges the source -> person-event-relation connection

### 3.7 Literature & Bibliography

**Routes:** `/literature`, `/literature/create`, `/bibliography-sync`
**API:** `GET/POST /api/literature`, `GET/POST/PUT/DELETE /api/bibliography-sync`, `/api/bibliography-sync/[id]`

- Full CRUD for literature/bibliography entries
- Comprehensive bibliographic fields: title, author, year, type, publisher, journal, volume, issue, pages, DOI, ISBN, ISSN, language, keywords, abstract, URL
- External bibliography sync:
  - **Zotero:** API key authentication, optional collection filtering, item type mapping
  - **Mendeley:** OAuth2 flow with token refresh, `/api/auth/mendeley` and `/api/auth/mendeley/callback` routes
  - Upsert logic: creates new entries or updates existing ones based on externalId + syncSource
- **RIS format parsing** (GenericImportService): Parses RIS bibliography files with type mapping (JOUR->journal, BOOK->book, etc.)
- Sync configuration management: create, update, delete, test connections
- Sync metadata and last sync timestamp tracking

### 3.8 Project & Collaboration

**Routes:** `/account/projekte`
**API:** `GET/POST /api/projects`, `GET/PUT/DELETE /api/projects/[id]`, `POST /api/projects/[id]/invite`, `GET/POST /api/projects/[id]/members`, `PUT/DELETE /api/projects/[id]/members/[userId]`, `GET /api/projects/[id]/stats`

- Multi-project workspace: users can create and manage multiple research projects
- Project member management:
  - **Owner:** Full control, can delete project, manage members
  - **Editor:** Can create, read, update, delete data within the project
  - **Viewer:** Read-only access to project data
- Invite members to projects
- Project stats endpoint (counts of persons, events, etc.)
- Global project context (`ProjectContext`) for UI-wide project selection
- All data entities (persons, events, sources, statements, relations) are project-scoped

### 3.9 Import System

**Routes:** `/persons/import`, `/events/import`
**API:** `POST /api/import/persons`, `POST /api/import/events`, `GET /api/import/history`

- **Supported formats:** CSV (via PapaParse), Excel/XLSX (via ExcelJS)
- **Person import:**
  - Maps columns: first_name, last_name, birth_date, birth_place, death_date, death_place, notes
  - Validation: requires at least first_name or last_name
  - Fuzzy date parsing for birth/death dates (handles "c. 1850", "1790?", "before 1900", seasonal dates, DD/MM/YYYY format)
  - Place name normalization (historical names, abbreviations, multi-language)
  - Duplicate detection using Levenshtein distance and name similarity (nickname matching)
  - Date uncertainty tracking (exact, approximate, estimated, unknown)
  - Confidence scores for names, dates, and places
- **Event import:**
  - Maps columns: title, description, date, end_date, location
  - Similar fuzzy date and location normalization
- **Import tracking:**
  - Each import generates a unique batch_id
  - ImportHistory record tracks: file name, total records, imported count, error count, skipped count, processing time, status, error details
  - Imported records tagged with `created_via_import = true` and `import_batch_id`
- **Duplicate detection API:** `POST /api/duplicates/detect`

### 3.10 Search & Filtering

- Server-side search across person names, event titles, locations
- Column-level filtering (e.g., filter by relation type, date range, project)
- Sort by various columns
- Server-side pagination with configurable page size (default 20)
- Autocomplete-style search for persons and events in relation forms

### 3.11 Data Visualization

**Routes:** `/timeline`, `/analytics`

- **Timeline View** (`/timeline`): Chronological display of events with associated persons via personEventRelations
- **Analytics Dashboard** (`/analytics`): Charts showing aggregate data (total persons, total events). Uses MUI X Charts and ECharts.
- **Location Maps:** Leaflet maps showing person locations (birth/death places) and event locations with markers. PersonLocationMap component.
- **Charts:** ECharts (echarts-for-react) for custom visualizations, MUI X Charts for standard charts

### 3.12 Dashboard

**Route:** `/dashboard`
**API:** `GET /api/dashboard/stats`, `GET /api/dashboard/recent-activities`

- Quick stats cards: total persons, total events, total sources, total locations
- Project-aware stats (includes data from all accessible projects)
- Recent activity feed from AuthAuditLog
- Navigation links to key sections

### 3.13 Activity Tracking

**API:** `GET /api/dashboard/recent-activities`

- Auth audit log captures: login success/failure, sign-in, sign-out, user creation, account linking
- Recent activities displayed on dashboard (last 10 entries)
- Activity timestamps formatted in German locale (`de-DE`)

### 3.14 Public Pages

**Routes:** `/funktionen`, `/funktionen/personen`

- Feature showcase / marketing pages (German language)
- Public (not behind auth middleware)

---

## 4. Non-Functional Features

### 4.1 Authentication

- **Provider: Credentials** — Email/password login with bcrypt password hashing (bcryptjs)
- **Provider: Email** — Magic link sign-in via Resend
- **Session strategy:** JWT with 30-day max age
- **Email verification:** Custom flow with token-based verification (`EmailConfirmation` table, 24-hour expiry)
- **Password reset:** Token-based reset flow (`PasswordReset` table, 1-hour expiry, single-use)
- **Resend verification:** Endpoint to resend verification emails (`/api/auth/resend-verification`)
- **User registration:** `/api/register` endpoint with bcrypt hashing
- **Custom Prisma adapter** for NextAuth (customPrismaAdapter.ts)
- **Auth pages:** `/auth/login`, `/auth/register`, `/auth/verify`, `/auth/forgot-password`, `/auth/reset-password`, `/auth/logout-confirmation`

### 4.2 Authorization

- **System roles:** `USER` and `ADMIN` (UserRole enum)
- **Project-level roles:** `owner`, `editor`, `viewer` (stored as string in UserProject)
- **Route protection:** NextAuth middleware protects app routes (dashboard, events, persons, sources, statements, relations, locations, timeline, analytics, activity, account, bibliography-sync, literature)
- **API protection:** `requireUser()` helper function validates JWT and returns user; returns 401 if unauthenticated
- **Project-scoped data access:** API routes filter data by userId and accessible project IDs

### 4.3 Security

- **XSS prevention:** HTML sanitization utility strips `<script>`, `<iframe>`, `javascript:` URLs, and inline event handlers from all string inputs
- **Input validation:** Zod schemas for person, event, and life event validation with German error messages
- **Security headers** (via next.config):
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `X-XSS-Protection: 1; mode=block`
  - `Referrer-Policy: origin-when-cross-origin`
- **API cache headers:** `Cache-Control: no-store, max-age=0` on all API routes
- **`poweredByHeader: false`** in Next.js config
- **Rate limiting:** In-memory rate limiter class (sliding window, configurable window + max requests, default 100 req/min)
- **Auth audit logging:** All auth events logged with userId, eventType, IP address, user agent, and details
- **Password strength validation:** Minimum 8 chars, uppercase, lowercase, number, special character required. Common password blacklist. Client-side strength indicator (score 0-5 with color feedback).

### 4.4 Performance

- **In-memory caching:** TTL-based `Cache` class (default 5-minute TTL). Global singleton instance. Cache keys for persons, events, event types, person details, event details. `withCache` decorator for API routes. Pattern-based cache invalidation.
- **Geocoding cache:** Singleton `GeocodingService` with in-memory cache for geocoding results and failed request tracking
- **Server-side pagination:** All list endpoints support page/limit parameters
- **Database indexing:** Extensive indexes on all frequently queried fields (see entity definitions above)
- **Image optimization:** Next.js image optimization with WebP/AVIF formats, device-responsive sizes, 60-second minimum cache TTL
- **CSS optimization:** `optimizeCss: true` experimental feature
- **Package import optimization:** Tree-shaking for `@mui/material` and `@mui/icons-material`
- **Compression:** `compress: true` in Next.js config

### 4.5 Deployment

- **Platform:** Vercel (serverless)
- **Build command:** `prisma generate && prisma db push && next build`
- **Output:** Standalone mode
- **Database:** Neon PostgreSQL (pooled + unpooled connection URLs)
- **CI/CD:** GitHub Actions (referenced in existing docs)
- **Previous deployment:** VPS with Docker, Nginx, SSL (migrated to Vercel)

### 4.6 Email

- **Service:** Resend (`resend` npm package)
- **Verification email:** Branded HTML template with verify button and fallback link (24-hour expiry)
- **Password reset email:** Branded HTML template with reset button and fallback link (1-hour expiry)
- **Sign-in email:** Magic link via NextAuth EmailProvider through Resend
- **From address:** Configurable via `EMAIL_FROM` env var

### 4.7 Testing

- **Unit/Component:** Jest 30 + React Testing Library + jest-environment-jsdom
- **E2E:** Playwright (`@playwright/test`)
- **API mocking:** MSW (Mock Service Worker) for API route testing
- **Config:** Custom Jest config at `config/jest.config.js`
- **Scripts:** `npm test`, `npm run test:watch`, `npm run test:coverage`
- **Coverage:** Limited (not comprehensive)

### 4.8 Internationalization

- **Primary language:** German (UI labels, form validation messages, error messages)
- **German strings found in:**
  - Zod validation: "Vorname ist erforderlich", "Nachname ist erforderlich", "Titel ist erforderlich", etc.
  - Relation type labels: "Vater", "Mutter", "Teilnehmer", "Zeuge", etc.
  - Import validation: "Mindestens Vor- oder Nachname ist erforderlich", "Ungultiges Geburtsdatum"
  - Fuzzy data warnings: "Geburtsdatum ist unsicher", "Geburtsort konnte ungenau sein"
  - Date formatting: `de-DE` locale for date display
  - Page titles: "Person-Event Beziehungen", etc.
- **Mixed language:** Some validation messages and auth-related text remain in English (password validation, email validation)
- **No i18n framework:** Strings are hardcoded, not externalized

### 4.9 UI Framework & Design

- **Component library:** MUI (Material UI v7) with MUI X extensions
- **Data tables:** MUI X DataGrid for tabular data
- **Date pickers:** MUI X DatePickers (with dayjs adapter)
- **Layout:** Container-based responsive layout with MUI Grid
- **Theme:** Custom theme configuration (`app/lib/config/theme.ts`)
- **Fonts:** Roboto (body), Permanent Marker (decorative) via @fontsource
- **Error handling:** ErrorBoundary component wrapping pages
- **Auth guard:** RequireAuth component for client-side auth checking
- **HTTP client:** Custom `api` wrapper (`app/lib/api/api.ts`) for fetch calls

---

## 5. API Route Summary

| Route | Methods | Purpose |
|---|---|---|
| `/api/auth/[...nextauth]` | GET, POST | NextAuth handler |
| `/api/auth/check-user` | GET | Check if user exists |
| `/api/auth/mendeley` | GET | Mendeley OAuth initiation |
| `/api/auth/mendeley/callback` | GET | Mendeley OAuth callback |
| `/api/auth/resend-verification` | POST | Resend verification email |
| `/api/auth/reset-password` | POST | Reset password with token |
| `/api/auth/reset-request` | POST | Request password reset |
| `/api/auth/verify` | GET/POST | Verify email with token |
| `/api/register` | POST | User registration |
| `/api/analytics` | GET | Aggregate analytics data |
| `/api/bibliography-sync` | GET, POST | List/create sync configs |
| `/api/bibliography-sync/[id]` | GET, PUT, DELETE | Manage sync config |
| `/api/dashboard/stats` | GET | Dashboard statistics |
| `/api/dashboard/recent-activities` | GET | Recent auth activities |
| `/api/duplicates/detect` | POST | Detect duplicate records |
| `/api/events` | GET, POST | List/create events |
| `/api/events/[eventId]` | GET, PUT, DELETE | Manage single event |
| `/api/events/bulk` | POST | Bulk event operations |
| `/api/geocoding` | GET | Forward/reverse geocoding |
| `/api/health` | GET | Health check endpoint |
| `/api/import/events` | POST | Import events from CSV/XLSX |
| `/api/import/history` | GET | Import history log |
| `/api/import/persons` | POST | Import persons from CSV/XLSX |
| `/api/literature` | GET, POST | List/create literature |
| `/api/locations` | GET, POST | List/create locations |
| `/api/locations/manage` | POST | Bulk location management |
| `/api/person-event-relations` | GET, POST | List/create person-event links |
| `/api/person-relations` | GET, POST | List/create person-person links |
| `/api/person-relations/[id]` | PUT, DELETE | Manage person-person link |
| `/api/persons` | GET, POST | List/create persons |
| `/api/persons/[id]` | GET, PUT, DELETE | Manage single person |
| `/api/persons/bulk` | POST | Bulk person operations |
| `/api/projects` | GET, POST | List/create projects |
| `/api/projects/[id]` | GET, PUT, DELETE | Manage single project |
| `/api/projects/[id]/invite` | POST | Invite member to project |
| `/api/projects/[id]/members` | GET, POST | List/add project members |
| `/api/projects/[id]/members/[userId]` | PUT, DELETE | Manage project member |
| `/api/projects/[id]/stats` | GET | Project-specific stats |
| `/api/source-on-relations` | GET, POST, DELETE | Evidence linking |
| `/api/sources` | GET, POST | List/create sources |
| `/api/sources/[id]` | GET, PUT, DELETE | Manage single source |
| `/api/statements` | GET, POST | List/create statements |
| `/api/userProject` | GET | User's project memberships |

---

## 6. Page Route Summary

| Route | Purpose | Auth Required |
|---|---|---|
| `/auth/login` | Login page | No |
| `/auth/register` | Registration page | No |
| `/auth/verify` | Email verification | No |
| `/auth/forgot-password` | Request password reset | No |
| `/auth/reset-password` | Reset password with token | No |
| `/auth/logout-confirmation` | Logout confirmation | No |
| `/funktionen` | Feature showcase (German) | No |
| `/funktionen/personen` | Person feature showcase | No |
| `/dashboard` | Main dashboard with stats | Yes |
| `/persons` | Person list | Yes |
| `/persons/create` | Create person form | Yes |
| `/persons/[id]` | Person detail view | Yes |
| `/persons/import` | Import persons (CSV/XLSX) | Yes |
| `/events` | Event list | Yes |
| `/events/create` | Create event form | Yes |
| `/events/[id]` | Event detail view | Yes |
| `/events/import` | Import events (CSV/XLSX) | Yes |
| `/sources` | Source management | Yes |
| `/statements` | Statement management | Yes |
| `/person-relations` | Person-to-person relations | Yes |
| `/person-event-relations` | Person-event relations | Yes |
| `/locations` | Location list/map | Yes |
| `/locations/[location]` | Location detail | Yes |
| `/locations/manage` | Location management | Yes |
| `/locations-manage` | Location management (alt) | Yes |
| `/literature` | Literature list | Yes |
| `/literature/create` | Create literature entry | Yes |
| `/bibliography-sync` | Bibliography sync config | Yes |
| `/timeline` | Timeline visualization | Yes |
| `/analytics` | Analytics charts | Yes |
| `/activity` | Activity log | Yes |
| `/account/projekte` | Project management | Yes |

---

## 7. Key Libraries & Dependencies

| Library | Version | Purpose |
|---|---|---|
| next | 15.x | React framework |
| react | 19.x | UI library |
| @prisma/client | 6.x | Database ORM |
| next-auth | 4.x | Authentication |
| @mui/material | 7.x | Component library |
| @mui/x-data-grid | 8.x | Data tables |
| @mui/x-charts | 8.x | Charts |
| @mui/x-date-pickers | 8.x | Date pickers |
| leaflet / react-leaflet | 1.9 / 5.0 | Maps |
| echarts / echarts-for-react | 5.6 / 3.0 | Charts |
| zod | 3.x | Schema validation |
| react-hook-form | 7.x | Form management |
| bcryptjs | 3.x | Password hashing |
| resend | 4.x | Email sending |
| papaparse | 5.x | CSV parsing |
| exceljs | 4.x | Excel parsing |
| dayjs | 1.x | Date handling |
| jsonwebtoken | 9.x | JWT utilities |
| axios | 1.x | HTTP client |

---

## 8. Known Architectural Issues

These are documented to inform rebuild decisions, not as bugs to fix:

1. **Mixed naming conventions:** Schema uses both camelCase and snake_case inconsistently (e.g., `createdAt` vs `created_at`, `emailVerified` vs `email_verified`)
2. **Duplicate model naming:** Prisma models use both PascalCase (`User`, `Project`) and lowercase (`persons`, `events`, `sources`, `statements`) with `@@map` directives
3. **Redundant location data:** Location info stored both inline on persons/events (lat, lng, country, region, city) AND in the separate locations table
4. **No true activity tracking:** "Activity" feed just re-uses AuthAuditLog, which only captures auth events — not CRUD actions on data
5. **Mixed language:** German UI strings and English code/validation mixed without i18n framework
6. **event_types table unused:** Defined in schema but not actively used in the restructured system
7. **workosUserId field unused:** Legacy field on User model
8. **Duplicate location management pages:** Both `/locations/manage` and `/locations-manage` exist
9. **Test/debug routes in production:** `/api/test`, `/api/simple-test`, `/api/test-person-event-relations`, `/api/debug/env`, `/datagrid-test`
