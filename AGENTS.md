# Codex review guidance for Evidoxa

Use these instructions when reviewing pull requests in this repository.

## Review priorities

Prioritize findings that could cause incorrect behavior, data loss, security issues, tenant isolation failures, or scholarly data corruption. Prefer a small number of high-confidence findings over speculative or stylistic comments.

Do not report formatting, import ordering, lint, typecheck, or other issues that the existing automated checks already catch unless they reveal a deeper correctness problem.

## Multi-tenancy and authorization

Every user-owned domain record is project-scoped. Treat missing or incomplete project scoping as a security issue.

When code reads, creates, updates, or deletes project data, verify that it checks the current user's membership and role for the relevant project and does not rely only on client-provided project IDs or entity IDs.

Look for indirect cross-project access as well as direct access. This includes relations, evidence, nested writes, bulk operations, exports, searches, and API routes that resolve one entity through another.

Do not assume that knowing a CUID proves authorization.

## Historical data integrity

The data model intentionally supports uncertainty, partial dates, provenance, and contradictory evidence. Flag changes that silently collapse or invent precision.

Partial dates must remain partial: do not coerce a year-only or year-month value into a fabricated full date. Preserve the semantic ordering rules for year, month, and day.

Certainty is categorical and belongs to individual assertions. Flag code that moves certainty to the wrong scope, treats it as a numeric probability, or loses it during transformations.

Evidence is first-class scholarly data. Flag code that drops, overwrites, merges, or disconnects evidence without an explicit product requirement. Preserve distinctions such as raw transcription versus interpreted quote.

The entity value is the researcher's current best estimate; competing source claims may coexist in evidence. Do not "resolve" conflicting evidence automatically by deleting or normalizing away disagreement.

## Relation graph integrity

Relations are polymorphic and cannot rely on database foreign keys for `from_id` and `to_id`. Review application-layer validation carefully whenever relation creation, update, deletion, import, or bulk processing changes.

Verify that entity types and IDs agree, referenced entities exist in the same project, and the selected relation type permits the source and target entity types.

Temporal relation bounds use the same partial-date semantics as entity dates. Do not invent missing components.

## Soft delete and auditability

Person, Event, Source, and Relation use soft deletion. Flag new hard-delete paths unless the change explicitly requires them and accounts for dependent scholarly data.

`EntityActivity` is intended to be append-only. Treat code that deletes or mutates historical audit entries as high risk unless there is an explicitly documented migration or repair procedure.

When an operation changes scholarly records, check whether the activity/provenance behavior remains consistent.

## Database and production safety

Treat database migrations, CI database setup, secrets, cache namespaces, rate-limit namespaces, and deployment steps as high-risk areas.

Do not infer environment identity from names, hostnames, row counts, or variable names when the code can measure the real system state. For destructive, production-facing, or security-sensitive changes, require evidence from an actual guard, query, test, or explicit invariant.

Prisma migrations must use the project's migration workflow. Do not recommend `prisma db push` as a substitute for migrations.

Flag code paths that could make tests, seed scripts, cleanup jobs, or CI operate on production or shared mutable data.

## Authentication, security, and input handling

Review authentication and authorization separately: a valid session does not imply permission for a project or record.

Check server-side validation for untrusted input even when equivalent client-side validation exists. Shared Zod schemas in `src/lib/schemas/` are the preferred source of truth for entity validation.

Pay particular attention to password/auth flows, rate limiting, cache key isolation, redirects, file or HTML input, exports, and any endpoint that accepts IDs or project identifiers.

Do not claim an exploit is reachable solely from code inspection when deployment behavior is material. State clearly when a security concern is an inference rather than demonstrated behavior.

## Next.js and React architecture

This is a Next.js App Router application. Server Components are the default; client components should be limited to leaves that need browser interactivity.

Flag accidental client-side exposure of secrets, server-only database access, authorization logic, or privileged data.

Avoid suggesting broad refactors when a focused correctness fix is sufficient.

## Accessibility and UX regressions

For changed interactive UI, look for regressions in keyboard operation, focus management, accessible names, form labels/errors, dialog behavior, and semantic HTML.

Do not duplicate automated axe or Playwright findings unless the code change shows a concrete issue not adequately covered by those checks.

The UI should hide domain complexity without erasing scholarly meaning. Flag simplifications that make uncertainty, evidence, provenance, or conflicting claims misleading to the user.

## Tests and validation

For behavior changes, verify that tests exercise the failure mode, not only the happy path. Security and tenant-isolation fixes should ideally include a test that fails before the fix and passes after it.

Use the repository's existing commands and conventions: `pnpm lint`, `pnpm typecheck`, `pnpm test`, and relevant Playwright tests.

Do not require exhaustive E2E coverage for every small change, but call out missing regression coverage when the changed code affects authorization, data integrity, destructive operations, migrations, or critical user flows.

## Documentation consistency

The README explains architectural and scholarly rationale. Flag a documentation mismatch when a PR changes the stack, required environment variables, data-model rationale, certainty/evidence semantics, partial dates, relation graph, soft delete, multi-tenancy, CIDOC CRM positioning, or getting-started commands without updating the README.

Do not request README updates for routine feature work or refactors that leave those architectural contracts unchanged.

## Review style

Only file findings that are actionable and tied to the changed code.

For each finding, explain the concrete failure mode and why it matters in this project. Prefer precise examples such as a cross-project read, lost evidence record, invented date precision, production data exposure, or a missing authorization guard.

Distinguish measured facts from inference. Avoid speculative warnings presented as confirmed bugs.
