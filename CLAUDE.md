## Active platform

UX skill overlay: `skills/platforms/evidoxa.md`. Load it whenever running the UX review/audit
skills (`ux`, `ux-audit`, `ux-mr`, `ux-reviewer`, etc.) against this repo — it supplies the
user-type vocabulary, mental-model rules, brand voice, and stack adapter specific to Evidoxa.

## Context efficiency

Be conservative with tool output.

- Limit potentially verbose Bash output with `head`, `tail`, `grep`, or command-specific limits.
- Never `cat` large files; use Read with offset/limit.
- Search files before reading them in full.
- Show test failures/errors rather than complete successful test output.
- Prefer targeted `git diff`, file searches, and directory listings.
- Do not load large generated files, logs, lockfiles, or build output unless necessary.

## Keep the README current

`README.md` documents the stack and, more importantly, _why_ the data model looks
the way it does. Update it in the same commit as any change that makes it wrong:

- stack or tooling changes (versions, a swapped library, a new required env var)
- data-model changes that affect the rationale — certainty, evidence, partial
  dates, the relation graph, soft delete, multi-tenancy
- anything that moves the model toward or away from CIDOC CRM, or changes the
  documented limitations
- changes to the getting-started steps or the command table

Do not update it for routine feature work, refactors or bug fixes that leave the
architecture and its reasoning intact. The README is not a changelog — no status
sections, test counts, or "currently in progress" notes, all of which rot.

## Backlog discipline

The backlog is **GitHub Issues** on this repo plus the **Evidoxa Backlog** project
board (`gh project 1 --owner mathisthomsen`). It is the single place where known
work lives. A finding reported only in chat is a finding that will be lost.

### File it

When you discover a problem, a risk, or deferred work that outlives the current
task, open an issue — even if it is out of scope, especially if it is out of scope.
Do not silently widen the current task to fix it.

Every issue gets:

- exactly one `priority: high | medium | low`
- at least one `area:` label
- `bug` / `enhancement`, plus `tech-debt` or `spec-needed` where they apply
- a place on the project board with a Status

Write the body so it is actionable months later by someone without this
conversation: what is wrong, how it was observed, why it matters, and where in the
code it lives. Record evidence — a query result, a failing assertion, a DNS lookup
— not just a claim. State what you did **not** verify.

### Cross-check before filing

Search open issues first. A new symptom is often an existing issue, and two
half-described issues are worse than one well-described one. Prefer commenting on
the existing issue over opening a near-duplicate. When two issues are genuinely
distinct but entangled, cross-link them and say how they interact — some pairs are
cheaper to solve together than separately.

Also check the reverse direction: a new finding sometimes **explains** an old
issue that was previously only a symptom. Say so on the old issue.

### Keep it current

- Move Status when work starts, and close on merge referencing the PR or commit.
- Partial progress gets a comment, not silence. An issue that moved and did not say
  so is indistinguishable from a stale one.
- **Code changes can invalidate an issue.** When you touch an area, check the open
  issues for it. If a change fixed, worsened, or reshaped one, update or close it in
  the same PR — that is the only moment the context is cheap.
- Correct issues that turn out to be wrong. A confidently-worded wrong issue costs
  more than no issue.

### Grooming

Do a grooming pass when asked, and offer one when starting substantial work in an
area with several open issues. A pass means: re-read each open issue against the
current code, close what is done or obsolete, fix stale descriptions, re-prioritise
against what is now known, and merge duplicates. Report what changed and why.

Prefer splitting an issue that has grown several independent parts — progress on
one should be visible without waiting for the rest.

## Measure, don't infer

When a claim can be tested, test it before acting on it, writing it into an issue,
or reporting it as fact.

Three wrong conclusions in one session, each a reasonable inference from real
evidence, each wrong:

- A `Windows NT 10.0` user-agent in the audit log was read as proof of a Windows
  machine. It is Playwright's default and appears identically from macOS — the
  same value was sitting in the dev database from a local run.
- `vercel env ls` showing "154d ago" was read as "not rotated". That column is
  **created**, not updated. Acting on it overwrote a production credential.
- Code reading the leftmost `X-Forwarded-For` was written up as a live,
  exploitable rate-limit bypass. Vercel overwrites that header; two requests and
  a hash comparison disproved it in a minute, after the issue was already filed.

What to do instead:

- **Ask the system, not the name.** Branch identity comes from
  `SELECT current_setting('neon.branch_id')` — never a hostname, env var name, or
  row count. Endpoint names in this project are actively misleading.
- **Run the experiment.** Send the two requests and compare. Mutate the
  implementation and confirm the test fails. Point the guard at the thing it is
  meant to refuse and watch it refuse.
- **Check what a field means** before trusting it — created vs. updated, local vs.
  UTC, default vs. host-derived.
- For anything security-relevant, destructive, or headed for production,
  measurement is required rather than preferred.

Say which claims were measured and which were inferred. An inference must never
reach an issue, a commit message, or a production action wearing the confidence of
a measurement.
