# Epic 1.1 — Project Bootstrap & Developer Experience
## Specification

**Phase:** 1 — Foundation & Auth
**Deliverable:** A running Next.js 15 App Router project with a styled shell, full developer tooling, i18n, testing infrastructure, and environment validation in place.
**Verifiable:** App loads at `/de`, language switcher toggles DE/EN, `/dev/showcase` renders all base components, dark mode toggle works.

---

## 1. Technology Stack (pinned)

| Concern | Choice | Version |
|---|---|---|
| Framework | Next.js App Router | 15.x |
| Language | TypeScript (strict) | 5.x |
| Runtime | React | 19.x |
| Package manager | pnpm | 9.x |
| Node.js | LTS | 22.x |
| Styling | Tailwind CSS | v4 (CSS-first, no `tailwind.config.js`) |
| Component library | shadcn/ui | latest (v4-compatible) |
| i18n | next-intl | 3.x |
| Theme management | next-themes | latest |
| Font | Geist (via `next/font/google`) | — |
| Form validation | Zod | 3.x |
| Unit/integration tests | Vitest + React Testing Library | latest |
| E2E tests | Playwright | latest |
| Linting | ESLint (flat config) | 9.x |
| Formatting | Prettier | 3.x |
| Git hooks | Husky + lint-staged + commitlint | latest |

---

## 2. Project Structure

```
historian_app/
├── src/
│   ├── app/
│   │   ├── [locale]/                  # next-intl locale segment
│   │   │   ├── layout.tsx             # locale shell: fonts, providers, theme
│   │   │   ├── page.tsx               # root redirect → /[locale]/dashboard
│   │   │   ├── not-found.tsx          # 404 page (styled)
│   │   │   ├── error.tsx              # global error boundary
│   │   │   ├── loading.tsx            # global loading skeleton
│   │   │   └── dev/
│   │   │       └── showcase/
│   │   │           └── page.tsx       # component showcase
│   │   └── layout.tsx                 # root layout (html/body, ThemeProvider)
│   ├── components/
│   │   ├── ui/                        # shadcn/ui generated components
│   │   └── shell/
│   │       ├── AppShell.tsx           # collapsible sidebar + top bar wrapper
│   │       ├── Sidebar.tsx            # collapsible nav sidebar
│   │       ├── TopBar.tsx             # logo, project switcher, user menu, locale switcher
│   │       └── LocaleSwitcher.tsx     # DE/EN toggle, sets NEXT_LOCALE cookie
│   ├── hooks/
│   ├── lib/
│   │   └── env.ts                     # Zod env validation (runs at startup)
│   ├── stores/
│   ├── styles/
│   │   └── globals.css                # Tailwind v4 @import, CSS variables
│   └── types/
├── messages/
│   ├── de.json                        # German strings (primary)
│   └── en.json                        # English strings
├── e2e/                               # Playwright E2E tests
│   └── smoke.spec.ts
├── public/
├── .husky/
│   ├── pre-commit
│   └── commit-msg
├── .nvmrc                             # 22
├── .env.example                       # documented env var template
├── env.ts                             # re-exported from src/lib/env.ts (startup check)
├── next.config.ts
├── tsconfig.json
├── vitest.config.ts
├── playwright.config.ts
├── eslint.config.mjs                  # flat config
├── prettier.config.mjs
├── commitlint.config.mjs
└── package.json
```

---

## 3. TypeScript Configuration

`tsconfig.json` settings:

```jsonc
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,       // extra strictness on array access
    "noImplicitOverride": true,
    "exactOptionalPropertyTypes": true,
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "jsx": "preserve",
    "incremental": true,
    "paths": {
      "@/components/*": ["./src/components/*"],
      "@/lib/*":        ["./src/lib/*"],
      "@/types/*":      ["./src/types/*"],
      "@/hooks/*":      ["./src/hooks/*"],
      "@/stores/*":     ["./src/stores/*"],
      "@/styles/*":     ["./src/styles/*"]
    }
  }
}
```

---

## 4. Tailwind CSS v4 Setup

Tailwind v4 is CSS-first — no `tailwind.config.js`. All configuration lives in `src/styles/globals.css`:

```css
@import "tailwindcss";

@theme {
  /* shadcn/ui zinc-based CSS variables */
  --color-background: ...;
  --color-foreground: ...;
  --color-primary: ...;
  /* ... full zinc theme token set */

  --font-sans: "Geist", ui-sans-serif, system-ui;
}
```

`next.config.ts` uses `@tailwindcss/postcss` (v4 plugin).

---

## 5. shadcn/ui Setup

Initialize with:
```
pnpm dlx shadcn@latest init
  style: default
  base-color: zinc
  css-variables: yes
```

Base components installed in Epic 1.1:

| Component | Use |
|---|---|
| Button | Primary actions |
| Input | Form fields |
| Dialog | Modals |
| Table | Data lists |
| Card | Content containers |
| Badge | Status indicators |
| Tabs | Detail page sections |
| Toast (Sonner) | Notifications |
| Skeleton | Loading states |
| Separator | Layout dividers |
| DropdownMenu | User menu, action menus |
| Avatar | User avatar in top bar |

All components live in `src/components/ui/` (shadcn default).

---

## 6. Font

Geist via `next/font/google`, applied in `src/app/layout.tsx`:

```tsx
import { Geist, Geist_Mono } from "next/font/google";

const geistSans = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });
```

Font variables referenced in `@theme` block in `globals.css`.

---

## 7. Dark Mode

`next-themes` wraps the app in `src/app/layout.tsx`:

```tsx
<ThemeProvider attribute="class" defaultTheme="system" enableSystem>
  {children}
</ThemeProvider>
```

- Theme toggle component in `TopBar` (sun/moon icon button).
- shadcn/ui components use `dark:` variants natively.
- No hardcoded light/dark colors outside CSS variables.

---

## 8. App Shell Layout

The authenticated shell (wraps all `[locale]/(app)/*` routes) is a **collapsible sidebar + top bar**:

```
┌──────────────────────────────────────┐
│  [≡] Evidoxa  [Project ▾]  [●] [EN] │  ← TopBar (fixed, h-14)
├──────┬───────────────────────────────┤
│      │                               │
│ Nav  │   <slot />                    │
│      │                               │
│      │                               │
└──────┴───────────────────────────────┘
  ↑ collapsible to icon rail (w-12) on toggle
  expanded: w-56
```

**TopBar contents (left → right):**
- Hamburger toggle (collapses sidebar)
- App logo / name
- Project switcher (stub in 1.1, wired in Epic 3.1)
- Theme toggle (dark/light)
- Locale switcher (DE | EN)

**Sidebar nav items (stubs in 1.1, linked in later epics):**
- Dashboard
- Persons
- Events
- Sources
- Relations
- Locations *(Phase 3)*
- Literature *(Phase 3)*
- Settings

Sidebar collapse state persisted in `localStorage` via a custom `useSidebar` hook.

---

## 9. i18n — next-intl

### Routing strategy
All locales prefixed: `/de/...` and `/en/...`.
Root `/` redirects to `/de` (default locale).

### Middleware (`src/middleware.ts`)
```ts
import createMiddleware from "next-intl/middleware";

export default createMiddleware({
  locales: ["de", "en"],
  defaultLocale: "de",
  localePrefix: "always",
});

export const config = {
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
```

### Locale switcher persistence
Sets `NEXT_LOCALE` cookie (30-day expiry) on language change. Cookie read by next-intl middleware on subsequent requests.

Migration note: In Epic 5.3, locale preference moves to user profile (`User.locale` DB field).

### Message files
`messages/de.json` and `messages/en.json` — structured by feature namespace:

```json
// de.json
{
  "common": {
    "loading": "Wird geladen...",
    "error": "Fehler",
    "tryAgain": "Erneut versuchen",
    "backToHome": "Zur Startseite"
  },
  "shell": {
    "nav": {
      "dashboard": "Dashboard",
      "persons": "Personen",
      "events": "Ereignisse",
      "sources": "Quellen",
      "relations": "Beziehungen",
      "locations": "Orte",
      "literature": "Literatur",
      "settings": "Einstellungen"
    }
  },
  "showcase": {
    "title": "Komponentenübersicht"
  }
}
```

---

## 10. ESLint Configuration

Flat config (`eslint.config.mjs`), plugins:

| Plugin | Purpose |
|---|---|
| `eslint-config-next` | Next.js + React rules |
| `@typescript-eslint/eslint-plugin` | TypeScript-aware rules |
| `eslint-plugin-unicorn` | Modern JS best practices |
| `eslint-plugin-import` | Import order & no-cycle |

Key rules:
- `unicorn/filename-case`: `kebabCase` for files, `PascalCase` for components
- `import/order`: enforced with groups: builtin → external → internal (`@/`) → relative
- `@typescript-eslint/no-explicit-any`: error
- `@typescript-eslint/consistent-type-imports`: enforce `import type`

---

## 11. Prettier Configuration

`prettier.config.mjs`:
```js
export default {
  semi: true,
  singleQuote: false,
  tabWidth: 2,
  trailingComma: "all",
  printWidth: 100,
  plugins: [
    "prettier-plugin-tailwindcss",       // sorts Tailwind classes
    "prettier-plugin-organize-imports",   // sorts import statements
  ],
};
```

`.prettierignore`: `node_modules`, `.next`, `public`, `messages/`.

---

## 12. Git Hooks

### Husky

`.husky/pre-commit` (via lint-staged):
```sh
pnpm lint-staged
pnpm tsc --noEmit
```

`lint-staged` config in `package.json`:
```json
{
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{json,css,md}": ["prettier --write"]
  }
}
```

`.husky/commit-msg`:
```sh
pnpm commitlint --edit $1
```

### commitlint

`commitlint.config.mjs`:
```js
export default {
  extends: ["@commitlint/config-conventional"],
};
```

Allowed types: `feat`, `fix`, `chore`, `docs`, `style`, `refactor`, `test`, `ci`, `perf`, `revert`.

---

## 13. Testing Setup

### Vitest (unit + integration)

`vitest.config.ts`:
```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    coverage: {
      provider: "v8",
      thresholds: { lines: 80, functions: 80, branches: 80, statements: 80 },
    },
  },
});
```

### RTL custom render wrapper

`src/test/render.tsx` — wraps components in all providers (i18n, theme) so tests don't repeat boilerplate:

```tsx
import { render, type RenderOptions } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { ThemeProvider } from "next-themes";
import deMessages from "../../messages/de.json";

function AllProviders({ children }: { children: React.ReactNode }) {
  return (
    <NextIntlClientProvider locale="de" messages={deMessages}>
      <ThemeProvider attribute="class">
        {children}
      </ThemeProvider>
    </NextIntlClientProvider>
  );
}

export function renderWithProviders(ui: React.ReactElement, options?: RenderOptions) {
  return render(ui, { wrapper: AllProviders, ...options });
}

export * from "@testing-library/react";
```

`src/test/setup.ts`:
```ts
import "@testing-library/jest-dom";
```

### Test co-location

Unit/integration tests live next to source files:
```
src/components/shell/LocaleSwitcher.tsx
src/components/shell/LocaleSwitcher.test.tsx
```

### Playwright (E2E)

`playwright.config.ts`:
```ts
projects: [
  { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  { name: "firefox",  use: { ...devices["Desktop Firefox"] } },
],
baseURL: "http://localhost:3000",
webServer: { command: "pnpm dev", port: 3000, reuseExistingServer: true },
```

E2E tests in top-level `e2e/` directory.

`e2e/smoke.spec.ts` covers:
- App loads at `/de`, redirects from `/`
- Language switcher toggles to `/en`, content changes
- `/dev/showcase` renders without errors
- Dark mode toggle applies `dark` class to `<html>`

---

## 14. Environment Variable Validation

`src/lib/env.ts` — validated at startup using Zod, imported in `next.config.ts`:

```ts
import { z } from "zod";

const server = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]),

  // Epic 1.2 — DB
  DATABASE_URL: z.string().url().optional(),

  // Epic 1.3 — Auth
  NEXTAUTH_SECRET: z.string().min(32).optional(),
  NEXTAUTH_URL:    z.string().url().optional(),
  RESEND_API_KEY:  z.string().optional(),

  // Epic 1.4 — Redis
  UPSTASH_REDIS_REST_URL:   z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
});

const client = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url(),
});

export const env = {
  ...server.parse(process.env),
  ...client.parse(process.env),
};
```

`.env.example` is fully documented with all variables, their purpose, and where they come from.

---

## 15. Error Handling & Loading States

### Global error boundary (`src/app/[locale]/error.tsx`)

Styled `Card` with:
- Error icon
- Translated error heading (`common.error`)
- Error message (dev: `error.message`, prod: generic)
- "Try again" `Button` (calls `reset()`)
- Link back to `/{locale}` home

### 404 page (`src/app/[locale]/not-found.tsx`)

Same card pattern: 404 heading, translated message, home link.

### Loading skeletons

- `src/app/[locale]/loading.tsx` — full-page skeleton matching the app shell (sidebar outline + content area bars)
- Reusable `<PageSkeleton>` component in `src/components/ui/` with variants:
  - `list` — table rows shimmer (for Person/Event/Source lists)
  - `detail` — heading + attribute rows (for detail pages)
  - `card-grid` — 3-column card grid (for dashboard)

Pattern: every route segment that fetches data has its own `loading.tsx` that uses the matching `<PageSkeleton variant="...">`.

---

## 16. Component Showcase (`/dev/showcase`)

Route: `src/app/[locale]/dev/showcase/page.tsx`

Renders all shadcn/ui base components in one scrollable page, organized in sections:

```
Showcase sections:
  - Buttons (all variants + sizes)
  - Inputs (default, disabled, with label, with error)
  - Badges (all variants)
  - Cards (basic, with header/footer)
  - Dialog (trigger + modal)
  - Tabs (3-tab example)
  - Table (5-row sample data)
  - Toast (trigger button)
  - Skeleton (all PageSkeleton variants)
  - Dark mode toggle
  - Locale switcher
```

This page is always accessible in development. In production, it will be blocked by middleware (implemented in Epic 1.4).

---

## 17. `next.config.ts`

```ts
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

// Validate env at build time
import "./src/lib/env";

const withNextIntl = createNextIntlPlugin();

const config: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
};

export default withNextIntl(config);
```

Security headers and CSP are deferred to Epic 1.4.

---

## 18. npm Scripts

```json
{
  "scripts": {
    "dev":          "next dev --turbopack",
    "build":        "next build",
    "start":        "next start",
    "lint":         "eslint .",
    "lint:fix":     "eslint . --fix",
    "format":       "prettier --write .",
    "typecheck":    "tsc --noEmit",
    "test":         "vitest run",
    "test:watch":   "vitest",
    "test:coverage":"vitest run --coverage",
    "test:e2e":     "playwright test",
    "test:e2e:ui":  "playwright test --ui",
    "prepare":      "husky"
  }
}
```

---

## 19. Acceptance Criteria

All must be verifiable in the browser / CLI without any additional setup:

| # | Criterion |
|---|---|
| AC-1 | `pnpm dev` starts without errors; app renders at `http://localhost:3000` |
| AC-2 | `/` redirects to `/de` |
| AC-3 | `/de` and `/en` both render the app shell |
| AC-4 | Language switcher on `/de` navigates to `/en`; all visible UI text changes to English |
| AC-5 | Switching back to DE sets `NEXT_LOCALE` cookie; refreshing stays in DE |
| AC-6 | `/de/dev/showcase` renders all shadcn/ui base components without errors |
| AC-7 | Dark mode toggle applies/removes `dark` class on `<html>`; colors shift |
| AC-8 | Sidebar collapses to icon rail on toggle; state persists across page navigation |
| AC-9 | `pnpm typecheck` exits 0 |
| AC-10 | `pnpm lint` exits 0 |
| AC-11 | `pnpm test` passes (smoke tests for AppShell, LocaleSwitcher, error boundary, Skeleton) |
| AC-12 | `pnpm test:e2e` passes on Chromium + Firefox |
| AC-13 | `pnpm build` succeeds |
| AC-14 | A commit with message `bad commit message` is rejected by commitlint |
| AC-15 | A commit with a type error in staged files is rejected by pre-commit hook |
| AC-16 | Navigating to a non-existent route shows the styled 404 page |
| AC-17 | `.env.example` contains all env vars with comments |

---

## 20. Out of Scope for This Epic

- Database connection (Epic 1.2)
- Authentication routes and session (Epic 1.3)
- Rate limiting / security headers (Epic 1.4)
- Real navigation targets (stubs only; links go to `#` or locale root)
- Project switcher logic (Epic 3.1)
- User profile / DB-persisted locale (Epic 5.3)
- Production middleware blocking `/dev/showcase` (Epic 1.4)
