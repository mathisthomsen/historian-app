# Epic 1.1 — Project Bootstrap & Developer Experience
## Brainstorming

**Goal:** Define every implementation detail for the clean-slate Next.js 15 bootstrap so the spec leaves no ambiguity.

---

## Round 1 — Foundational Tooling

### Q1 — Package manager

Which package manager should the project use?

- [ ] `npm` — default, universal compatibility
- [x] `pnpm` — **recommended** — faster installs, strict hoisting, monorepo-ready if needed later, workspace support
- [ ] `bun` — fastest, but edge cases with some Next.js tooling and Prisma

---

### Q2 — Node.js version

What Node version to pin (`.nvmrc` / `engines` in `package.json`)?

- [ ] 20 LTS — broadly supported, safe choice
- [x] 22 LTS — **recommended** — current LTS as of 2025, active support until 2027, supported by Vercel
- [ ] 23 — current release, not LTS

---

### Q3 — Tailwind CSS version

The roadmap says "shadcn/ui + Tailwind CSS" but doesn't pin the version. Tailwind v4 has a very different config model (CSS-first, no `tailwind.config.js`). shadcn/ui has stable v4 support as of early 2025.

- [ ] Tailwind v3 — mature, widely documented, conventional `tailwind.config.js`
- [x] Tailwind v4 — **recommended** — new CSS-first config, better performance, future-proof, shadcn/ui fully supports it

---

### Q4 — React version

Next.js 15 supports both React 18 and React 19.

- [ ] React 18 — stable, all third-party libs guaranteed compatible
- [x] React 19 — **recommended** — new `use()` hook, server actions improvements, concurrent features; Next.js 15 is optimized for it

---

## Round 2 — Linting, Formatting & Git Hooks

### Q5 — ESLint config

Next.js ships `eslint-config-next`. How strict should we go on top of that?

- [ ] `eslint-config-next` only — minimal, fast setup
- [x] `eslint-config-next` + `eslint-plugin-unicorn` + `eslint-plugin-import` — **recommended** — catches common bugs, enforces consistent imports, worth the setup cost
- [ ] Full `@typescript-eslint/strict` ruleset — very pedantic, high noise for a bootstrap phase

---

### Q6 — Prettier

- [x] Yes, Prettier for formatting — **recommended** — with `prettier-plugin-tailwindcss` (auto-sorts class names) and `prettier-plugin-organize-imports`
- [ ] ESLint formatting rules only (no Prettier) — more config, less consistent

---

### Q7 — Husky pre-commit: what runs?

What should the pre-commit hook enforce? (lint-staged runs only on staged files)

- [x] `eslint --fix` + `prettier --write` + `tsc --noEmit` — **recommended** — catches type errors and formatting before every commit
- [ ] `eslint --fix` + `prettier --write` only — faster, but type errors sneak through
- [ ] Nothing on pre-commit, only CI enforces — fastest local DX, but dirty commits land on the branch

---

### Q8 — Commit message convention

- [ ] Free-form — no enforcement
- [x] Conventional Commits (`feat:`, `fix:`, `chore:`, etc.) with `commitlint` — **recommended** — enables auto-changelog later, keeps history readable
- [ ] Custom emoji prefix convention — non-standard, harder to automate

---

## Round 3 — Testing Setup

### Q9 — Unit/integration test runner: Jest vs Vitest

The roadmap specifies Jest 30, but Vitest has become the community standard for Next.js/Vite projects. Worth revisiting.

```
Jest 30                          Vitest
────────────────────────────     ────────────────────────────
✓ Roadmap-specified              ✓ Faster (native ESM, no babel)
✓ Mature ecosystem               ✓ Same API as Jest (drop-in)
✗ Requires babel transform       ✓ Works natively with TypeScript
✗ Slower cold start              ✓ Built-in watch mode
✗ ESM support still awkward      ✓ Compatible with RTL
```

- [ ] Jest 30 — as roadmap specifies; no surprises
- [x] Vitest — **recommended** — faster, zero-config TypeScript, same API so roadmap intent is fully preserved

---

### Q10 — React Testing Library scope for bootstrap

Which RTL utilities should be set up in the initial bootstrap (beyond the install)?

- [ ] Just install, no setup conventions
- [x] Install + custom `render` wrapper (providers: i18n, theme) + global test setup file — **recommended** — prevents boilerplate in every test from day one
- [ ] Full mock library setup now — premature; domain mocks belong in later epics

---

### Q11 — Playwright: browser targets

Which browsers should Playwright run E2E tests against?

- [ ] Chromium only — fast, sufficient for MVP
- [x] Chromium + Firefox — **recommended** — catches layout and API divergence early, still fast enough in CI
- [ ] Chromium + Firefox + WebKit (Safari) — thorough but slow; add in Phase 5 hardening

---

### Q12 — Test file co-location convention

```
Option A — co-located (recommended):
  src/components/Button/
    Button.tsx
    Button.test.tsx

Option B — mirrored __tests__ folder:
  src/components/Button/Button.tsx
  src/__tests__/components/Button.test.tsx

Option C — top-level tests/ directory:
  tests/unit/components/Button.test.tsx
  tests/e2e/...
```

- [x] Option A — co-located — **recommended** — tests live next to the code they test; Playwright E2E in a top-level `e2e/` folder as a separate concern
- [ ] Option B — mirrored `__tests__`
- [ ] Option C — top-level `tests/`

---

## Round 4 — i18n & Routing Structure

### Q13 — next-intl locale strategy

How should the locale appear in URLs?

```
Option A — prefix all locales (recommended):
  /de/dashboard
  /en/dashboard

Option B — prefix non-default only:
  /dashboard        ← German (default)
  /en/dashboard     ← English

Option C — no locale in URL (cookie/header only):
  /dashboard        ← locale from cookie
```

- [x] Option A — prefix all locales — **recommended** — explicit, shareable URLs, no ambiguity, standard next-intl setup
- [ ] Option B — prefix non-default only — common but causes redirect complexity
- [ ] Option C — no locale prefix — bad for SEO, breaks shared links

---

### Q14 — Default locale

- [x] German (`de`) — **recommended** — as per roadmap "German first"
- [ ] English (`en`)

---

### Q15 — Locale switcher persistence

When a user switches language, where is the preference saved?

- [ ] URL only — no memory, reverts on next fresh visit
- [x] Cookie (`NEXT_LOCALE`) — **recommended** — persists across sessions without requiring auth; standard next-intl approach for the bootstrap phase
- [ ] User profile in DB — correct long-term (Epic 1.3+), but requires auth; add this in Epic 5.3

---

### Q16 — Component showcase page route

The roadmap requires a verifiable component showcase. Where should it live?

- [ ] `/showcase` — always accessible
- [x] `/dev/showcase` — **recommended** — signals it's a dev/internal page; can be blocked in production via middleware later
- [ ] Storybook — heavy; overkill for bootstrap phase

---

## Round 5 — UI Shell & Design Tokens

### Q17 — App shell layout

What layout pattern for the authenticated app shell?

```
Option A — Sidebar + top bar (recommended):
┌──────────────────────────────────┐
│  Logo   [Project]   [User]  [EN] │  ← top bar
├────────┬─────────────────────────┤
│        │                         │
│  Nav   │   Page content          │
│        │                         │
│        │                         │
└────────┴─────────────────────────┘

Option B — Top nav only:
┌──────────────────────────────────┐
│  Logo  Nav links    [User]  [EN] │
├──────────────────────────────────┤
│                                  │
│         Page content             │
│                                  │
└──────────────────────────────────┘

Option C — Collapsible sidebar (icon-only when collapsed):
  Same as A but sidebar collapses to icon rail on narrow viewports
```

- [ ] Option A — fixed sidebar + top bar
- [ ] Option B — top nav only
- [x] Option C — collapsible sidebar — **recommended** — best for a data-heavy research app; collapses to save space when working on detail views

---

### Q18 — shadcn/ui base color (theme)

shadcn/ui requires picking a base color for CSS variables on init.

- [ ] `neutral` — pure gray, minimal personality
- [ ] `slate` — cool blue-gray, common default
- [x] `zinc` — **recommended** — warm gray, clean and scholarly, works well for a research/academic tool
- [ ] `stone` — brownish, too warm
- [ ] Custom — defer to a design pass

---

### Q19 — Typography / font

- [ ] System font stack — no external dependency, fast
- [ ] Inter (Google Fonts / `next/font`) — **recommended** — clean, readable, industry standard for data-dense UIs, zero layout shift with `next/font`
- [x] Geist (Vercel's font) — modern, but less tested for long-form content
- [ ] Custom brand font — no brand identity defined yet; premature

---

### Q20 — Dark mode

- [ ] Light mode only for now — simpler, defer dark mode to Epic 5.3 polish
- [x] Dark mode from day one via `next-themes` — **recommended** — shadcn/ui is built for it; adding it later requires touching every component; low setup cost now

---

## Round 6 — Project Structure, Env & Error Handling

### Q21 — `src/` directory

Should code live in `/src/app/...` or directly in `/app/...`?

- [x] Yes, use `src/` — **recommended** — keeps app code separate from root config files; Next.js 15 supports it natively
- [ ] No `src/`, root-level `app/` — simpler, but root gets cluttered fast

---

### Q22 — Path aliases

The roadmap specifies `@/components`, `@/lib`, `@/types`. Any additions?

- [x] Extend to: `@/components`, `@/lib`, `@/types`, `@/hooks`, `@/stores`, `@/styles` — **recommended** — covers all common directories upfront; avoids future tsconfig churn
- [ ] Roadmap minimum only: `@/components`, `@/lib`, `@/types`

---

### Q23 — Environment variable validation (Zod `env.ts`)

Which env vars should be validated at startup in Epic 1.1 (before DB/Auth exist)?

```
Bootstrap-phase vars (Epic 1.1):
  NEXT_PUBLIC_APP_URL    (required, public)
  NODE_ENV               (inferred)

Stubs for later epics (validated but optional now):
  DATABASE_URL
  NEXTAUTH_SECRET
  NEXTAUTH_URL
  RESEND_API_KEY
  UPSTASH_REDIS_REST_URL
  UPSTASH_REDIS_REST_TOKEN
```

- [ ] Only validate vars that are used right now — minimal
- [x] Validate all known vars upfront, mark later ones optional with clear comments — **recommended** — prevents "missing env var" surprises when later epics land; `env.ts` becomes the single source of truth

---

### Q24 — Global error boundary style

What should the global error boundary (`error.tsx`) look like?

- [ ] Plain text fallback — minimal effort
- [x] Styled card with error message + "Try again" button + link to home — **recommended** — consistent with shadcn/ui shell, functional from day one
- [ ] Full branded error page — premature; no brand defined yet

---

### Q25 — Loading skeleton pattern

How should loading states be implemented globally?

- [ ] `loading.tsx` per route segment only — Next.js default, minimal
- [x] `loading.tsx` per segment + a reusable `<Skeleton>` component (shadcn Skeleton) with layout-matching variants per page type — **recommended** — prevents jarring blank-page flashes; establishes the pattern for all future pages

---
