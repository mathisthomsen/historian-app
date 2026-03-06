# Epic 1.1 — Project Bootstrap Progress

## Status: ✅ Complete

## Steps

### Phase 1: Project Initialization
- [x] package.json with all dependencies
- [x] Install pnpm dependencies
- [x] tsconfig.json (strict, noUncheckedIndexedAccess, exactOptionalPropertyTypes)
- [x] next.config.ts
- [x] .env.example + src/lib/env.ts (Zod validation)

### Phase 2: Styling & Theming
- [x] Tailwind v4 CSS-first config (globals.css with @theme + dark mode)
- [x] shadcn/ui components.json configuration
- [x] All shadcn/ui base components created manually

### Phase 3: App Structure
- [x] Root layout (ThemeProvider, Geist fonts, Sonner Toaster)
- [x] [locale] layout (NextIntlClientProvider)
- [x] Middleware (next-intl, localeDetection: false)
- [x] i18n message files (de.json, en.json)
- [x] not-found.tsx (async server component with getTranslations)
- [x] error.tsx (client component)
- [x] loading.tsx (skeleton)
- [x] [...catchAll]/page.tsx (triggers 404)

### Phase 4: Shell Components (TDD)
- [x] LocaleSwitcher.tsx + test (4 tests)
- [x] TopBar.tsx (menu toggle, theme toggle, locale switcher, avatar)
- [x] Sidebar.tsx (collapsible nav with 8 items)
- [x] AppShell.tsx + test (4 tests)
- [x] ThemeToggle.tsx
- [x] ToastDemo.tsx
- [x] useSidebar hook + test (5 tests, localStorage persistence)

### Phase 5: Pages
- [x] Root page (redirect to /de)
- [x] [locale]/page.tsx (AppShell + dashboard stub)
- [x] [locale]/dev/showcase/page.tsx (all components)

### Phase 6: Developer Tooling
- [x] ESLint flat config (next, typescript, unicorn, import/order)
- [x] Prettier config (tailwindcss + organize-imports plugins)
- [x] Commitlint config (conventional commits)
- [x] Husky + lint-staged (pre-commit: lint-staged + typecheck)
- [x] Vitest config + jsdom + test setup (matchMedia mock)
- [x] Playwright config (chromium + firefox, reuseExistingServer)

### Phase 7: Tests
- [x] Unit tests: useSidebar (5), LocaleSwitcher (4), AppShell (4), Skeleton (5) = 18 total
- [x] E2E smoke tests: 12 TC on Chromium + Firefox = 24 tests
- [x] Test plan documented in testplan.md

### Phase 8: Verification
- [x] pnpm typecheck exits 0
- [x] pnpm lint exits 0
- [x] pnpm test passes (18/18)
- [x] pnpm test:e2e passes (24/24 on Chromium + Firefox)
- [x] pnpm build succeeds
- [x] Browser verification with Playwright MCP

## Acceptance Criteria Status
| AC | Description | Status |
|---|---|---|
| AC-1 | pnpm dev starts without errors | ✅ |
| AC-2 | / redirects to /de | ✅ |
| AC-3 | /de and /en render shell | ✅ |
| AC-4 | Language switcher works (DE↔EN) | ✅ |
| AC-5 | NEXT_LOCALE cookie set on switch | ✅ |
| AC-6 | /de/dev/showcase renders all components | ✅ |
| AC-7 | Dark mode toggle applies dark class to html | ✅ |
| AC-8 | Sidebar collapses + persists (localStorage) | ✅ |
| AC-9 | pnpm typecheck exits 0 | ✅ |
| AC-10 | pnpm lint exits 0 | ✅ |
| AC-11 | pnpm test passes | ✅ |
| AC-12 | pnpm test:e2e passes Chromium + Firefox | ✅ |
| AC-13 | pnpm build succeeds | ✅ |
| AC-14 | Bad commit message rejected by commitlint | ✅ (hook installed) |
| AC-15 | Type error in staged files rejected | ✅ (tsc --noEmit in pre-commit) |
| AC-16 | Non-existent route shows styled 404 | ✅ |
| AC-17 | .env.example contains all env vars with comments | ✅ |

## Commits
- `feat: bootstrap Epic 1.1` — full initial implementation
- `fix: resolve E2E issues and add Sonner toast` — runtime + test fixes
- `test: fix E2E smoke tests for parallel run stability` — test reliability
