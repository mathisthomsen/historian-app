# Codebase Analysis — Evidoxa Design System Discovery

**Date:** 2026-04-02
**Analyst:** ds-codebase-analyst
**Branch:** 2-5_design_system
**Status:** Complete — ready for downstream design system phases

---

## App Overview

### Purpose

Evidoxa is a historical research management platform. It provides structured tools for academic and professional historians to record, link, and analyse historical entities: people, events, primary sources, and the relationships between them. Every data point is annotated with epistemic certainty (Certain / Probable / Possible / Unknown) and source evidence.

### Target Audience

- Individual historians and archivists (primary)
- University research groups (near-term validation target)
- Future: SaaS with collaborative multi-user projects

### Core Features (implemented through Epic 2.4)

1. **Person management** — full CRUD with partial historical dates (year-only or year+month), name variants per language, certainty on birth/death dates
2. **Event management** — full CRUD with hierarchical sub-events, user-defined per-project EventTypes with colors, date uncertainty
3. **Source management** — primary source CRUD (archival documents, letters, photographs, etc.) with reliability tiers and evidence linking
4. **Universal relation engine** — typed, evidenced relations between any two entities; user-defined RelationTypes per project; PropertyEvidence for field-level source annotation; ActivityLog
5. **Authentication** — register → email verify → login → session, password reset, rate limiting
6. **App shell** — collapsible sidebar, topbar, locale switcher (DE/EN), theme toggle (light/dark/system), Sonner toasts

### Product Vision (from roadmap)

The roadmap is organized into five phases:

| Phase | Theme                                                      | Status                                                                   |
| ----- | ---------------------------------------------------------- | ------------------------------------------------------------------------ |
| 1     | Foundation & Auth (Epics 1.1–1.4)                          | Complete                                                                 |
| 2     | Core Research Loop (Epics 2.1–2.6)                         | 2.1–2.4 complete; **2.5 (UI Polish & Brand Tokens) is the current epic** |
| 3     | Research Context — projects, locations, literature, import | Planned                                                                  |
| 4     | Discovery — search, timeline, network graph, analytics     | Planned                                                                  |
| 5     | Export & Production                                        | Planned                                                                  |

Epic 2.5 is explicitly the "UI Polish & Brand Tokens" epic. Its spec mandates: brand tokens in `@theme`, dark/light mode transitions, sidebar collapse animation, page transitions, spacing/radius/shadow consistency, designed empty states and loading skeletons, and DataTable column visibility toggles. **This design system work is the direct prerequisite and enabler of Epic 2.5.**

Epic 2.6 adds public marketing pages using the tokens established in 2.5.

---

## Tech Stack Details

### Core

| Dependency | Version  | Notes                        |
| ---------- | -------- | ---------------------------- |
| Next.js    | ^15.2.1  | App Router, Turbopack in dev |
| React      | ^19.0.0  |                              |
| TypeScript | ^5.8.2   | Strict mode                  |
| pnpm       | 9.15.4   | Required package manager     |
| Node.js    | >=22.0.0 |                              |

### Styling

| Dependency                  | Version | Notes                                       |
| --------------------------- | ------- | ------------------------------------------- |
| tailwindcss                 | ^4.0.12 | **v4 — CSS-first, no `tailwind.config.js`** |
| @tailwindcss/postcss        | ^4.0.12 | PostCSS integration                         |
| postcss                     | ^8.5.3  |                                             |
| class-variance-authority    | ^0.7.1  | CVA for component variant definitions       |
| clsx                        | ^2.1.1  | Utility class merging                       |
| tailwind-merge              | ^2.6.0  | Conflict-aware class merging                |
| prettier-plugin-tailwindcss | ^0.6.11 | Class sort on save                          |

### UI Components

| Dependency                    | Version                | Notes                                            |
| ----------------------------- | ---------------------- | ------------------------------------------------ |
| shadcn/ui                     | (installed components) | `style: "default"`, `baseColor: "zinc"`          |
| @radix-ui/react-alert-dialog  | ^1.1.15                |                                                  |
| @radix-ui/react-avatar        | ^1.1.3                 |                                                  |
| @radix-ui/react-checkbox      | ^1.3.3                 |                                                  |
| @radix-ui/react-dialog        | ^1.1.15                |                                                  |
| @radix-ui/react-dropdown-menu | ^2.1.6                 |                                                  |
| @radix-ui/react-label         | ^2.1.2                 |                                                  |
| @radix-ui/react-popover       | ^1.1.15                |                                                  |
| @radix-ui/react-separator     | ^1.1.2                 |                                                  |
| @radix-ui/react-slot          | ^1.2.4                 |                                                  |
| @radix-ui/react-tabs          | ^1.1.3                 |                                                  |
| @radix-ui/react-toast         | ^1.2.6                 | (installed but Sonner is actually used)          |
| @radix-ui/react-tooltip       | ^1.2.8                 |                                                  |
| cmdk                          | ^1.1.1                 | Command palette primitive                        |
| lucide-react                  | ^0.475.0               | Icon library                                     |
| sonner                        | ^1.7.4                 | Toast notifications (preferred over Radix toast) |

### Theme & i18n

| Dependency  | Version | Notes                                                        |
| ----------- | ------- | ------------------------------------------------------------ |
| next-themes | ^0.4.4  | `attribute="class"`, `defaultTheme="system"`, `enableSystem` |
| next-intl   | ^3.26.3 | `localePrefix: "always"`, `localeDetection: false`           |

### Auth, Data, Infrastructure

| Dependency          | Version       | Notes                                         |
| ------------------- | ------------- | --------------------------------------------- |
| next-auth           | 5.0.0-beta.30 | JWT strategy, Credentials provider            |
| @prisma/client      | ^6.19.2       | Neon PostgreSQL (pooled + direct connections) |
| prisma              | ^6.0.0        | Dev dependency                                |
| @upstash/redis      | ^1.36.3       | Rate limiting + caching                       |
| @upstash/ratelimit  | ^2.0.0        | Sliding window                                |
| resend              | ^4            | Transactional email                           |
| bcryptjs            | ^2.4.3        | Password hashing                              |
| zod                 | ^3.24.2       | Schema validation                             |
| react-hook-form     | ^7            | Forms                                         |
| @hookform/resolvers | ^3            | Zod resolver                                  |
| sanitize-html       | ^2.17.1       | Input sanitization at DB write boundaries     |

### Testing

| Dependency             | Version | Notes                    |
| ---------------------- | ------- | ------------------------ |
| vitest                 | ^3.0.7  | Unit + integration tests |
| @testing-library/react | ^16.2.0 |                          |
| @playwright/test       | ^1.50.1 | E2E                      |
| jsdom                  | ^26.0.0 |                          |

### Fonts

Geist Sans and Geist Mono loaded via `next/font/google`. Variables exposed as `--font-geist-sans` and `--font-geist-mono`, consumed by the `@theme` block as `--font-sans` and `--font-mono`.

---

## Route Inventory

All routes live under `src/app/[locale]/` and are always locale-prefixed (`/de/...`, `/en/...`).

### Root-level

| Route                     | File                                      | Purpose                 | Layout             | Notes                                              |
| ------------------------- | ----------------------------------------- | ----------------------- | ------------------ | -------------------------------------------------- |
| `/`                       | `src/app/page.tsx`                        | Root redirect           | None               | Redirects to `/de`                                 |
| `/{locale}`               | `src/app/[locale]/page.tsx`               | Locale root             | LocaleLayout       | Likely redirects to dashboard or login             |
| `/{locale}/[...catchAll]` | `src/app/[locale]/[...catchAll]/page.tsx` | 404 handler             | LocaleLayout       | Calls `notFound()`                                 |
| `/{locale}/error`         | `src/app/[locale]/error.tsx`              | Error boundary          | LocaleLayout       | Client component, uses `useTranslations`           |
| `/{locale}/loading`       | `src/app/[locale]/loading.tsx`            | Global loading skeleton | None               | Renders sidebar + topbar + card-grid skeleton      |
| `/{locale}/not-found`     | `src/app/[locale]/not-found.tsx`          | 404 page                | None               | Card with 404 + back to home button                |
| `/{locale}/dev/showcase`  | `src/app/[locale]/dev/showcase/page.tsx`  | Component showcase      | None (no AppShell) | Development reference page, all base UI components |

### Auth Routes — `(auth)` layout group

Layout: centered card, `max-w-sm`, `w-full`, no sidebar. Has `LocaleSwitcher` + `ThemeToggle` in top-right corner. Brand name "Evidoxa" as `text-2xl font-bold` heading.

| Route                            | File                                   | Purpose                | Key Components                                   |
| -------------------------------- | -------------------------------------- | ---------------------- | ------------------------------------------------ |
| `/{locale}/auth/login`           | `(auth)/auth/login/page.tsx`           | Sign in                | `LoginForm`                                      |
| `/{locale}/auth/register`        | `(auth)/auth/register/page.tsx`        | Create account         | `RegisterForm`, `PasswordStrengthIndicator`      |
| `/{locale}/auth/verify`          | `(auth)/auth/verify/page.tsx`          | Email verification     | `VerifyEmailCard`                                |
| `/{locale}/auth/forgot-password` | `(auth)/auth/forgot-password/page.tsx` | Password reset request | `ForgotPasswordForm`                             |
| `/{locale}/auth/reset-password`  | `(auth)/auth/reset-password/page.tsx`  | Set new password       | `ResetPasswordForm`, `PasswordStrengthIndicator` |

### App Routes — `(app)` layout group

Layout: `AppShell` — fixed TopBar (h-14), collapsible Sidebar (w-56 open / w-12 collapsed), main content with `pt-14` and dynamic `paddingLeft` set via inline style.

| Route                               | File                                     | Purpose                  | Key Components                                                                                 | Notes                                                                                    |
| ----------------------------------- | ---------------------------------------- | ------------------------ | ---------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `/{locale}/dashboard`               | `(app)/dashboard/page.tsx`               | User dashboard           | `LogoutButton`                                                                                 | Currently minimal: welcome + logout                                                      |
| `/{locale}/persons`                 | `(app)/persons/page.tsx`                 | Person list              | `PersonsListClient`, `DataTable`, `DataTableSearch`, `DataTablePagination`, `BulkDeleteDialog` | SSR, URL-param pagination/sort/search                                                    |
| `/{locale}/persons/new`             | `(app)/persons/new/page.tsx`             | Create person            | `NewPersonClient`, `PersonForm`                                                                |                                                                                          |
| `/{locale}/persons/[id]`            | `(app)/persons/[id]/page.tsx`            | Person detail            | `PersonDetailCard`, `PersonDetailTabs`, `DeletePersonButton`                                   | Tabs: attributes, name variants, events, persons, sources, relations, evidence, activity |
| `/{locale}/persons/[id]/edit`       | `(app)/persons/[id]/edit/page.tsx`       | Edit person              | `EditPersonClient`, `PersonForm`                                                               |                                                                                          |
| `/{locale}/events`                  | `(app)/events/page.tsx`                  | Event list               | `EventsListClient`, `EventFilters`, `DataTable`                                                | SSR, filtering by type + date range                                                      |
| `/{locale}/events/new`              | `(app)/events/new/page.tsx`              | Create event             | `NewEventClient`, `EventForm`                                                                  |                                                                                          |
| `/{locale}/events/[id]`             | `(app)/events/[id]/page.tsx`             | Event detail             | `EventDetailCard`, `EventDetailTabs`, `DeleteEventButton`                                      | Tabs: attributes, sub-events, persons, sources, relations, evidence, activity            |
| `/{locale}/events/[id]/edit`        | `(app)/events/[id]/edit/page.tsx`        | Edit event               | `EditEventClient`, `EventForm`                                                                 |                                                                                          |
| `/{locale}/sources`                 | `(app)/sources/page.tsx`                 | Source list              | `SourceTable`                                                                                  | Includes reliability filter                                                              |
| `/{locale}/sources/new`             | `(app)/sources/new/page.tsx`             | Create source            | `SourceForm`                                                                                   |                                                                                          |
| `/{locale}/sources/[id]`            | `(app)/sources/[id]/page.tsx`            | Source detail            | `SourceDetailCard`, `SourceDetailTabs`, `DeleteSourceButton`                                   | Tabs: details, persons, events, relations, evidence, activity                            |
| `/{locale}/sources/[id]/edit`       | `(app)/sources/[id]/edit/page.tsx`       | Edit source              | `SourceForm`                                                                                   |                                                                                          |
| `/{locale}/relations`               | `(app)/relations/page.tsx`               | Global relations list    | `RelationsDataTable`                                                                           | Client-side pagination, filter by entity type/relation type/certainty                    |
| `/{locale}/settings/event-types`    | `(app)/settings/event-types/page.tsx`    | Event type management    | `EventTypeSettingsTable`                                                                       | Project settings — CRUD for EventTypes                                                   |
| `/{locale}/settings/relation-types` | `(app)/settings/relation-types/page.tsx` | Relation type management | `RelationTypesTable`, `RelationTypeFormDialog`                                                 | Project settings — CRUD for RelationTypes                                                |

### Loading States (per-route)

Dedicated `loading.tsx` files exist for: `persons/`, `persons/[id]/`, `events/`, `events/[id]/`, `sources/`, `sources/[id]/`, `relations/`. These use `PageSkeleton` with appropriate variants.

---

## Component Inventory

### Shell Components (`src/components/shell/`)

| Component        | File                  | Purpose                                              | Props                         | Styling Approach                                                            | shadcn-based?           |
| ---------------- | --------------------- | ---------------------------------------------------- | ----------------------------- | --------------------------------------------------------------------------- | ----------------------- |
| `AppShell`       | `app-shell.tsx`       | Root layout wrapper with sidebar + topbar            | `children`                    | Tailwind, inline `style` for sidebar offset                                 | No                      |
| `TopBar`         | `top-bar.tsx`         | Fixed 56px header with brand, project stub, controls | `onToggleSidebar: () => void` | Tailwind, `h-14 border-b bg-background`                                     | Uses `Button`, `Avatar` |
| `Sidebar`        | `sidebar.tsx`         | Collapsible left navigation panel                    | `isOpen: boolean`             | Tailwind, `w-56`/`w-12` transition                                          | Uses `Separator`        |
| `LocaleSwitcher` | `locale-switcher.tsx` | DE/EN toggle button group                            | None                          | Custom `<button>` elements, `bg-primary text-primary-foreground` for active | No                      |
| `ThemeToggle`    | `theme-toggle.tsx`    | Light/dark toggle icon button                        | None                          | Rotating Sun/Moon icons with CSS transitions                                | Uses `Button`           |
| `ToastDemo`      | `toast-demo.tsx`      | Dev helper for demonstrating toasts                  | None                          | —                                                                           | No                      |

### Auth Components (`src/components/auth/`)

| Component                   | File                            | Purpose                           | Props                 | Styling Approach                                                                   | shadcn-based?                   |
| --------------------------- | ------------------------------- | --------------------------------- | --------------------- | ---------------------------------------------------------------------------------- | ------------------------------- |
| `LoginForm`                 | `LoginForm.tsx`                 | Email/password sign-in form       | None                  | `space-y-4`, alert div for errors                                                  | Uses `Button`, `Input`, `Label` |
| `RegisterForm`              | `RegisterForm.tsx`              | Account creation form             | None                  | Same pattern as LoginForm                                                          | Uses `Button`, `Input`, `Label` |
| `ForgotPasswordForm`        | `ForgotPasswordForm.tsx`        | Password reset request form       | None                  | Same pattern                                                                       | Uses `Button`, `Input`, `Label` |
| `ResetPasswordForm`         | `ResetPasswordForm.tsx`         | New password entry form           | None                  | Same pattern                                                                       | Uses `Button`, `Input`, `Label` |
| `VerifyEmailCard`           | `VerifyEmailCard.tsx`           | Email verification status display | Token from URL params | Status icon + message                                                              | Uses `Button`, `Card`           |
| `PasswordStrengthIndicator` | `PasswordStrengthIndicator.tsx` | 5-segment password strength meter | `password: string`    | 5 coloured flex divs using Tailwind color utilities (red/orange/yellow/lime/green) | No                              |
| `LogoutButton`              | `LogoutButton.tsx`              | Sign out trigger                  | `label: string`       | —                                                                                  | Uses `Button`                   |

### Research Components (`src/components/research/`)

| Component                                                         | File                                           | Purpose                                      | Props                                                                           | Styling Approach                                                                                                 | shadcn-based?                                  |
| ----------------------------------------------------------------- | ---------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| `DataTable`                                                       | `DataTable.tsx`                                | Generic sortable table with row selection    | `data, columns, selectedIds, onSelectionChange, onRowClick`                     | Wraps shadcn `Table`; native `<input type="checkbox">` with `rounded border border-input`                        | Yes (Table)                                    |
| `DataTablePagination`                                             | `DataTablePagination.tsx`                      | Prev/Next pagination controls                | `page, totalPages, onPageChange, prevLabel?, nextLabel?, pageLabel?`            | `flex items-center justify-center gap-4`                                                                         | Uses `Button`                                  |
| `DataTableSearch`                                                 | `DataTableSearch.tsx`                          | Debounced search input                       | `value, onChange, placeholder?`                                                 | —                                                                                                                | Uses `Input`                                   |
| `BulkDeleteDialog`                                                | `BulkDeleteDialog.tsx`                         | Confirm bulk delete                          | `count, open, onConfirm, onCancel`                                              | —                                                                                                                | Uses `AlertDialog`                             |
| `PersonForm`                                                      | `PersonForm.tsx`                               | Create/edit person form                      | `mode, initial?, projectId, onSuccess, onCancel?`                               | `space-y-6`; date sections use `rounded-md border p-4`; textarea styled manually                                 | Uses `Button`, `Input`, `Label`                |
| `PersonDetailCard`                                                | `PersonDetailCard.tsx`                         | Person attribute display                     | `person, projectId, locale`                                                     | `<dl>` grid `grid-cols-1 gap-4 sm:grid-cols-2`; labels `text-xs font-medium text-muted-foreground`               | No (custom `<dl>`)                             |
| `PersonDetailTabs`                                                | `PersonDetailTabs.tsx`                         | Tab container for person detail page         | `attributesContent, namesContent, personId, personLabel, projectId, tabCounts?` | CountBadge inline: `rounded-full bg-muted px-1.5 py-0.5 text-xs`                                                 | Uses `Tabs`                                    |
| `PersonNameList`                                                  | `PersonNameList.tsx`                           | Dynamic name variant rows (add/remove)       | `value, onChange, disabled?`                                                    | —                                                                                                                | Uses `Button`, `Input`, `Label`, `Checkbox`    |
| `PersonsListClient`                                               | `PersonsListClient.tsx`                        | Client wrapper for person list page          | `persons, total, page, totalPages, locale, projectId?, search, sort, order`     | `space-y-4`                                                                                                      | Uses `Button`, `DataTable`                     |
| `CertaintySelector`                                               | `CertaintySelector.tsx`                        | Four-state certainty toggle buttons          | `value: Certainty, onChange, disabled?, label?`                                 | Custom `<button>` group; active: `bg-primary text-primary-foreground`, inactive: `bg-background text-foreground` | No                                             |
| `PartialDateInput`                                                | `PartialDateInput.tsx`                         | Year/month/day partial date picker           | `yearValue, monthValue, dayValue, onChange* x3, disabled?, label`               | `<fieldset>`, year and day use `Input`; month uses a raw `<select>` styled with Tailwind to match Input          | Partial (Input, Label)                         |
| `EventForm`                                                       | `EventForm.tsx`                                | Create/edit event form                       | `mode, initial?, projectId, onSuccess, onCancel?`                               | Same pattern as PersonForm                                                                                       | Uses `Button`, `Input`, `Label`                |
| `EventDetailCard`                                                 | `EventDetailCard.tsx`                          | Event attribute display                      | `event, projectId, locale`                                                      | Same `<dl>` grid pattern as PersonDetailCard                                                                     | No                                             |
| `EventDetailTabs`                                                 | `EventDetailTabs.tsx`                          | Tab container for event detail page          | Similar to PersonDetailTabs                                                     | Same CountBadge pattern                                                                                          | Uses `Tabs`                                    |
| `EventFilters`                                                    | `EventFilters.tsx`                             | Event list filter controls                   | `projectId, values, onChange`                                                   | Inline selects + inputs                                                                                          | Uses `Input`, `Button`                         |
| `EventTypeCombobox`                                               | `EventTypeCombobox.tsx`                        | Event type selector with create-inline       | `projectId, value, onChange`                                                    | —                                                                                                                | Uses `Command`, `Popover`                      |
| `EventTypeColorPicker`                                            | `EventTypeColorPicker.tsx`                     | Hex color picker for event types             | `value, onChange`                                                               | Preset colour swatches                                                                                           | Custom                                         |
| `EventTypeSettingsTable`                                          | `EventTypeSettingsTable.tsx`                   | CRUD table for event types                   | `projectId`                                                                     | Inline edit rows inside shadcn Table                                                                             | Uses `Table`, `Button`, `Input`, `AlertDialog` |
| `EventsListClient`                                                | `EventsListClient.tsx`                         | Client wrapper for events list               | Events + pagination state                                                       | Same list pattern                                                                                                | Uses `Button`, `DataTable`                     |
| `NewEventClient` / `EditEventClient`                              | `NewEventClient.tsx` / `EditEventClient.tsx`   | Client wrappers for event create/edit pages  | Initial data + navigation                                                       | `space-y-6 p-6`                                                                                                  | —                                              |
| `NewPersonClient` / `EditPersonClient`                            | `NewPersonClient.tsx` / `EditPersonClient.tsx` | Client wrappers for person create/edit pages | Initial data + navigation                                                       | `space-y-6 p-6`                                                                                                  | —                                              |
| `SourceForm`                                                      | `SourceForm.tsx`                               | Create/edit source form                      | `mode, initial?, projectId, onSuccess, onCancel?`                               | Same pattern                                                                                                     | Uses `Button`, `Input`, `Label`                |
| `SourceDetailCard`                                                | `SourceDetailCard.tsx`                         | Source attribute display                     | `source, locale, projectId`                                                     | Same `<dl>`-style grid using `<div class="space-y-1">` and `<p>` tags (no `<dl>/<dt>/<dd>`)                      | No                                             |
| `SourceDetailTabs`                                                | `SourceDetailTabs.tsx`                         | Tab container for source detail              | Similar to other detail tabs                                                    | Same CountBadge                                                                                                  | Uses `Tabs`                                    |
| `SourceTable`                                                     | `SourceTable.tsx`                              | Source list client component                 | Sources + filters                                                               | —                                                                                                                | Uses `DataTable`, `Button`                     |
| `DeletePersonButton` / `DeleteEventButton` / `DeleteSourceButton` | `Delete*.tsx`                                  | Per-entity delete with confirm dialog        | `id, locale, label`                                                             | —                                                                                                                | Uses `Button`, `AlertDialog`                   |
| `ReliabilityBadge`                                                | `ReliabilityBadge.tsx`                         | Coloured reliability tier badge              | `reliability: SourceReliability`                                                | Hard-coded Tailwind colour classes: `border-green-600 bg-green-50 text-green-700` etc.                           | Uses `Badge`                                   |
| `DateRangeFilterInfo`                                             | `DateRangeFilterInfo.tsx`                      | Tooltip explaining date range filter         | —                                                                               | —                                                                                                                | Uses `Tooltip`                                 |
| `EntityEvidenceTab`                                               | `EntityEvidenceTab.tsx`                        | Per-entity evidence listing tab              | `projectId, entityType, entityId`                                               | `space-y-4`                                                                                                      | Uses `PropertyEvidencePanel`                   |

### Relations Components (`src/components/relations/`)

| Component               | File                        | Purpose                                           | Props                                                                           | Styling Approach                                                                                                               | shadcn-based?                             |
| ----------------------- | --------------------------- | ------------------------------------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------- |
| `RelationsTab`          | `RelationsTab.tsx`          | Outgoing/incoming relation lists on entity detail | `projectId, entityType, entityId, entityLabel, filterToEntityType?, onRefresh?` | Section headers `text-xs font-medium uppercase tracking-wide text-muted-foreground`                                            | Uses `Button`, `Separator`                |
| `RelationRow`           | `RelationRow.tsx`           | Single relation item with expand/edit/delete      | `relation, onEdit, onDeleted, onEvidenceChange?`                                | Card-like row                                                                                                                  | Uses `Button`, `Badge`                    |
| `RelationFormDialog`    | `RelationFormDialog.tsx`    | Create/edit relation modal                        | `open, onOpenChange, projectId, prefill*, editRelation?, onSuccess`             | `max-w-lg` dialog; collapsible sections (temporal validity, evidence) using raw `<div class="rounded-md border">` + `<button>` | Uses `Dialog`, `Button`, `Input`, `Label` |
| `RelationTypeSelector`  | `RelationTypeSelector.tsx`  | Dropdown to pick a RelationType                   | `allTypes, fromType, toType, value, onChange`                                   | Native `<select>` styled with Tailwind                                                                                         | Custom                                    |
| `EntitySelector`        | `EntitySelector.tsx`        | Search-and-select for any entity type             | `value, onChange, projectId, disabled?, displayLabel?, allowedTypes?`           | Uses `Command`/`Popover` combo                                                                                                 | Uses `Command`, `Popover`                 |
| `PropertyEvidenceBadge` | `PropertyEvidenceBadge.tsx` | Click-to-open evidence count badge on each field  | `projectId, entityType, entityId, property, fieldLabel`                         | `Badge` in `Popover` trigger                                                                                                   | Uses `Badge`, `Popover`                   |
| `PropertyEvidencePanel` | `PropertyEvidencePanel.tsx` | Evidence list + add form in popover               | `projectId, entityType, entityId, property, onEvidenceChange`                   | `space-y-3 p-3`                                                                                                                | Uses `Button`, `Input`, `Label`           |
| `EvidenceList`          | `EvidenceList.tsx`          | List of relation evidence items                   | `relationId, projectId`                                                         | `space-y-2`                                                                                                                    | Uses `Button`                             |
| `EvidenceForm`          | `EvidenceForm.tsx`          | Add evidence form for a relation                  | `relationId, projectId, onSuccess`                                              | Same form pattern                                                                                                              | Uses `Button`, `Input`, `Label`           |
| `ActivityLog`           | `ActivityLog.tsx`           | Entity activity/audit trail feed                  | `projectId, entityType, entityId, refreshKey?`                                  | Feed items with Avatar + text; hardcoded German relative time strings                                                          | Uses `Avatar`, `Button`                   |

### shadcn/ui Components (`src/components/ui/`)

| Component                                                                                                            | File                | Variants / API                                                                                                                                    |
| -------------------------------------------------------------------------------------------------------------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Button`                                                                                                             | `button.tsx`        | variants: `default`, `destructive`, `outline`, `secondary`, `ghost`, `link`; sizes: `default` (h-10), `sm` (h-9), `lg` (h-11), `icon` (h-10 w-10) |
| `Badge`                                                                                                              | `badge.tsx`         | variants: `default`, `secondary`, `destructive`, `outline`                                                                                        |
| `Input`                                                                                                              | `input.tsx`         | Single variant; `h-9`, `rounded-md border border-input`                                                                                           |
| `Label`                                                                                                              | `label.tsx`         | Standard Radix label                                                                                                                              |
| `Card` / `CardHeader` / `CardTitle` / `CardDescription` / `CardContent` / `CardFooter`                               | `card.tsx`          | `rounded-xl border bg-card shadow`; padding p-6                                                                                                   |
| `Avatar` / `AvatarFallback`                                                                                          | `avatar.tsx`        | Standard Radix avatar                                                                                                                             |
| `Skeleton` / `PageSkeleton`                                                                                          | `skeleton.tsx`      | `animate-pulse bg-primary/10`; PageSkeleton variants: `list`, `detail`, `card-grid`                                                               |
| `Dialog` / `DialogContent` / `DialogHeader` / `DialogTitle` / `DialogDescription` / `DialogFooter` / `DialogTrigger` | `dialog.tsx`        | Standard Radix dialog                                                                                                                             |
| `AlertDialog` and sub-components                                                                                     | `alert-dialog.tsx`  | Destructive confirmation pattern                                                                                                                  |
| `DropdownMenu` and sub-components                                                                                    | `dropdown-menu.tsx` | Not yet used in app shell (user menu is just Avatar with no dropdown)                                                                             |
| `Checkbox`                                                                                                           | `checkbox.tsx`      | Radix checkbox                                                                                                                                    |
| `Command` / `CommandInput` / etc.                                                                                    | `command.tsx`       | Used in EntitySelector and EventTypeCombobox                                                                                                      |
| `Popover` / `PopoverContent` / `PopoverTrigger`                                                                      | `popover.tsx`       | Used in PropertyEvidenceBadge, EntitySelector                                                                                                     |
| `Separator`                                                                                                          | `separator.tsx`     | Thin divider line                                                                                                                                 |
| `Table` / `TableHeader` / `TableBody` / `TableHead` / `TableRow` / `TableCell`                                       | `table.tsx`         | Standard table structure                                                                                                                          |
| `Tabs` / `TabsList` / `TabsTrigger` / `TabsContent`                                                                  | `tabs.tsx`          | Used in all entity detail pages                                                                                                                   |
| `Tooltip` / `TooltipProvider` / `TooltipContent` / `TooltipTrigger`                                                  | `tooltip.tsx`       | Used in DateRangeFilterInfo                                                                                                                       |

---

## Current Design State

### Existing CSS Custom Properties and Tokens

All tokens are defined in `src/styles/globals.css` using Tailwind v4's `@theme` block. The scheme is a direct shadcn/ui "zinc" base color implementation.

#### Light Mode Tokens (`@theme` block)

| Token                            | Value                                                          | Role                                            |
| -------------------------------- | -------------------------------------------------------------- | ----------------------------------------------- |
| `--font-sans`                    | `var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif` | Body font                                       |
| `--font-mono`                    | `var(--font-geist-mono), ui-monospace, monospace`              | Code/mono font                                  |
| `--color-background`             | `hsl(0 0% 100%)`                                               | Page background — pure white                    |
| `--color-foreground`             | `hsl(240 10% 3.9%)`                                            | Default text — near-black with slight blue tint |
| `--color-card`                   | `hsl(0 0% 100%)`                                               | Card background (identical to background)       |
| `--color-card-foreground`        | `hsl(240 10% 3.9%)`                                            | Card text                                       |
| `--color-popover`                | `hsl(0 0% 100%)`                                               | Popover background                              |
| `--color-popover-foreground`     | `hsl(240 10% 3.9%)`                                            | Popover text                                    |
| `--color-primary`                | `hsl(240 5.9% 10%)`                                            | Primary — very dark zinc (near-black)           |
| `--color-primary-foreground`     | `hsl(0 0% 98%)`                                                | Text on primary — near-white                    |
| `--color-secondary`              | `hsl(240 4.8% 95.9%)`                                          | Secondary — very light zinc                     |
| `--color-secondary-foreground`   | `hsl(240 5.9% 10%)`                                            | Text on secondary                               |
| `--color-muted`                  | `hsl(240 4.8% 95.9%)`                                          | Muted backgrounds (same as secondary)           |
| `--color-muted-foreground`       | `hsl(240 3.8% 46.1%)`                                          | Muted text — medium grey                        |
| `--color-accent`                 | `hsl(240 4.8% 95.9%)`                                          | Accent (same as muted/secondary in light mode)  |
| `--color-accent-foreground`      | `hsl(240 5.9% 10%)`                                            | Text on accent                                  |
| `--color-destructive`            | `hsl(0 84.2% 60.2%)`                                           | Danger red                                      |
| `--color-destructive-foreground` | `hsl(0 0% 98%)`                                                | Text on destructive                             |
| `--color-border`                 | `hsl(240 5.9% 90%)`                                            | Default border — light zinc                     |
| `--color-input`                  | `hsl(240 5.9% 90%)`                                            | Input border                                    |
| `--color-ring`                   | `hsl(240 5.9% 10%)`                                            | Focus ring — dark zinc                          |
| `--radius`                       | `0.5rem`                                                       | Base border-radius                              |

#### Dark Mode Overrides (`.dark` class)

| Token                        | Value                 | Change from light         |
| ---------------------------- | --------------------- | ------------------------- |
| `--color-background`         | `hsl(240 10% 3.9%)`   | Very dark blue-grey       |
| `--color-foreground`         | `hsl(0 0% 98%)`       | Near-white                |
| `--color-primary`            | `hsl(0 0% 98%)`       | Inverted: near-white      |
| `--color-primary-foreground` | `hsl(240 5.9% 10%)`   | Dark                      |
| `--color-secondary`          | `hsl(240 3.7% 15.9%)` | Dark zinc                 |
| `--color-muted`              | `hsl(240 3.7% 15.9%)` | Dark zinc                 |
| `--color-muted-foreground`   | `hsl(240 5% 64.9%)`   | Medium grey               |
| `--color-accent`             | `hsl(240 3.7% 15.9%)` | Dark zinc                 |
| `--color-destructive`        | `hsl(0 62.8% 30.6%)`  | Darker red                |
| `--color-border`             | `hsl(240 3.7% 15.9%)` | Dark zinc (same as muted) |
| `--color-input`              | `hsl(240 3.7% 15.9%)` | Dark zinc                 |
| `--color-ring`               | `hsl(240 4.9% 83.9%)` | Light grey                |

#### Missing Tokens (not yet defined)

- No `--shadow-*` tokens — shadows hardcoded in components (e.g., Card uses `shadow` class = Tailwind default)
- No `--spacing-*` tokens — all spacing uses raw Tailwind classes
- No `--font-size-*` tokens — font sizes use raw Tailwind classes (`text-xs`, `text-sm`, `text-base`, `text-lg`, `text-xl`, `text-2xl`, `text-3xl`)
- No `--font-weight-*` tokens
- No `--transition-*` tokens — no theme transitions defined at all

### Typography Usage

The app uses Geist Sans exclusively for UI text. Font sizes are applied through raw Tailwind utilities without a formal scale:

| Usage pattern                | Tailwind class                                                      | Location                                                                     |
| ---------------------------- | ------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Page headings                | `text-2xl font-bold`                                                | All list/detail page titles (persons, events, sources, relations, dashboard) |
| Showcase heading             | `text-3xl font-bold`                                                | dev/showcase page                                                            |
| Auth brand name              | `text-2xl font-bold tracking-tight`                                 | Auth layout                                                                  |
| Section headings             | `text-xl font-semibold`                                             | Showcase section headers                                                     |
| TopBar brand                 | `text-lg font-semibold`                                             | TopBar component                                                             |
| Tab counter badge            | `text-xs font-normal tabular-nums`                                  | PersonDetailTabs CountBadge                                                  |
| Nav items                    | `text-sm text-muted-foreground`                                     | Sidebar links                                                                |
| Body / form labels           | `text-sm font-medium`                                               | Labels, detail field labels                                                  |
| Field labels in detail cards | `text-xs font-medium text-muted-foreground`                         | PersonDetailCard, EventDetailCard, SourceDetailCard                          |
| Field values in detail cards | `text-sm`                                                           | Same components                                                              |
| Error messages               | `text-xs text-destructive`                                          | Form validation errors                                                       |
| Muted helper text            | `text-sm text-muted-foreground`                                     | Empty states, pagination info, section labels                                |
| Relation section headers     | `text-xs font-medium uppercase tracking-wide text-muted-foreground` | RelationsTab                                                                 |

**No `<h2>–<h6>` semantic hierarchy** in page content — all headings are `<h1>` with varying Tailwind size utilities. Showcase uses `<h2 className="text-xl font-semibold">` but this is not replicated in app pages.

### Color Usage (Beyond the Token System)

The following semantic colors are applied directly via Tailwind outside the design token system. These represent a significant gap that the design system needs to address:

**Hardcoded Tailwind color classes (not in tokens):**

| Usage                          | Classes                                                                                  | Component                 |
| ------------------------------ | ---------------------------------------------------------------------------------------- | ------------------------- |
| Password strength: weak        | `bg-red-500`                                                                             | PasswordStrengthIndicator |
| Password strength: fair        | `bg-orange-500`                                                                          | PasswordStrengthIndicator |
| Password strength: okay        | `bg-yellow-500`                                                                          | PasswordStrengthIndicator |
| Password strength: good        | `bg-lime-500`                                                                            | PasswordStrengthIndicator |
| Password strength: strong      | `bg-green-500`                                                                           | PasswordStrengthIndicator |
| Reliability HIGH               | `border-green-600 bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300`      | ReliabilityBadge          |
| Reliability MEDIUM             | `border-yellow-600 bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300` | ReliabilityBadge          |
| Reliability LOW                | `border-red-600 bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300`                | ReliabilityBadge          |
| Login success (password reset) | `bg-green-50 text-green-800 dark:bg-green-950 dark:text-green-200`                       | LoginForm                 |
| Primary tag on name variants   | `bg-primary/10 text-primary`                                                             | PersonDetailPage (inline) |
| Language tag on name variants  | `bg-muted text-muted-foreground`                                                         | PersonDetailPage (inline) |
| Source type chip               | `bg-muted text-xs` (rounded)                                                             | SourceDetailCard (inline) |
| Skeleton pulse                 | `bg-primary/10`                                                                          | Skeleton, Loading page    |
| Loading skeleton bar           | `bg-primary/5`                                                                           | Loading page topbar area  |

**Critically, there is no `--color-success`, `--color-warning`, `--color-info` token** — semantic status colours are entirely absent from the token system.

### Spacing Patterns

The app uses these recurring spatial patterns (raw Tailwind classes, not tokenized):

| Pattern                    | Classes                             | Usage                                                                             |
| -------------------------- | ----------------------------------- | --------------------------------------------------------------------------------- |
| Page container             | `space-y-6 p-6`                     | All main page wrappers (dashboard, persons, events, sources, relations, settings) |
| Page header row            | `flex items-center justify-between` | All list/detail page headers                                                      |
| Card inner padding         | `p-6` (via CardContent)             | shadcn Card default                                                               |
| Form vertical spacing      | `space-y-6`                         | All forms                                                                         |
| Form field spacing         | `space-y-1`                         | Label + input pairs                                                               |
| Form section (date groups) | `space-y-3 rounded-md border p-4`   | PersonForm date sections                                                          |
| Dialog content             | `space-y-4`                         | RelationFormDialog                                                                |
| Tab content                | `mt-4`                              | All `TabsContent`                                                                 |
| List item spacing          | `space-y-2` or `space-y-4`          | Relation lists, etc.                                                              |
| Inline icon + text gap     | `gap-2`                             | Most `flex` rows                                                                  |
| Button group gap           | `gap-2` or `gap-3`                  | Action button clusters                                                            |
| TopBar height              | `h-14`                              | Fixed 56px                                                                        |
| Sidebar widths             | `w-56` (224px) / `w-12` (48px)      | Expanded / collapsed                                                              |

The `p-6` page container (24px) is consistent across all app pages. The notable exception is the showcase page which uses `p-8 max-w-4xl mx-auto`.

### Identified Inconsistencies

#### 1. Pagination labels hardcoded in German

`DataTablePagination` defaults `prevLabel="Zurück"` and `nextLabel="Weiter"` — these are hardcoded German strings, not using `next-intl`. The `PersonsListClient` passes no labels (accepts defaults). This means the component is not properly internationalized.

#### 2. ActivityLog has hardcoded German strings

`ActivityLog.tsx` contains:

- `"gerade eben"` (just now)
- `"vor ${diffMin} Min"` (X minutes ago)
- `"vor ${diffH} Std"` (X hours ago)
- `"vor ${diffD} Tagen"` (X days ago)
- `"Mehr laden"` (Load more)

None of these go through `next-intl`. They are hardcoded German.

#### 3. PersonForm Cancel button not translated

`PersonForm.tsx` line 290: `<Button>Cancel</Button>` — the label "Cancel" is hardcoded English (not `t("cancel")` or similar).

#### 4. RelationFormDialog: temporal validity field placeholders hardcoded in German

`RelationFormDialog.tsx` uses `placeholder="Jahr"` and `placeholder="Monat"` — German strings not going through `next-intl`.

#### 5. PersonsListClient: count text hardcoded

Line: `{total} {total === 1 ? "Person" : "Personen"}` — hardcoded German strings, not using `t()`.

#### 6. Native `<select>` vs shadcn Select

Multiple components use a raw `<select>` element styled with custom Tailwind classes to approximate the `Input` appearance:

- `PartialDateInput` (month selector)
- `RelationsDataTable` (three filter selects)

These are visually inconsistent with other controls and lack the option dropdown styling of a proper shadcn `Select` component. There is no `Select` component in `src/components/ui/`.

#### 7. Native `<textarea>` vs none (no shadcn Textarea)

Forms use a raw `<textarea>` with manually-written Tailwind classes to match the `Input` appearance. The classes duplicate `Input`'s styles with minor differences:

- `PersonForm` notes textarea: `flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50`
- `RelationFormDialog` notes textarea: `w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring`

Note the differences: `bg-transparent` vs `bg-background`, presence vs absence of `shadow-sm` and `flex`. There is no `Textarea` component in `src/components/ui/`.

#### 8. Detail card markup inconsistency

`PersonDetailCard` and `EventDetailCard` use semantic `<dl>/<dt>/<dd>` elements; `SourceDetailCard` uses `<div>/<p>/<div>` — the same visual output through different HTML semantics. This matters for accessibility (screen readers use `<dl>` landmarks).

#### 9. DropdownMenu imported but user menu non-functional

`DropdownMenu` is installed as a shadcn component but the `TopBar` renders an `Avatar` with no dropdown — the user menu is listed as a placeholder button stub (`aria-label="User menu"` exists as a translation key but no component uses it).

#### 10. Sidebar offset is inline style

`AppShell` uses `style={{ paddingLeft: isOpen ? "14rem" : "3rem" }}` — these are exact numeric values that must stay in sync with the Tailwind `w-56` (14rem) and `w-12` (3rem) sidebar width classes. If the sidebar widths ever change, this inline style must be updated manually.

#### 11. No page transition animations

The App Router layout has no route transition logic. Epic 2.5 explicitly mandates page transition animations. Currently hard cuts between routes.

#### 12. No theme transition CSS

Switching between light and dark mode produces an instant color change. No `transition` property is applied to the root or body. Epic 2.5 mandates smooth transitions.

#### 13. Sidebar has no CSS transition for collapse animation

`AppShell.main` has `transition-all duration-200` but this transitions `padding-left` (the content shift). The `Sidebar` itself has `transition-all duration-200` on its `aside` element for width changes — this is present. However, the `AppShell.main` padding transition is driven by an inline style change, not a CSS variable transition. The two may not be perfectly synchronized.

#### 14. `@radix-ui/react-toast` installed but Sonner used instead

The `@radix-ui/react-toast` package (and its shadcn wrapper) are installed but `sonner` is used exclusively for toasts. This creates dead code in `src/components/ui/` (if a Radix toast component was scaffolded).

#### 15. Button-like `<Link>` patterns are inconsistent

Several pages render navigation CTAs as manually-styled `<Link>` elements rather than `<Button asChild>`:

- `PersonsPage`: `<Link className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">` — this duplicates the `Button` default variant styles manually.
- `PersonsListClient` empty state: same pattern.
- `PersonDetailPage` edit link: `<Link className="inline-flex items-center rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted">` — duplicates the `Button outline` variant without focus ring styles.

These should use `<Button asChild>` to stay consistent with the design system.

---

## Content & i18n

### Language Configuration

| Setting           | Value                                                            |
| ----------------- | ---------------------------------------------------------------- |
| Default locale    | `de` (German)                                                    |
| Additional locale | `en` (English)                                                   |
| Routing           | `localePrefix: "always"` — every URL has `/de/` or `/en/` prefix |
| Detection         | `localeDetection: false` — no Accept-Language header sniffing    |
| Persistence       | `NEXT_LOCALE` cookie, set client-side in LocaleSwitcher          |

### Translation Namespaces (from `messages/de.json` and `messages/en.json`)

Both files are fully in sync with identical key structures:

| Namespace          | Key count (approx.) | Coverage                                                                            |
| ------------------ | ------------------- | ----------------------------------------------------------------------------------- |
| `common`           | 6                   | Loading, error, 404, navigation                                                     |
| `shell`            | 12                  | Nav labels, topbar, locale switcher                                                 |
| `auth`             | ~35                 | All auth flow UI (login, register, verify, forgot, reset, strength, fields, errors) |
| `showcase`         | 14                  | Dev showcase labels                                                                 |
| `events`           | ~50                 | Event CRUD, list, detail, bulk, date, certainty, errors                             |
| `event_types`      | ~15                 | Event type CRUD                                                                     |
| `persons`          | ~45                 | Person CRUD, list, detail, bulk, date, certainty, names, errors                     |
| `sources`          | ~40                 | Source CRUD, list, detail, bulk, reliability, types, errors                         |
| `relations`        | ~35                 | Relation CRUD, list, filter, evidence, validity                                     |
| `relationTypes`    | ~15                 | RelationType CRUD                                                                   |
| `propertyEvidence` | ~10                 | Property evidence CRUD                                                              |
| `entityActivity`   | ~5                  | Activity log labels                                                                 |

### i18n Gaps

- `ActivityLog.tsx` relative time strings are hardcoded German, not in any message file
- `DataTablePagination` defaults are hardcoded German
- `RelationFormDialog` temporal validity placeholders are German
- `PersonForm` cancel button is English
- `PersonsListClient` person count is German

### Text Expansion Considerations

German text is consistently longer than English (roughly 20–30% longer on average). This is already visible in the UI: "Ereignistypen" (15 chars) vs "Event Types" (11 chars), "Verifizierungs-E-Mail gesendet" vs "Verification email sent". Components with fixed-width containers (sidebar nav items with `truncate`, tab triggers) need to be designed to handle German string lengths as the baseline.

---

## Key Findings & Recommendations

These findings must directly inform the UX/UI concept and design token decisions for Epic 2.5.

### Finding 1: The color system has no semantic layer

The current token set is purely structural (background, foreground, card, border, input, ring) with no semantic colors for success, warning, info, or status communication. The app already needs these: reliability badges (high=green, medium=yellow, low=red), password strength (5-color scale), and login success state all use hardcoded Tailwind color utilities. The design system must introduce `--color-success`, `--color-warning`, `--color-info`, and potentially `--color-success-foreground` etc., with both light and dark values.

### Finding 2: Primary color is generic (near-black) — no brand identity

The current `--color-primary` is `hsl(240 5.9% 10%)` in light mode — this is effectively black. The design system needs a real brand primary color. The roadmap explicitly calls for "brand tokens" as the deliverable of Epic 2.5. Given the domain (historical research), a considered decision should be made: warmer archival tones (sepia, aged-paper yellows), or something more contemporary/academic (deep blue, slate). This decision is the single most important input from the brand strategy phase.

### Finding 3: No shadow scale or elevation system

Cards use a single `shadow` utility (Tailwind default `0 1px 3px rgba(0,0,0,0.1)`). There is no elevation hierarchy. For a data-dense application with modals, popovers, and nested panels, a 3-level shadow scale (subtle/medium/elevated) is essential.

### Finding 4: Border-radius is a single `--radius: 0.5rem` — needs a scale

The app uses `rounded-md` (calc on `--radius`), `rounded-xl` (Card), `rounded-full` (CountBadge, Avatar, skeleton circles), `rounded` (inline tags). These should be derived from a radius scale token (`--radius-sm`, `--radius-md`, `--radius-lg`, `--radius-full`).

### Finding 5: No transition/animation tokens

Epic 2.5 requires smooth theme transitions, sidebar animation, and page transitions. Currently there are zero CSS `transition` properties on any semantic layer tokens. The design system must define `--transition-colors` (for theme switching) and potentially `--transition-sidebar` animation values.

### Finding 6: Native `<select>` and `<textarea>` are un-componentized

Two primitive input types used throughout the app — `<select>` and `<textarea>` — are not wrapped in shadcn components. This creates visual inconsistency (no `Select` component, no `Textarea` component in `src/components/ui/`). The design system implementation phase should add these two components.

### Finding 7: DataTable uses native checkboxes, not shadcn `Checkbox`

`DataTable` renders `<input type="checkbox">` directly (styled with `rounded border border-input`) instead of the installed `Checkbox` component. This is a deliberate indeterminate-state workaround (the indeterminate state is set via a `ref` callback), but the visual output is inconsistent with the shadcn checkbox style.

### Finding 8: Page layout is consistent but brittle

The `p-6 space-y-6` page container pattern and `flex items-center justify-between` page header are consistent across all 15+ app pages. This is good — it means a single `PageContainer` and `PageHeader` component pattern could formalize and lock in these conventions. The brittle part is the `AppShell` inline-style sidebar offset — this needs to become a CSS variable or a Tailwind class that can be defined once.

### Finding 9: Button-as-Link inconsistency is pervasive

Multiple navigation CTAs use manually-duplicated button styles on `<Link>` elements instead of `<Button asChild>`. This means focus styles are missing (no `focus-visible:ring`), and any future button style changes require updating multiple files. The design system should enforce `<Button asChild>` as the pattern.

### Finding 10: The certainty system is a core UX element needing design attention

`CertaintySelector` is used across persons (birth/death dates), events (dates), relations, and temporal validity. It is currently a raw button group with no visual differentiation beyond active state (primary color) vs inactive. A four-state system (Certain/Probable/Possible/Unknown) with meaningful visual semantics (not just color) would significantly improve the research UX. Consider icon + color encoding.

### Finding 11: The dashboard is currently a placeholder

The dashboard shows only a welcome message and logout button. Epic 2.5 should not be blocked by this, but the dashboard layout needs to be designed — the roadmap (Epic 4.4) calls for meaningful cards: "Persons with uncertain birth dates", "Unconnected entities", recent activity feed. The dashboard container layout should be established in 2.5 even if content cards are populated later.

### Finding 12: Loading states are partially designed

`PageSkeleton` has three variants (list, detail, card-grid) and is used consistently. However, individual `loading.tsx` files duplicate skeleton structure (sidebar + topbar + content) rather than composing the `Loading` component from the same primitives as the real `AppShell`. The design system should unify these.

### Finding 13: i18n hardcoding violates single-source-of-truth

Several German strings are hardcoded in component logic rather than extracted to message files. This must be fully resolved before Epic 5.3 (i18n polish), but the design system phase is a good opportunity to flag components that will need refactoring.

### Finding 14: The `dev/showcase` page is the closest thing to a storybook

The showcase page at `/{locale}/dev/showcase` demonstrates all base UI components in context. It is not inside the AppShell (no sidebar, no topbar). It should be evolved into a living component reference for the design system, or replaced by Storybook (planned for Epic 5.4).

### Finding 15: Tailwind v4 CSS-first architecture is an opportunity

Because Tailwind v4 uses `@theme` blocks in CSS rather than a JavaScript config file, the entire design token system lives in `globals.css`. This makes the token migration path clean: all brand tokens can be added to the single `@theme` block, and every component that already uses `var(--color-primary)` through Tailwind utilities will automatically inherit the new values. No JavaScript configuration changes are required.

---

_This document is the single source of truth for all subsequent design system phases. All token decisions, component audit findings, and inconsistency resolutions should reference this analysis._
