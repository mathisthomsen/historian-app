# Layer 5 — Page Composition Specification

**Date:** 2026-04-03
**Author:** Frontend Engineer (Page Compositions)
**Branch:** `2-5_design_system`
**Status:** Approved — ready for implementation
**Upstream:** `docs/implementation/04-layouts/layout-spec.md`, `docs/design-system/04-design-system/components.md`, `docs/implementation/00-plan/implementation-plan.md §Layer 5`

---

## Table of Contents

1. [Overview and Principles](#1-overview-and-principles)
2. [Auth Page Group](#2-auth-page-group)
3. [Dashboard](#3-dashboard)
4. [Entity List Pages](#4-entity-list-pages)
5. [Entity Detail Pages](#5-entity-detail-pages)
6. [Entity Create / Edit Pages](#6-entity-create--edit-pages)
7. [Relations Page](#7-relations-page)
8. [Settings Pages](#8-settings-pages)
9. [Dev Showcase Page](#9-dev-showcase-page)
10. [i18n Requirements](#10-i18n-requirements)
11. [Acceptance Criteria](#11-acceptance-criteria)

---

## 1. Overview and Principles

### 1.1 Page Container Pattern

Every app page (inside `(app)` layout group) MUST use one of these patterns as the outermost wrapper:

```tsx
// Standard page (list / relations / settings)
<div className="page-container mx-auto space-y-6">
  ...
</div>

// Narrow form page (create / edit)
<div className="page-container mx-auto max-w-2xl space-y-6">
  ...
</div>
```

The `.page-container` utility provides `padding: 1.5rem` and `max-width: var(--content-max-width)`.

The current `p-6` pattern is equivalent but does not use the design system token class. All pages must migrate to `page-container`.

### 1.2 Heading Hierarchy

Every page must have exactly one `<h1>` with semantic heading weight using typography utility classes:

```tsx
<h1 className="text-foreground text-2xl font-bold tracking-tight">{pageTitle}</h1>
```

Sub-section headings within a page use `<h2>` (section titles) and `<h3>` (subsection titles).

### 1.3 Landmark Structure

App pages render inside `<main aria-label="Main content">` (provided by AppShell). Pages must NOT add another `<main>`. They may add `<nav aria-label="Breadcrumb">` for depth-2+ pages.

Auth pages render inside the centered card layout. No `<main>` landmark is provided — the auth layout itself is the page root.

### 1.4 i18n

All visible text strings must come from i18n keys. Heading text is always from `t("title")`, `t("create_title")`, `t("edit_title")` or equivalent. No hardcoded English or German text in JSX (except proper nouns like "Evidoxa").

---

## 2. Auth Page Group

### 2.1 Layout Template

The auth layout (`src/app/[locale]/(auth)/layout.tsx`) provides:

- Full-screen centered container (`flex min-h-screen items-center justify-center`)
- Brand heading `<h1>Evidoxa</h1>` at `text-2xl font-bold tracking-tight`
- `max-w-sm` constrained inner column
- Theme and locale controls top-right

The layout renders `<h1>Evidoxa</h1>` as the page-level heading. Individual auth pages use `CardTitle` (rendered as `<h2>` semantically when inside a card) for the form-level heading.

**Current state:** `CardTitle` renders a `<div>` by default in shadcn/ui, not a heading element. This means auth pages lack proper heading hierarchy below `<h1>Evidoxa</h1>`. The card title should use `<h2>` to establish proper hierarchy.

**Correction needed:** `CardTitle` class must render as `<h2>` on auth pages. Since `CardTitle` is a `<div>`, pass `asChild` or wrap with an explicit `<h2>`.

### 2.2 Auth Page Inventory

| Page            | Route                            | Key Components                                  | Form i18n namespace |
| --------------- | -------------------------------- | ----------------------------------------------- | ------------------- |
| Login           | `/[locale]/auth/login`           | `Card`, `CardTitle` (→h2), `LoginForm`          | `auth.login`        |
| Register        | `/[locale]/auth/register`        | `Card`, `CardTitle` (→h2), `RegisterForm`       | `auth.register`     |
| Verify Email    | `/[locale]/auth/verify`          | `Card`, `CardTitle` (→h2), `VerifyEmailCard`    | `auth.verify`       |
| Forgot Password | `/[locale]/auth/forgot-password` | `Card`, `CardTitle` (→h2), `ForgotPasswordForm` | `auth.forgot`       |
| Reset Password  | `/[locale]/auth/reset-password`  | `Card`, `CardTitle` (→h2), `ResetPasswordForm`  | `auth.reset`        |

### 2.3 Landmark Structure (Auth)

```
<div.min-h-screen.bg-background>       ← Auth layout root
  <div.absolute.right-4.top-4>         ← Theme/locale controls
  <div.flex.min-h-screen.items-center.justify-center>
    <div.w-full.max-w-sm>
      <div.text-center>
        <h1>Evidoxa</h1>               ← Brand / page-level h1
      </div>
      <Card>                           ← Form container
        <CardHeader>
          <CardTitle>                  ← Form heading (h2 via CardTitle)
            {t("title")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {form component}
        </CardContent>
      </Card>
    </div>
  </div>
</div>
```

### 2.4 Acceptance Criteria (Auth)

- AC-AUTH-PAGE-01: Auth layout has a visible `<h1>` containing "Evidoxa".
- AC-AUTH-PAGE-02: Each auth page card has a form heading element (`<h2>` or element with heading role) with the page title.
- AC-AUTH-PAGE-03: Auth layout uses `bg-background` on the root container.
- AC-AUTH-PAGE-04: Card is `max-w-sm` wide, centered vertically and horizontally.
- AC-AUTH-PAGE-05: All form labels and submit buttons use i18n keys from the correct namespace.

---

## 3. Dashboard

### 3.1 Layout Template

Layout: AppShell (app layout group). Page wraps content in `.page-container`.

### 3.2 Structure

```tsx
<div className="page-container mx-auto space-y-6">
  <h1 className="text-foreground text-2xl font-bold tracking-tight">{t("welcome", { name })}</h1>
  <p className="text-muted-foreground text-body">{t("loggedIn")}</p>
  <LogoutButton label={t("logout")} />
</div>
```

### 3.3 Acceptance Criteria (Dashboard)

- AC-DASH-01: Page has `page-container` class wrapper.
- AC-DASH-02: Page has exactly one `<h1>` using the welcome message.
- AC-DASH-03: No hardcoded colors; uses `text-muted-foreground` for descriptive text.

---

## 4. Entity List Pages

Applies to: Persons (`/persons`), Events (`/events`), Sources (`/sources`)

### 4.1 Layout Template

Layout: AppShell. Content wrapper: `.page-container`.

### 4.2 Structure

```tsx
<div className="page-container mx-auto space-y-6">
  {/* Page header row */}
  <div className="flex items-center justify-between">
    <h1 className="text-2xl font-bold tracking-tight text-foreground">
      {t("title")}
    </h1>
    <Button asChild>
      <Link href={`/${locale}/[entity]/new`}>
        {t("create")}
      </Link>
    </Button>
  </div>

  {/* Data table / list client component */}
  <PersonsListClient ... />
</div>
```

**Key changes from current state:**

- `p-6` wrapper → `page-container mx-auto`
- `<Link>` with duplicated button classes → `<Button asChild><Link>` (Layer 3 task, but class update is part of page composition)
- Add `tracking-tight text-foreground` to `<h1>`

### 4.3 Component Inventory

| Component                                                | Source                   | Notes                                                   |
| -------------------------------------------------------- | ------------------------ | ------------------------------------------------------- |
| `<h1>`                                                   | Inline                   | Title from i18n `t("title")`                            |
| `<Button asChild>` + `<Link>`                            | `ui/button`, `next/link` | Create CTA                                              |
| `PersonsListClient` / `EventsListClient` / `SourceTable` | `components/research`    | Client component with search, filter, table, pagination |

### 4.4 Responsive Notes

- Header row stacks on mobile (`flex-col` or `flex-wrap`) — at 320px the button must not overflow.
- Table scrolls horizontally via container overflow.

### 4.5 Acceptance Criteria (Entity List)

- AC-LIST-01: Page has `page-container` class wrapper.
- AC-LIST-02: Page has exactly one `<h1>` with entity list title.
- AC-LIST-03: Create CTA button is present and links to `/new`.
- AC-LIST-04: Search/filter component is present inside the client component.
- AC-LIST-05: Page-level heading uses `text-foreground` color token.

---

## 5. Entity Detail Pages

Applies to: Person detail (`/persons/[id]`), Event detail (`/events/[id]`), Source detail (`/sources/[id]`)

### 5.1 Layout Template

Layout: AppShell. Content wrapper: `.page-container`.

### 5.2 Structure

```tsx
<div className="page-container mx-auto space-y-6">
  {/* Breadcrumb — hidden on mobile */}
  <nav aria-label="Breadcrumb" className="hidden md:block">
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href={`/${locale}/persons`}>
            {t("title")}               {/* e.g. "Personen" */}
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator>/</BreadcrumbSeparator>
        <BreadcrumbItem>
          <BreadcrumbPage>{displayName}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  </nav>

  {/* Page header row */}
  <div className="flex items-center justify-between">
    <h1 className="text-2xl font-bold tracking-tight text-foreground">
      {displayName}
    </h1>
    <div className="flex gap-2">
      <Button asChild variant="outline">
        <Link href={`/${locale}/[entity]/${id}/edit`}>
          {t("edit_title")}
        </Link>
      </Button>
      <DeleteEntityButton ... />
    </div>
  </div>

  {/* Detail tabs */}
  <EntityDetailTabs ... />
</div>
```

**Note for Source detail:** currently has a `← Back to list` link rendered as inline text with `text-muted-foreground`. This should be replaced with the Breadcrumb component pattern. Keep the inline link pattern for now (do not restructure), but ADD the Breadcrumb above it as specified.

### 5.3 Component Inventory

| Component                                                                                                   | Source                                               |
| ----------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| `Breadcrumb`, `BreadcrumbList`, `BreadcrumbItem`, `BreadcrumbLink`, `BreadcrumbPage`, `BreadcrumbSeparator` | `ui/breadcrumb`                                      |
| `<h1>`                                                                                                      | Inline — entity display name                         |
| `Button asChild` + `Link`                                                                                   | Edit action                                          |
| `Delete[Entity]Button`                                                                                      | Destructive action                                   |
| `[Entity]DetailTabs`                                                                                        | Client component (tabs: attributes, relations, etc.) |

### 5.4 Responsive Notes

- Breadcrumb hidden below `md` breakpoint (768px) via `hidden md:block`.
- Header row wraps on mobile.
- Tabs scroll horizontally on narrow viewports.

### 5.5 Acceptance Criteria (Entity Detail)

- AC-DETAIL-01: Page has `page-container` class wrapper.
- AC-DETAIL-02: Page has exactly one `<h1>` with entity display name.
- AC-DETAIL-03: Breadcrumb present with `aria-label="Breadcrumb"`.
- AC-DETAIL-04: Breadcrumb has `hidden md:block` (invisible on mobile).
- AC-DETAIL-05: Breadcrumb link segment uses parent list label from i18n.
- AC-DETAIL-06: Breadcrumb current page segment has `aria-current="page"`.
- AC-DETAIL-07: Edit button (or link styled as button) links to `/edit`.
- AC-DETAIL-08: Delete button (destructive variant) is present.

---

## 6. Entity Create / Edit Pages

Applies to: Person new/edit, Source new/edit.
Note: Event new/edit delegates entirely to client components (`NewEventClient`, `EditEventClient`) which render their own heading — page shell only provides auth redirect guard.

### 6.1 Layout Template

Layout: AppShell. Content wrapper: `.page-container max-w-2xl` (narrow, centered form).

### 6.2 Person New Page Structure

```tsx
<div className="page-container mx-auto max-w-2xl space-y-6">
  {/* Breadcrumb */}
  <nav aria-label="Breadcrumb" className="hidden md:block">
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href={`/${locale}/persons`}>{t("title")}</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator>/</BreadcrumbSeparator>
        <BreadcrumbItem>
          <BreadcrumbPage>{t("create_title")}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  </nav>

  <h1 className="text-2xl font-bold tracking-tight text-foreground">
    {t("create_title")}
  </h1>
  <NewPersonClient ... />
</div>
```

### 6.3 Person Edit Page Structure

```tsx
<div className="page-container mx-auto max-w-2xl space-y-6">
  <nav aria-label="Breadcrumb" className="hidden md:block">
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href={`/${locale}/persons`}>{t("title")}</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator>/</BreadcrumbSeparator>
        <BreadcrumbItem>
          <BreadcrumbPage>{t("edit_title")}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  </nav>

  <h1 className="text-2xl font-bold tracking-tight text-foreground">
    {t("edit_title")}
  </h1>
  <EditPersonClient ... />
</div>
```

### 6.4 Source New/Edit Page Structure

Same breadcrumb + h1 pattern. Source new uses `t("new_title")`; Source edit uses `t("edit_title")`.

### 6.5 Event New/Edit Pages

`NewEventPage` delegates to `<NewEventClient>` which renders its own full page UI including heading. The server page wrapper should only provide the auth guard and project redirect. No `<h1>` is needed at the server page level.

`EditEventPage` delegates similarly to `<EditEventClient>`.

### 6.6 Acceptance Criteria (Create/Edit)

- AC-FORM-01: Page has `page-container mx-auto max-w-2xl` wrapper (or equivalent narrow container).
- AC-FORM-02: Page has `<h1>` with create or edit title from i18n.
- AC-FORM-03: Breadcrumb present with back link to entity list.
- AC-FORM-04: Breadcrumb hidden below `md` breakpoint.
- AC-FORM-05: Event new/edit pages delegate to client components (no server-side h1 required).

---

## 7. Relations Page

### 7.1 Layout Template

Layout: AppShell. Content wrapper: `.page-container`.

### 7.2 Structure

```tsx
<div className="page-container mx-auto space-y-6">
  <h1 className="text-foreground text-2xl font-bold tracking-tight">{t("title")}</h1>
  <RelationsDataTable projectId={projectId} />
</div>
```

### 7.3 Acceptance Criteria (Relations)

- AC-REL-01: Page has `page-container` class.
- AC-REL-02: Page has `<h1>` with relations title from i18n.

---

## 8. Settings Pages

### 8.1 Layout Template

Layout: AppShell. Content wrapper: `.page-container`.

### 8.2 Event Types Settings

```tsx
<div className="page-container mx-auto space-y-6">
  <h1 className="text-foreground text-2xl font-bold tracking-tight">
    {t("title")} {/* event_types.title */}
  </h1>
  <EventTypeSettingsTable projectId={projectId} />
</div>
```

### 8.3 Relation Types Settings

```tsx
<div className="page-container mx-auto space-y-6">
  <h1 className="text-foreground text-2xl font-bold tracking-tight">
    {t("title")} {/* relationTypes.title */}
  </h1>
  <RelationTypesTable projectId={projectId} />
</div>
```

### 8.4 Acceptance Criteria (Settings)

- AC-SETTINGS-01: Both settings pages have `page-container` class.
- AC-SETTINGS-02: Both settings pages have `<h1>` from i18n.

---

## 9. Dev Showcase Page

### 9.1 Layout Template

The showcase page (`/[locale]/dev/showcase`) is a client component (`"use client"`) rendered outside the `(app)` layout group. It wraps in its own container.

### 9.2 Structure

The showcase page is a developer tool. It must have:

- A `<h1>` with the showcase title from `t("title")` (i18n key `showcase.title`)
- Sections organized with `<h2>` headings for component categories
- `page-container mx-auto` wrapper

### 9.3 Acceptance Criteria (Showcase)

- AC-SHOW-01: Showcase page has a `<h1>` from i18n.
- AC-SHOW-02: Component sections use `<h2>` headings.

---

## 10. i18n Requirements

All i18n keys referenced in this spec must exist in BOTH `messages/de.json` AND `messages/en.json`.

### 10.1 Existing Keys (verified present in both files)

| Namespace        | Key            | DE                   | EN               |
| ---------------- | -------------- | -------------------- | ---------------- |
| `auth.login`     | `title`        | Anmelden             | Sign in          |
| `auth.register`  | `title`        | Konto erstellen      | Create account   |
| `auth.verify`    | `title`        | E-Mail bestätigen    | Confirm email    |
| `auth.forgot`    | `title`        | Passwort vergessen?  | Forgot password? |
| `auth.reset`     | `title`        | Neues Passwort       | New password     |
| `auth.dashboard` | `welcome`      | Willkommen, {name}!  | Welcome, {name}! |
| `persons`        | `title`        | Personen             | Persons          |
| `persons`        | `create`       | Neue Person          | New person       |
| `persons`        | `create_title` | Neue Person anlegen  | —                |
| `persons`        | `edit_title`   | Person bearbeiten    | —                |
| `events`         | `title`        | Ereignisse           | Events           |
| `events`         | `create`       | Neues Ereignis       | New event        |
| `sources`        | `title`        | Quellen              | Sources          |
| `sources`        | `create`       | Neue Quelle          | New source       |
| `sources`        | `new_title`    | Neue Quelle          | —                |
| `sources`        | `edit_title`   | Quelle bearbeiten    | —                |
| `relations`      | `title`        | —                    | —                |
| `event_types`    | `title`        | Ereignistypen        | Event Types      |
| `relationTypes`  | `title`        | —                    | —                |
| `showcase`       | `title`        | Komponentenübersicht | —                |

### 10.2 Keys to Verify / Add

The following keys may be missing from `en.json`. Add them if absent:

- `persons.create_title` — "Create person"
- `persons.edit_title` — "Edit person"
- `sources.new_title` — "New source"
- `sources.edit_title` — "Edit source"
- `relations.title` — "Relations"
- `relationTypes.title` — "Relation Types"
- `showcase.title` — "Component Showcase"

---

## 11. Acceptance Criteria

### Complete AC Reference

| ID              | Page Group   | Criterion                                              |
| --------------- | ------------ | ------------------------------------------------------ |
| AC-AUTH-PAGE-01 | Auth         | Auth layout has visible `<h1>` with "Evidoxa"          |
| AC-AUTH-PAGE-02 | Auth         | Each auth page card has a form heading with page title |
| AC-AUTH-PAGE-03 | Auth         | Auth layout root uses `bg-background`                  |
| AC-AUTH-PAGE-04 | Auth         | Card is `max-w-sm` centered                            |
| AC-AUTH-PAGE-05 | Auth         | All form text uses i18n keys                           |
| AC-DASH-01      | Dashboard    | Has `page-container` wrapper                           |
| AC-DASH-02      | Dashboard    | Has exactly one `<h1>`                                 |
| AC-DASH-03      | Dashboard    | Uses `text-muted-foreground` for body text             |
| AC-LIST-01      | List pages   | Has `page-container` wrapper                           |
| AC-LIST-02      | List pages   | Has exactly one `<h1>` with list title                 |
| AC-LIST-03      | List pages   | Create CTA present linking to `/new`                   |
| AC-LIST-04      | List pages   | Search component present in client component           |
| AC-LIST-05      | List pages   | `<h1>` uses `text-foreground`                          |
| AC-DETAIL-01    | Detail pages | Has `page-container` wrapper                           |
| AC-DETAIL-02    | Detail pages | Has exactly one `<h1>` with entity name                |
| AC-DETAIL-03    | Detail pages | Breadcrumb with `aria-label="Breadcrumb"`              |
| AC-DETAIL-04    | Detail pages | Breadcrumb has `hidden md:block`                       |
| AC-DETAIL-05    | Detail pages | Breadcrumb link uses parent list i18n label            |
| AC-DETAIL-06    | Detail pages | Breadcrumb current page has `aria-current="page"`      |
| AC-DETAIL-07    | Detail pages | Edit button/link present                               |
| AC-DETAIL-08    | Detail pages | Delete button present                                  |
| AC-FORM-01      | Create/Edit  | Has `page-container mx-auto max-w-2xl` wrapper         |
| AC-FORM-02      | Create/Edit  | Has `<h1>` from i18n                                   |
| AC-FORM-03      | Create/Edit  | Breadcrumb with back link                              |
| AC-FORM-04      | Create/Edit  | Breadcrumb hidden on mobile                            |
| AC-REL-01       | Relations    | Has `page-container`                                   |
| AC-REL-02       | Relations    | Has `<h1>`                                             |
| AC-SETTINGS-01  | Settings     | Has `page-container`                                   |
| AC-SETTINGS-02  | Settings     | Has `<h1>`                                             |
| AC-SHOW-01      | Showcase     | Has `<h1>`                                             |
| AC-SHOW-02      | Showcase     | Sections use `<h2>`                                    |
