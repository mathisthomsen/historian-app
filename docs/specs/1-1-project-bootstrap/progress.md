# Epic 1.1 — Project Bootstrap Progress

## Status: 🚧 In Progress

## Steps

### Phase 1: Project Initialization
- [ ] package.json with all dependencies
- [ ] Install pnpm dependencies
- [ ] tsconfig.json
- [ ] next.config.ts
- [ ] .env.example + src/lib/env.ts

### Phase 2: Styling & Theming
- [ ] Tailwind v4 CSS setup (globals.css)
- [ ] shadcn/ui initialization
- [ ] shadcn/ui base components installed

### Phase 3: App Structure
- [ ] Root layout (html/body, ThemeProvider, fonts)
- [ ] [locale] layout (locale shell)
- [ ] Middleware (next-intl routing)
- [ ] i18n message files (de.json, en.json)
- [ ] not-found.tsx, error.tsx, loading.tsx

### Phase 4: Shell Components (TDD)
- [ ] LocaleSwitcher.tsx + test
- [ ] TopBar.tsx + test
- [ ] Sidebar.tsx + test
- [ ] AppShell.tsx + test
- [ ] useSidebar hook + test

### Phase 5: Pages
- [ ] Root page (redirect to /de)
- [ ] [locale]/page.tsx
- [ ] [locale]/dev/showcase/page.tsx

### Phase 6: Developer Tooling
- [ ] ESLint flat config
- [ ] Prettier config
- [ ] Commitlint config
- [ ] Husky + lint-staged
- [ ] Vitest config + test setup
- [ ] Playwright config

### Phase 7: Tests
- [ ] Unit tests for shell components
- [ ] Unit tests for error boundary
- [ ] Unit tests for skeleton
- [ ] E2E smoke tests

### Phase 8: Verification
- [ ] pnpm typecheck passes
- [ ] pnpm lint passes
- [ ] pnpm test passes
- [ ] pnpm test:e2e passes
- [ ] pnpm build succeeds
- [ ] Browser verification with Playwright

## Acceptance Criteria Status
| AC | Description | Status |
|---|---|---|
| AC-1 | pnpm dev starts | ⬜ |
| AC-2 | / redirects to /de | ⬜ |
| AC-3 | /de and /en render shell | ⬜ |
| AC-4 | Language switcher works | ⬜ |
| AC-5 | NEXT_LOCALE cookie set | ⬜ |
| AC-6 | /de/dev/showcase renders all components | ⬜ |
| AC-7 | Dark mode toggle works | ⬜ |
| AC-8 | Sidebar collapses + persists | ⬜ |
| AC-9 | pnpm typecheck exits 0 | ⬜ |
| AC-10 | pnpm lint exits 0 | ⬜ |
| AC-11 | pnpm test passes | ⬜ |
| AC-12 | pnpm test:e2e passes | ⬜ |
| AC-13 | pnpm build succeeds | ⬜ |
| AC-14 | Bad commit rejected | ⬜ |
| AC-15 | Type error in staged files rejected | ⬜ |
| AC-16 | 404 page styled | ⬜ |
| AC-17 | .env.example documented | ⬜ |
