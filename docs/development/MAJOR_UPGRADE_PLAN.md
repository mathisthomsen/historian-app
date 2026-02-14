# Major dependency upgrade plan (future)

This doc outlines a **future** upgrade pass for major versions. Do not do this ad hoc; plan a dedicated sprint and test thoroughly.

**Current state (as of Feb 2026):**

- **Next.js**: 15.5.x (latest 15.x). Next 16 is available and is a major upgrade.
- **Prisma**: 6.x. Prisma 7 is available (major).
- Other majors available later: Resend 6, Zod 4, echarts 6, node-fetch 3, nodemailer 8, @types/node 25.

---

## When to do it

- When you need features or security fixes that require a major.
- When you have time for a focused refactor and full regression testing (lint, type-check, tests, manual flows).

---

## Next.js 16

- **Upgrade:** `npx @next/codemod@canary upgrade latest` or `npm install next@latest react@latest react-dom@latest`.
- **Requirements:** Node 20.9+ (Node 18 no longer supported).
- **Breaking areas:**
  - Turbopack is now the default; custom webpack config will break unless you migrate to Turbopack or use `--webpack`.
  - Middleware is replaced by **Proxy** (`proxy.ts`) for network boundaries.
  - See: [Upgrading: Version 16](https://nextjs.org/docs/app/guides/upgrading/version-16).

---

## Prisma 7

- **Upgrade:** `npm i -D prisma@latest` and `npm i @prisma/client@latest`.
- **Note:** `package.json#prisma` config is deprecated; migrate to a Prisma config file (e.g. `prisma.config.ts`) before or during the upgrade.
- **Guide:** https://pris.ly/d/major-version-upgrade

---

## Other majors (optional, as needed)

| Package        | Current | Next major | Notes                          |
|----------------|---------|------------|--------------------------------|
| Resend         | 4.x     | 6.x        | Check API changes for email.   |
| Zod            | 3.x     | 4.x        | Schema API may change.         |
| echarts        | 5.x     | 6.x        | Chart options/imports.         |
| node-fetch     | 2.x     | 3.x        | ESM-only; update imports.      |
| nodemailer     | 7.x     | 8.x        | Only if next-auth supports it.|
| @types/node    | 24      | 25         | Type churn; do with Node 24+.  |

---

## Suggested order

1. **Next 16** (framework + React 19.2, eslint-config-next 16).
2. **Prisma 7** (move to `prisma.config.ts`, then upgrade).
3. Others only if you need features or security fixes from those majors.

After each major: run `npm run check` (lint, type-check, test, build) and manually test auth, imports, and critical flows.
