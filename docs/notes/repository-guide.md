# Repository guide for coding agents

Onboarding verified 2026-09-07. This is a navigation aid, not a second backlog.
Recheck live permissions, branch state, and environment identity before relying
on the dated observations below.

## Start here

- `AGENTS.md`: review priorities, especially tenant isolation and scholarly integrity.
- `CLAUDE.md`: repository conventions, backlog discipline, and measurement rules.
- `README.md`: stack, setup commands, and the reasoning behind the data model.
- GitHub [issues](https://github.com/mathisthomsen/historian-app/issues) and
  [Evidoxa Backlog](https://github.com/users/mathisthomsen/projects/1): current work.
  Read issue comments as well as descriptions; later comments sometimes correct
  earlier investigations. Reproduce reported failures before accepting a cause.
- `docs/specs/{epic}/`: specification, brainstorming, progress, and test plan.
  `docs/specs/roadmap.md` holds the phase structure. The AI-aided roadmap is a
  separate proposal; do not infer authorization to implement it.
- `docs/design-system/`, `docs/implementation/`, and
  `skills/platforms/evidoxa.md`: design rationale, implementation specifications,
  and the Evidoxa overlay for UX reviews.

## App and code map

Evidoxa is a historical research workspace for people, events, primary sources,
relations, and supporting evidence. The intended initial audience is academic
and archival researchers in DACH. German is the default UI language; English is
also supported. Domain content is independent of UI locale.

| Concern                                                | Entry points                                                             |
| ------------------------------------------------------ | ------------------------------------------------------------------------ |
| Protected pages and server rendering                   | `src/app/[locale]/(app)/`                                                |
| Authentication pages                                   | `src/app/[locale]/(auth)/`                                               |
| Research UI and forms                                  | `src/components/research/`, `src/components/relations/`                  |
| Shared UI and shell                                    | `src/components/ui/`, `src/components/shell/`                            |
| Auth.js Node configuration and Edge configuration      | `src/auth.ts`, `src/auth.config.ts`, `src/middleware.ts`                 |
| Active project provisioning                            | `src/lib/project.ts`                                                     |
| API handlers and common response/authorization helpers | `src/app/api/`, `src/lib/api.ts`                                         |
| Shared validation                                      | `src/lib/schemas/`, `src/lib/entity-validation.ts`                       |
| Database schema, migrations, and clients               | `prisma/`, `src/lib/db.ts`                                               |
| Domain activity and authentication audit               | `src/lib/activity.ts`, `src/lib/audit.ts`                                |
| Cache and rate limiting                                | `src/lib/cache.ts`, `src/lib/rate-limit.ts`, `src/lib/rate-limit-key.ts` |
| Email                                                  | `src/lib/email.ts`, `src/app/api/auth/`                                  |
| Translations and design tokens                         | `messages/de.json`, `messages/en.json`, `src/styles/globals.css`         |

Server pages can query the database directly; client mutations use API routes.
Review both paths when changing authorization or response shapes. API helpers
provide project membership checks, write roles, error codes, and the common
`{ data, pagination }` list envelope. Authentication alone is not authorization.

Preserve partial dates, categorical certainty on individual assertions,
competing evidence, and the distinction between transcription and interpreted
quote. Relations use polymorphic IDs and need application validation of entity
type, existence, project, and allowed relation endpoints. `prisma` is the base
client; `db` adds only selected soft-delete filters. Do not assume all query
methods automatically exclude deleted records. Location and Literature already
exist in the schema even though their full product workflows are future work.

## Claude metadata

`.claude/skills/spec.md` and `.claude/skills/dev.md` describe the previous
specification and implementation workflows. `.claude/agents/` and
`.claude/commands/` contain specialist roles and design-system orchestration.
Read them as workflow context; onboarding does not invoke those commands.

On this machine, project memory is under
`/Users/Lily/.claude/projects/-Users-Lily-Documents-historian-app/memory/`
(the directory uses a hyphen although this checkout uses an underscore).
Useful topics include default-project provisioning, local-server gotchas,
Auth.js callbacks, translation mocks, and database branch topology.

Those files contain historical and contradictory statements. For example,
`MEMORY.md` names `feat/rebuild` as active and describes fail-open rate limiting;
the checked-out `src/lib/rate-limit.ts` denies requests when Redis fails. Use
memory to find evidence, not to establish current runtime state. Do not copy
credentials or private production records into repository documentation.

## Toolchain and validation

The repository requires Node >=22 and pnpm 9.15.4. During onboarding, the login
shell selected Node 14.16.1 through nvm, which made the pnpm shim fail before it
could run. `/usr/local/bin/node` is installed as Node 22.17.0. This command
successfully selected the installed toolchain without editing shell settings:

```bash
env PATH=/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin:/usr/sbin:/sbin pnpm --version
```

Use that process-local PATH for pnpm commands on this machine when needed.
Standard checks are `pnpm lint`, `pnpm typecheck`, `pnpm test`, and relevant
`pnpm test:e2e` tests. Vitest uses colocated tests and `src/test/setup.ts`;
Playwright uses `e2e/`, Chromium and Firefox, and a single worker.

Before E2E or any database write, verify the actual database branch identity
with `current_setting('neon.branch_id', true)` and the existing guards in
`e2e/global-setup.ts` and `e2e/helpers/guard.ts`. Do not use endpoint names as
proof. Check both the app server and test helpers, including cache/rate-limit
namespaces. Migrations use `migrate dev` locally and `migrate deploy` in CI;
never substitute `db push`.

Issue #61 contains unresolved local hydration investigations and corrections.
Before browser testing, verify the process serving the chosen port, matching
auth origin, and successful loading of the JavaScript chunks. Issue #68 records
outbound email from E2E and signup timeout concerns. These are existing reports,
not failures reproduced during onboarding. No app server, tests, database
queries, migrations, or email sends were run during this onboarding.

## GitHub access and checkout snapshot

- Repository: `mathisthomsen/historian-app`; authenticated account:
  `mathisthomsen`; repository permission: `ADMIN`.
- CLI token scopes reported `repo`, `project`, `read:org`, `workflow`, and `gist`.
  Issue and project `viewerCanUpdate` checks returned true. Network calls
  required execution outside the sandbox; the initial sandbox authentication
  failure did not mean the credential was invalid.
- Actual writes succeeded by reapplying issue #72's existing `spec-needed`
  label and existing `Todo` project status. Final labels and status were
  unchanged; metadata timestamps may have advanced. No test issue or comment
  was created.
- Board ID: `PVT_kwHOAQhKWs4Bf1Pm`. Status field:
  `PVTSSF_lAHOAQhKWs4Bf1PmzhaFRfA`. Options at verification: `Todo` =
  `f75ad846`, `In Progress` = `47fc9ee4`, `Done` = `98236657`. Re-query before
  using IDs for future mutations.
- There were 40 open issues and no open PRs. The board had 52 items. Live GitHub
  remains authoritative for counts, priorities, and assignment of work.
- Checkout: `fix/64-default-project-provisioning` at `2b289d8`; GitHub `main`
  at `9ae43c4` adds merge PR #66 with no file differences. No branch switch,
  fetch, commit, or code edit was performed.

For issue work, follow `CLAUDE.md`: search existing issues, preserve an
actionable description and evidence, use one priority plus relevant area/type
labels, and maintain board status. An existing `In Progress` status is not
proof that another worker is currently active; establish ownership before
starting overlapping work.
