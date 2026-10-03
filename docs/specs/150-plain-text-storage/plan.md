# Plain-text storage — Implementation Plan

> **For agentic workers:** this plan carries no code. Each task names its files, the tests written
> first and the check that ends it. The backfill rewrites production rows, so this plan ships in its
> own PR, ahead of any implementation (`CLAUDE.md`, "Reviewing the plan before the implementation").

**Tracks:** #150. **Precedes:** #139's export (owner, 2026-10-03, [#150 comment](https://github.com/mathisthomsen/historian-app/issues/150)).

**Revision 2 (review on PR #153, all six findings accepted).** Changed passages carry a tag
**[R1]**–**[R6]**:

- **[R1]** Cutover: T3's deploy and the backfill happen inside one owner-announced write freeze, and
  the backfill only touches rows older than T3's recorded deploy time.
- **[R2]** Rollback baseline: T2 ships as its own PR and production deploy before T3 merges.
- **[R3]** A selective restore script, and G2 rehearses both the backfill and the restore.
- **[R4]** The activity count query counts only snapshots that need decoding (re-verified).
- **[R5]** Stored `&amp;`/`&lt;` is ambiguous, not "already lost": originals are kept per row, and
  rows that probably held typed entity text are listed for owner review.
- **[R6]** Stale forms: closed during the freeze, rechecked twice afterwards; the general gap is #50.

**Goal:** text a researcher types will be stored exactly as the write path is designed to keep it,
and will be shown exactly as typed. `Müller & Söhne` will be stored and displayed as `Müller & Söhne`,
not `Müller &amp; Söhne`.

**Decision recap (option a, owner):** store text as typed; escape at every output boundary instead of
on write; backfill the rows already stored. The problem itself is described in #150 and not restated
here.

**Architecture:** three changes, in this order of going live —

1. **Output escaping** (T2): every non-React HTML sink — today only the four email templates in
   `src/lib/email.ts` — escapes every interpolated value by construction. **[R2]** T2 ships as its
   own PR and production deploy, live before T3 merges.
2. **Write path** (T3): `sanitize()` stops entity-encoding. Whether it keeps stripping tags is owner
   decision **D1** below; the recommendation is to store verbatim and remove `sanitize()` entirely.
3. **Backfill** (T4): an owner-run, guarded script decodes `&lt;`, `&gt;`, then `&amp;` in the 36
   columns listed below and in the matching activity snapshots — once, in one transaction.
   **[R1]** It runs inside the same write freeze as T3's deploy, only on rows last written before
   T3's deploy started. **[R5]** Every original value is kept in a backup table, so any row can be
   put back. **[R3]** A restore script reverses selected rows.

## Global constraints

- **[R2] T2 is its own PR and its own production deploy**, confirmed live by CI's live check and
  `/api/health` before T3 merges. A raw value must never reach an unescaped HTML sink, and the
  deployment just before T3 must already escape: then an instant rollback from T3 lands on T2.
- **[R2] After G4, production is never rolled back past T2.** This is a runbook rule. It is
  procedural, not enforced (see "Cutover").
- **[R1] No verbatim row ever reaches the decoder.** The backfill runs in the write freeze around
  T3's deploy and only touches rows whose timestamp is before the recorded cutoff.
- **No agent touches production.** The count query, the rehearsal, the backup branch and the
  backfill are owner gates (G1–G4). Agents prepare and stop.
- **No un-namespaced Redis.** Nothing in this plan writes to Redis; the backfill does not flush the
  cache (list caches expire in ≤ 60 s — `src/app/api/persons/route.ts:115`,
  `events/route.ts:196`, `sources/route.ts:121`, `relations/route.ts:251`,
  `(app)/persons/page.tsx:111`).
- **Public repo.** If T2's audit finds a sink that is under-escaped today, the public artifacts
  carry its class, impact and fix only; the reproduction goes to a draft security advisory.

## What `sanitize()` does today — measured

Measured 2026-10-03 with the installed `sanitize-html@2.17.1` (lockfile pins the same) and the exact
options of `src/lib/sanitize.ts:8–10` (`allowedTags: []`, `allowedAttributes: {}`).

| Input                           | Stored                  | Note                                                   |
| ------------------------------- | ----------------------- | ------------------------------------------------------ |
| `Müller & Söhne`                | `Müller &amp; Söhne`    | `&` encoded                                            |
| `Briefe 1848 < 1850`            | `Briefe 1848 &lt; 1850` | `<` encoded when not followed by a tag-start character |
| `x > y`                         | `x &gt; y`              | `>` encoded                                            |
| `"Faust"`, `'s`                 | unchanged               | quotes are **not** encoded                             |
| `<b>x</b>`                      | `x`                     | tags stripped                                          |
| `<script>alert(1)</script>`     | empty                   | element and its content dropped                        |
| `a<b`, `x<y and more text`      | `a`, `x`                | **everything after `<letter` is lost**                 |
| `fol. 12r <sic>`                | `fol. 12r `             | editorial markup in transcriptions is lost             |
| `[sic] <unclear>Wort</unclear>` | `[sic] Wort`            | same                                                   |
| `&amp;` (typed literally)       | `&amp;`                 | input entities are **decoded first**, then re-encoded  |
| `&lt;script&gt;` (typed)        | `&lt;script&gt;`        | same                                                   |
| `&copy;`, `&#65;`, `&nbsp;`     | `©`, `A`, U+00A0        | decoded, never re-encoded                              |
| `&quot;`                        | `"`                     | decoded                                                |
| `&foo;`                         | `&amp;foo;`             | unknown entity kept as text                            |
| U+0000                          | kept                    | not filtered                                           |

Exhaustively over the BMP (each character between two letters), exactly three characters change:
`&` → `&amp;`, `>` → `&gt;`, and `<` (here followed by a letter, so treated as a tag start and
dropped). Every sample above is idempotent: `sanitize(sanitize(x)) === sanitize(x)`.

**Invariant (fuzzed, 200 000 random strings over `& < > ; # " ' / ! - = amp lt gt script …`,
zero violations):** a value written through `sanitize()` contains no raw `<` or `>`, and every `&`
in it begins `&amp;`, `&lt;` or `&gt;`. Re-encoding the decoded value reproduces the stored value
exactly, so decoding those three entities is the **exact inverse of the encode step**. Decoding
`&amp;` before the others gives a different result in 210 of the 200 000 cases (stored `&amp;lt;`
must become `&lt;`, not `<`), so `&amp;` is decoded **last**.

Consequence for the backfill: information lost at write time (stripped tags, text truncated after
`<letter`, entities like `&copy;` turned into characters) **cannot be recovered**.

**[R5] Stored `&amp;` and `&lt;` are ambiguous.** The first revision said a typed `&amp;` was
"already lost". That was wrong. A stored `&amp;` comes either from a typed `&` or from a typed
`&amp;`. React shows the stored bytes, so the first researcher sees `&amp;` today (wrong) and the
second sees `&amp;` (what they typed). Decoding fixes the first and changes the second. The same
holds for `&lt;`, which comes from a typed `<` or a typed `&lt;`. The data cannot say which.
Decision, owner-gated: **decode**, because a typed `&` is the common case in historical text. But
keep every original value per row in a backup table, and list the rows that probably held typed
entity text for owner review before G4 (G1b). Two signals, measured by fuzzing `sanitize()`:

- the decoded value still contains an entity-like sequence `&[A-Za-z#0-9]+;`. Across 200 000
  random inputs this happened **only** when the input itself contained entity-like text (0 false
  positives). Example: stored `&amp;lt;` decodes to `&lt;`;
- the stored value has `&lt;` directly before a letter, `/`, `!` or `?`. Example: a typed
  `&lt;script&gt;`. A typed `<` before those characters starts a tag and is stripped (measured over
  U+0021–U+1FFF: 57 such characters, all ASCII). This signal is a heuristic: 3 339 of 200 000 adversarial inputs
  (for example `<</`) produce it without typed entity text.

## Load-bearing assumptions

M = measured, A = assumed. Security-relevant or production-bound entries marked A name the task
that measures them; none may still be A when its gate is reached.

| #   | Premise                                                                                                                                                       | State                                              | Evidence · method that could observe it false                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| L1  | React escapes every JSX text and attribute sink these columns reach.                                                                                          | M (library) · A (app) → T5                         | `react-dom/server@19.2.4`, `renderToString`: text `Müller & Söhne 1848 < 1850 <script>x</script> " '` → `&amp; … &lt; … &lt;script&gt; … &quot; &#x27;`; attribute `a"b<c>&d` → `a&quot;b&lt;c&gt;&amp;d`. Whether every app surface goes through JSX is the next row. Method: T5 E2E in a real browser renders payloads as literal text and no dialog fires.                                                                                                                                                                                                                                                                                               |
| L2  | No `dangerouslySetInnerHTML`, `innerHTML` or HTML-string API renders any of these columns.                                                                    | M (code)                                           | `git grep` over `src/`: two `dangerouslySetInnerHTML`, both static (`(marketing)/layout.tsx:29` inline boot script, `(marketing)/page.tsx:153` JSON-LD from constants). No `innerHTML`/`insertAdjacentHTML`/`DOMParser` in app code; no `t.markup`/`t.rich`; `next-mdx-remote` renders only `src/lib/changelog.ts` content. Method: T2 adds a guard test (below).                                                                                                                                                                                                                                                                                           |
| L3  | `generateMetadata`/`<title>` never interpolates a stored value.                                                                                               | M (code)                                           | Every `generateMetadata` under `src/app` returns translation strings only (list, settings and marketing pages); detail pages have none. Method: T2 guard test greps for it.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| L4  | The email templates are the only non-React HTML sinks, and they will escape every interpolation after T2.                                                     | M (sinks) · A (escape) → T2                        | Today they interpolate `name`, `institution`, `researchArea`, `toolGap`, `email`, `locale` into HTML text nodes **relying on pre-escaped input** (`src/lib/email.ts:77,85,108,116,191–192,249,259`; contract comments `:140–148`, `:234–235`). Method: T2 unit test renders every template with a hostile value in every user-sourced parameter; T6 mutation removes the escape and watches it fail.                                                                                                                                                                                                                                                        |
| L5  | Plain-text parts and subjects must **not** be HTML-escaped.                                                                                                   | M (code)                                           | `text` (`email.ts:92,123,205–213,266`) and `subject` (`:175`, which carries the requester's name) are plain text; escaping them reintroduces `&amp;` literally. Today the escaped name already shows literally there. Method: T2 unit asserts `Müller & Söhne` verbatim in `text` and `subject`.                                                                                                                                                                                                                                                                                                                                                            |
| L6  | `sanitize-html` emits exactly `&amp;`, `&lt;`, `&gt;` and nothing else.                                                                                       | M                                                  | See "What `sanitize()` does today". Method: T4's script test asserts the decoder on fuzzed `sanitize()` output (re-encode equals input).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| L7  | **[R1]** Every value the backfill touches was written through `sanitize()`, so decoding is exact for it.                                                      | M (design) · A (freeze) → G4                       | All application write sites go through `sanitize()` (table below). Rows written after T3 are verbatim, and the backfill excludes them by construction: it only touches rows whose cutoff column (`updated_at`, or `created_at` for append-only tables and `users.name`) is before T3's deploy start. The freeze keeps rows of unknown origin out of the cutoff boundary. Other exceptions: rows written by hand, or by `prisma/seed.ts` (no `&` in it; dev/CI only, never production per `ci.yml:313`). Method: G1's `excluded_after_cutoff` and `rows_not_sanitize_shaped` columns, both expected 0 inside the freeze.                                     |
| L8  | **[R5]** A stored `&amp;` or `&lt;` usually stands for a typed `&` or `<`.                                                                                    | A — not measurable from data; partly flagged → G1b | The data cannot tell a typed `&` from a typed `&amp;` (see "Stored `&amp;` and `&lt;` are ambiguous"). Consequence if false for a row: a researcher who typed `&amp;`, and sees it correctly today, will see `&` after G4. Mitigation: the original is kept per row (backup table) and can be restored with the restore script. G1b lists the rows with a measured signal of typed entity text (0 false positives in fuzzing) plus a heuristic one.                                                                                                                                                                                                         |
| L9  | Row counts per column in production.                                                                                                                          | **Unmeasured** → G1                                | Production-bound: must be an owner-run, read-only query before the backfill (SQL below).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| L10 | Decoding cannot violate a unique constraint — except `event_types (project_id, name)`.                                                                        | M (schema) · A (data) → G1                         | Unique text keys: `users.email`, `access_requests.email` (validated, cannot contain `&`/`<`/`>` — `zod@3.25.76` `.email()` rejects `a<b@`, `a&b@`, `a"b@`; accepts `a'b@`) and `event_types @@unique([project_id, name])` (`schema.prisma:272`). After T3, `A & B` can be created next to a stored `A &amp; B`; decoding both collides. Method: G1 collision query; the backfill transaction aborts on it.                                                                                                                                                                                                                                                  |
| L11 | Raw SQL `UPDATE` leaves `updated_at` alone.                                                                                                                   | M (code)                                           | `@updatedAt` is set by Prisma Client; no trigger or function in `prisma/migrations/`. Intended: the backfill is a representation change, not an edit by a person.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| L12 | `entity_activity.old_value/new_value` are JSONB, and for `PERSON`/`EVENT`/`SOURCE` field updates they hold the sanitized string.                              | M (code)                                           | JSONB (`20260314180300_epic_2_4_entity_activity/migration.sql:24–25`); written from the updated row (`persons/[id]/route.ts:221–233`, `events/[id]/route.ts:311–323`, `sources/[id]/route.ts:143–157`). **Not** for relations: `relations/[id]/route.ts:128–135` logs the raw request body, which was never sanitized, so those snapshots are already as typed and must not be decoded.                                                                                                                                                                                                                                                                     |
| L13 | No reader decodes these values today.                                                                                                                         | M (code)                                           | `git grep` for `decode`, `unescape`, `he.`, `&amp;` in `src/` outside tests: no decoder. So removing the encoding cannot double-decode anywhere. (Closes #150's "not verified" line.)                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| L14 | The backfill SQL behaves as written on Postgres.                                                                                                              | M (PGlite) · A (Neon) → G2                         | Run on PGlite (Postgres 16.4) with seeded `sanitize()` output: lookahead regex `&(?!(amp\|lt\|gt);)` works; decode order correct; length identity below holds (111 → 83 chars = 4×4 + 2×3 + 2×3); `jsonb_typeof`/`#>> '{}'` leaf decode leaves `null` and objects alone; a `READ ONLY` transaction refuses `UPDATE`. Method: G2 rehearsal on a Neon branch copied from production.                                                                                                                                                                                                                                                                          |
| L15 | A migration would not be rehearsed on data by CI.                                                                                                             | M                                                  | CI's ephemeral branch is created from `ci-base`, an empty root branch (`ci.yml:106–109`); `prisma migrate deploy` there builds schema on zero rows.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| L16 | There is no CSP backstop for the web app.                                                                                                                     | M                                                  | Production CSP allows `script-src 'self' 'unsafe-inline'` (`next.config.ts:52–54`). So output escaping is the only defence; L1/L2 carry the weight.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| L17 | **[R1]** The start time of CI's "Deploy to Vercel (production, not yet live)" step for the T3 merge commit comes before any T3 code served or wrote anything. | M (code) · A (platform) → G2                       | That step builds the T3 deployment (`ci.yml:338`), so no T3 code exists before it starts. The step's `started_at` is read from the run's jobs API (`gh api repos/<owner>/<repo>/actions/runs/<id>/jobs`). It is not the time the live check completed: T3 could write between promotion and that completion, and those rows would fall before such a cutoff. Live-check success plus `/api/health` reporting the T3 merge SHA proves T3 is live, and that is the earliest moment G4 may run. Method: T4's PGlite test excludes a post-cutoff row. At C3 the owner reads the timestamp from the real run and checks that it comes before the promote step's. |
| L18 | **[R1][R6]** The write freeze holds: nobody edits between its announcement and the end of G4, and no edit form stays open across it.                          | A (procedural)                                     | Pre-alpha has a single real user (owner's statement, not measured), so a freeze is a message, not a mechanism. The public access-request form cannot be frozen; the cutoff handles it. Method: inside the freeze, G1 expects `excluded_after_cutoff = 0`; the two rechecks after G4 detect stale-form saves. Nothing prevents a violation; the rechecks only detect it.                                                                                                                                                                                                                                                                                     |
| L19 | **[R2]** No production rollback lands on pre-T2 code after G4.                                                                                                | A (procedural)                                     | Once T2 is a separate production deploy before T3, an instant rollback from T3 lands on T2. Every later deploy contains T2, since `main` is linear. Going further back takes a deliberate choice of an older deployment, and nothing technical stops it. Method: runbook rule ("Cutover"); open question 7 asks about removing pre-T2 production deployments.                                                                                                                                                                                                                                                                                               |

## Write sites — the backfill column list

Every call of `sanitize()` on `main` (`git grep -n "sanitize(" -- src`, tests excluded), and the
column it stores into. Soft-deleted rows are included in the backfill: the export carries them.

| Table               | Columns                                                                       | Write sites                                                                    |
| ------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `users`             | `name`                                                                        | `api/auth/register/route.ts:92`                                                |
| `persons`           | `first_name`, `last_name`, `birth_place`, `death_place`, `notes`              | `api/persons/route.ts:138–163`, `api/persons/[id]/route.ts:104–125`            |
| `person_names`      | `name`                                                                        | `api/persons/route.ts:169`, `api/persons/[id]/route.ts:180`                    |
| `event_types`       | `name`, `icon`                                                                | `api/event-types/route.ts:99–101`, `api/event-types/[id]/route.ts:66–68`       |
| `events`            | `title`, `description`, `location`, `notes`                                   | `api/events/route.ts:255–279`, `api/events/[id]/route.ts:244–280`              |
| `sources`           | `title`, `type`, `author`, `date`, `repository`, `call_number`, `notes`       | `api/sources/route.ts:152–160`, `api/sources/[id]/route.ts:114–124`            |
| `relation_types`    | `name`, `inverse_name`, `description`, `icon`                                 | `api/relation-types/route.ts:96–100`, `api/relation-types/[id]/route.ts:61–67` |
| `relations`         | `notes`                                                                       | `api/relations/route.ts:328`, `api/relations/[id]/route.ts:108`                |
| `relation_evidence` | `notes`, `page_reference`, `quote`                                            | `api/relations/[id]/evidence/route.ts:126–128`                                 |
| `property_evidence` | `notes`, `page_reference`, `quote`, `raw_transcription`                       | `api/property-evidence/route.ts:174–177`                                       |
| `access_requests`   | `name`, `institution`, `research_area`, `tool_gap`                            | `api/access-request/route.ts:66,128` (from #149)                               |
| `entity_activity`   | `old_value`, `new_value` — JSON string leaves only, for the field paths below | derived from the rows above (L12)                                              |

`entity_activity` scope: `entity_type = 'PERSON'` with `field_path` in `first_name, last_name,
birth_place, death_place, notes`; `'EVENT'` with `title, description, location, notes`; `'SOURCE'`
with `title, type, author, date, repository, call_number, notes`. Excluded: `SOURCE.url` (never
sanitized), every relation and evidence entry (raw or ids only), non-string snapshots.

**Not written through `sanitize()`, out of scope:** `sources.url`, `*.color`, `person_names.language`,
`projects.name/description` (only the constant `DEFAULT_PROJECT_NAME`, `src/lib/project.ts:10`),
`locations.*` and `literature.*` (no write route), `entity_activity.reason`, audit-log metadata.

## Output sinks of those columns

| Sink                                                                                                    | Escapes today?                         | After this plan                                                                                                                       |
| ------------------------------------------------------------------------------------------------------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| React JSX text and attributes (list, detail, edit forms, admin page)                                    | Yes — and again, hence `&amp;` visible | Unchanged; now shows the text as typed (L1)                                                                                           |
| `dangerouslySetInnerHTML`, `<title>`/metadata                                                           | Not reached (L2, L3)                   | Guard test keeps it that way (T2)                                                                                                     |
| Email HTML: verification, password reset, invite (`name`)                                               | **No** — relies on pre-escaped input   | Escaped at interpolation by construction (T2)                                                                                         |
| Email HTML: operator notification (`name`, `institution`, `researchArea`, `toolGap`, `email`, `locale`) | **No** — same                          | Same (T2)                                                                                                                             |
| Email `text` part and `subject`                                                                         | No (correctly)                         | Unchanged; now verbatim instead of showing `&amp;` (L5); `singleLine` keeps the subject one line                                      |
| JSON API responses (`json()` in `src/lib/api.ts:20`)                                                    | No (correctly)                         | Unchanged; `application/json` with `nosniff` (`next.config.ts:13–14`)                                                                 |
| Search (`contains`, insensitive) on persons, events, sources                                            | n/a                                    | Searching `&` or `<` will match as typed; `amp` stops matching every escaped row                                                      |
| Redis list caches                                                                                       | n/a                                    | Hold old values ≤ 60 s after the backfill; no flush                                                                                   |
| Server logs                                                                                             | n/a                                    | No route logs these values (checked: `console.*` calls in the write routes log ids and errors)                                        |
| #139 export (planned): JSON download                                                                    | n/a                                    | Emits stored values as typed; served as an attachment with `nosniff` (export spec §3 step 5); its filename slug is ASCII-only by spec |

## D1 — strip tags or store verbatim? (owner decision)

The owner chose to stop entity-encoding; whether tags are still stripped is open.

- **(i) Strip, then decode.** Keep `sanitize-html` with no allowed tags and decode its three
  entities afterwards. Smallest behavioural change. Keeps every loss in the table above: text after
  `<letter` truncated (`a<b` → `a`), `<sic>`/`<unclear>` and similar editorial markup deleted from
  `quote` and `raw_transcription`, typed entities silently converted (`&copy;` → `©`), and a value
  of only markup stored as an empty string (an event type can end up with an empty `name`, which
  the access-request route already has to special-case at `route.ts:124–133`). Its only protection
  — tags removed before storage — is not one any sink relies on after T2: React never needed it,
  and the emails will escape anyway. Re-saving a backfilled value through the stripper can still
  eat text that decodes to tag-like characters.
- **(ii) Store verbatim (recommended).** No HTML processing on write; Zod's existing `trim`/`max`
  rules stay. The stored value is what was typed, the export round-trips it, transcriptions keep
  `<` and markup, and security rests entirely on output escaping — which option (a) requires in any
  case. Delete `src/lib/sanitize.ts`, its tests and the `sanitize-html` / `@types/sanitize-html`
  dependencies, so nothing can call it again (a removed module is a compile error at every missed
  site). The access-request "name sanitises to nothing" rule reduces to Zod's `min(1)` after
  `trim`; `certainty.test.ts:30–35`'s premise ("a value that sanitises away") goes with it.
- Rejected: `disallowedTagsMode: "escape"` then decode — verbatim except that typed entities are
  still decoded (measured: `&amp;` → `&`), so strictly worse than (ii). Turning off
  `parser.decodeEntities` still strips and truncates (measured: `a<b` → `a`).

Recommendation: **(ii)**. It is the only option under which "store text as typed" is true, and the
evidence fields are where researchers most often type `<` and markup.

## Backfill design

### Migration or owner-run script?

A SQL data migration in `prisma/migrations/` runs **on merge**: `ci.yml:316–321` runs `prisma migrate
deploy` against production on every push to `main`, before the deploy step (`:338`). That makes the
merge itself the production action. It rewrites rows while the previous release, which still
escapes on write, serves traffic. It cannot take a cutoff measured after T3's deploy **[R1]**. It
has no dry run and no owner gate between counts and writes, and CI would rehearse it only on an empty
database (L15).

An **owner-run guarded script** separates the three things a migration fuses: reviewing the code
(PR), deciding to run it (owner, after counts and the G1b review), and running it (owner, inside the
freeze, after T3 is verified live).

**Recommendation: the script**, `scripts/backfill-150-plain-text.ts`, run with `tsx` like
`scripts/roadmap-status.ts`, together with **[R3]** `scripts/restore-150-plain-text.ts`. Run-once is
enforced by a marker table instead of `_prisma_migrations` (see below). That table and **[R5]** the
backup table are created by a schema-only migration in T4; schema-only migrations on merge are
routine.

### Script behaviour

1. **Identity first.** Connects with an explicitly passed URL (prefer the unpooled one), runs
   `SELECT current_setting('neon.branch_id', true)`, and refuses unless it equals
   `--expect-branch <id>`. A `NULL` (any non-Neon Postgres) is refused unless `--local` is given,
   and `--local` refuses any host other than `localhost`/`127.0.0.1`. Never derive the branch from a
   hostname or env-var name.
2. **[R1] `--cutoff <timestamptz>` is required** in every mode. It is the T3 deploy-step start time
   from C3 (L17); a provisional dry run before the freeze uses the current time. Only rows whose
   cutoff column is before it are touched:
   - `updated_at` for `persons`, `events`, `sources`, `event_types`, `relation_types`, `relations`
     and `access_requests`;
   - `created_at` for the append-only `person_names` (rewritten whole on every person update),
     `relation_evidence`, `property_evidence` and `entity_activity`;
   - `created_at` for `users.name`: only registration writes it. The other `users` updates
     (`auth.ts:101,125`, `reset-password/route.ts:99`, `verify-email/route.ts:88`) never set `name`
     but do move `updated_at`.

   A row edited after the cutover is **excluded**. It is verbatim by construction, because only T3
   code wrote it. Rows the cutoff excludes but that still match the entity pattern are counted
   (`excluded_after_cutoff`) and listed by id for the owner. Inside the freeze that count is expected to be 0.

3. **Dry run is the default.** Without `--apply` it prints the G1 report (below) and the G1b review
   list (ids only) and exits. With `--apply` it also requires `--expect-rows <n>`, the total
   `rows_to_decode` from a dry run with the same cutoff. It refuses if the live count differs: the
   owner applies what they reviewed. **[R5]** `--keep-encoded <file>` names `table.column:id`
   entries the owner decided at G1b to leave as stored.
4. **Run-once.** A one-row-per-run marker table, `data_backfills` (`name` primary key,
   `applied_at`, `report` as JSONB). The script refuses if `150-plain-text` is present. The decode is
   **not idempotent** (stored `&amp;lt;` → `&lt;` → `<` on a second run, measured), so this guard
   is load-bearing.
5. **One transaction**, `SET LOCAL lock_timeout = '5s'`, `SET LOCAL statement_timeout = '60s'`:
   - collision check (G1 query 4) inside the transaction; any row aborts;
   - **[R5]** for each of the 36 columns, first copy every row that will change into
     `backfill_150_originals`, keyed by (`table_name`, `column_name`, `row_id`), with
     `original_text`/`original_json` and `decoded_text`/`decoded_json`. Exception:
     `access_requests`, whose retention promise (#29; #140 keeps them out of backups for the same
     reason) a long-lived copy would break. Then update by joining on that table:
     `decoded_text = replace(replace(replace(c, '&lt;', '<'), '&gt;', '>'), '&amp;', '&')` for rows
     where `c ~ '&(amp|lt|gt);' AND <cutoff column> < cutoff`. `&lt;` and `&gt;` go first and
     `&amp;` last; the first two passes cannot create a new match because neither produces `&`, and
     `replace` is single-pass;
   - for `entity_activity`, the same on JSON string leaves only, scoped as listed above (only where
     `jsonb_typeof(v) = 'string'`; decode `v #>> '{}'`; write back with `to_jsonb`), into `original_json` and
     `decoded_json`;
   - in-transaction verification (below); any mismatch raises and rolls back;
   - insert the marker row with the counts; commit.
6. **Writes no values to stdout or files.** It prints counts, ids and per-column checksums only.
   Terminal output gets pasted into issues.

Verified 2026-10-03 on PGlite (Postgres 16.4) with seeded `sanitize()` output:

- a post-cutoff row holding a typed `&lt;` is left alone, and a post-cutoff activity snapshot too;
- backup-then-update by join gives the decoded values;
- a restore that skips rows changed since the backfill reports exactly the edited row;
- after restoring the rest, and reverting the edited row by hand, the per-column checksum equals the
  pre-backfill one.

### [R3] Restore script

`scripts/restore-150-plain-text.ts` reverses the backfill for chosen rows, so recovery does not mean
replacing production (which would lose every write since G4).

- **Same identity guard** as the backfill; dry run by default.
- **Selection:** `--table`, `--column`, and `--ids <file>` or `--all`. It reads
  `backfill_150_originals`. For `access_requests`, which that table does not hold, `--from-url` (the backup
  branch's URL) reads the original from the G3 branch, with the identity guard applied to
  that connection too, and only while the branch exists (≤ 48 h).
- **Per row:** if the current value equals the recorded decoded value, the row is **restorable**.
  If it equals the original, the row is **already restored**. Anything else is a **conflict**: the
  row was edited since G4. The dry run lists ids by class.
- **`--apply`** restores the restorable rows in one transaction and skips conflicts, reporting
  them. `--force` restores conflicts too and discards the later edit; it is owner-only and named
  per id. Each run records a marker row `150-plain-text-restore-<timestamp>` with its counts.

### Verification (in-transaction and again after commit)

Per column, from the dry-run figures taken in the same transaction (rows before the cutoff):

- `sum(length(c))` after = before − 4·`n_amp` − 3·`n_lt` − 3·`n_gt`;
- `rows_to_decode` after = `rows_changed_by_second_decode` before (rows that legitimately still
  contain an entity sequence, e.g. a typed `&lt;` stored as `&amp;lt;`);
- unchanged `count(c)` and row counts; backup-table row count = rows changed.

After commit, the owner opens one affected record in the UI (expected: `&` shown once).
**[R6] Rechecks at 24 h and after N days** (proposed 14, owner sets) list rows whose current value
differs from `decoded_text`, contains `&(amp|lt|gt);`, and changed after G4. Those are stale-form
saves. The owner fixes each by hand or restores the decoded value. `backfill_150_originals` is
dropped by a later migration only after the second recheck.

### Backup and restore path

- **Per row: `backfill_150_originals`** ([R5]), in the production database. It is the primary
  restore source, used by the restore script, and is kept until the N-day recheck. It is a Prisma
  model without `project_id`, so #139's project-scoped export does not include it (the export
  plan's DMMF predicate must be checked against it in T4).
- **Whole database: a Neon branch from production** made just before G4 (G3), named
  `pre-150-backfill-<date>`. It is copy-on-write and instant, and does not depend on the PITR window,
  which is **6 h** (measured in #140: `history_retention_seconds = 21600`). It holds
  `access_requests`, so it is **deleted within 48 h** to keep #29's retention promise.
- The free plan caps the project at **10 branches** (`ci.yml:146`); the backup and rehearsal
  branches count against it while CI runs. Delete the rehearsal branch after G2.

### Owner's read-only count query (G1)

The owner runs this against production. It is read-only by construction. Check step 1 before
reading anything else. Replace the cutoff literal with C3's value; a provisional run before the
freeze uses `now()`. The `access_requests` lines apply only once #149's migration is deployed; drop
them if the table is absent. **[R4]** Query 3 is corrected: the first revision counted every
snapshot in a group that held one encoded snapshot. On PGlite, a group with one encoded and four
ordinary snapshots returned 5 with the old query and 1 with this one.

```sql
BEGIN TRANSACTION READ ONLY;

-- 1. Identity. Stop unless this equals the production branch id in the Neon console.
SELECT current_setting('neon.branch_id', true) AS branch_id;

-- 2. Per column, with the [R5] G1b review ids and the [R1] excluded ids.
--    Cutoff column per table as in "Script behaviour" step 2.
WITH c(t) AS (SELECT TIMESTAMPTZ '2026-10-10T12:00:00Z'),  -- replace with C3's cutoff
v(col, id, val, ts) AS (
            SELECT 'users.name', id, name, created_at FROM users
  UNION ALL SELECT 'persons.first_name', id, first_name, updated_at FROM persons
  UNION ALL SELECT 'persons.last_name', id, last_name, updated_at FROM persons
  UNION ALL SELECT 'persons.birth_place', id, birth_place, updated_at FROM persons
  UNION ALL SELECT 'persons.death_place', id, death_place, updated_at FROM persons
  UNION ALL SELECT 'persons.notes', id, notes, updated_at FROM persons
  UNION ALL SELECT 'person_names.name', id, name, created_at FROM person_names
  UNION ALL SELECT 'event_types.name', id, name, updated_at FROM event_types
  UNION ALL SELECT 'event_types.icon', id, icon, updated_at FROM event_types
  UNION ALL SELECT 'events.title', id, title, updated_at FROM events
  UNION ALL SELECT 'events.description', id, description, updated_at FROM events
  UNION ALL SELECT 'events.location', id, location, updated_at FROM events
  UNION ALL SELECT 'events.notes', id, notes, updated_at FROM events
  UNION ALL SELECT 'sources.title', id, title, updated_at FROM sources
  UNION ALL SELECT 'sources.type', id, type, updated_at FROM sources
  UNION ALL SELECT 'sources.author', id, author, updated_at FROM sources
  UNION ALL SELECT 'sources.date', id, date, updated_at FROM sources
  UNION ALL SELECT 'sources.repository', id, repository, updated_at FROM sources
  UNION ALL SELECT 'sources.call_number', id, call_number, updated_at FROM sources
  UNION ALL SELECT 'sources.notes', id, notes, updated_at FROM sources
  UNION ALL SELECT 'relation_types.name', id, name, updated_at FROM relation_types
  UNION ALL SELECT 'relation_types.inverse_name', id, inverse_name, updated_at FROM relation_types
  UNION ALL SELECT 'relation_types.description', id, description, updated_at FROM relation_types
  UNION ALL SELECT 'relation_types.icon', id, icon, updated_at FROM relation_types
  UNION ALL SELECT 'relations.notes', id, notes, updated_at FROM relations
  UNION ALL SELECT 'relation_evidence.notes', id, notes, created_at FROM relation_evidence
  UNION ALL SELECT 'relation_evidence.page_reference', id, page_reference, created_at FROM relation_evidence
  UNION ALL SELECT 'relation_evidence.quote', id, quote, created_at FROM relation_evidence
  UNION ALL SELECT 'property_evidence.notes', id, notes, created_at FROM property_evidence
  UNION ALL SELECT 'property_evidence.page_reference', id, page_reference, created_at FROM property_evidence
  UNION ALL SELECT 'property_evidence.quote', id, quote, created_at FROM property_evidence
  UNION ALL SELECT 'property_evidence.raw_transcription', id, raw_transcription, created_at FROM property_evidence
  UNION ALL SELECT 'access_requests.name', id, name, updated_at FROM access_requests
  UNION ALL SELECT 'access_requests.institution', id, institution, updated_at FROM access_requests
  UNION ALL SELECT 'access_requests.research_area', id, research_area, updated_at FROM access_requests
  UNION ALL SELECT 'access_requests.tool_gap', id, tool_gap, updated_at FROM access_requests
),
d AS (SELECT v.*, c.t,
         replace(replace(replace(val, '&lt;', '<'), '&gt;', '>'), '&amp;', '&') AS decoded
      FROM v CROSS JOIN c)

SELECT col,
  count(val) AS non_null,
  count(*) FILTER (WHERE val ~ '&(amp|lt|gt);' AND ts <  t) AS rows_to_decode,
  count(*) FILTER (WHERE val ~ '&(amp|lt|gt);' AND ts >= t) AS excluded_after_cutoff,
  count(*) FILTER (WHERE val ~ '&amp;(amp|lt|gt);' AND ts < t) AS rows_changed_by_second_decode,
  count(*) FILTER (WHERE (val ~ '[<>]' OR val ~ '&(?!(amp|lt|gt);)') AND ts < t) AS rows_not_sanitize_shaped,
  coalesce(sum(length(val)) FILTER (WHERE ts < t), 0) AS total_length,
  coalesce(sum((length(val) - length(replace(val, '&amp;', ''))) / 5) FILTER (WHERE ts < t), 0) AS n_amp,
  coalesce(sum((length(val) - length(replace(val, '&lt;', ''))) / 4) FILTER (WHERE ts < t), 0) AS n_lt,
  coalesce(sum((length(val) - length(replace(val, '&gt;', ''))) / 4) FILTER (WHERE ts < t), 0) AS n_gt,
  -- [R5] G1b: rows that probably held typed entity text (ids only)
  string_agg(id, ',' ORDER BY id) FILTER (WHERE ts < t AND val ~ '&(amp|lt|gt);'
    AND (decoded ~ '&[A-Za-z#0-9]+;' OR val ~ '&lt;[A-Za-z!/?]')) AS review_ids,
  -- [R1] rows left alone because they were written after the cutoff (ids only)
  string_agg(id, ',' ORDER BY id) FILTER (WHERE ts >= t AND val ~ '&(amp|lt|gt);') AS excluded_ids
FROM d GROUP BY col ORDER BY col;

-- 3. [R4] Activity snapshots that need decoding, filtered before grouping.
SELECT entity_type, field_path,
  count(*) FILTER (WHERE created_at <  c.t) AS rows_to_decode,
  count(*) FILTER (WHERE created_at >= c.t) AS excluded_after_cutoff
FROM entity_activity CROSS JOIN (SELECT TIMESTAMPTZ '2026-10-10T12:00:00Z' AS t) c
WHERE ((entity_type = 'PERSON' AND field_path IN ('first_name','last_name','birth_place','death_place','notes'))
    OR (entity_type = 'EVENT'  AND field_path IN ('title','description','location','notes'))
    OR (entity_type = 'SOURCE' AND field_path IN ('title','type','author','date','repository','call_number','notes')))
  AND ((jsonb_typeof(old_value) = 'string' AND old_value #>> '{}' ~ '&(amp|lt|gt);')
    OR (jsonb_typeof(new_value) = 'string' AND new_value #>> '{}' ~ '&(amp|lt|gt);'))
GROUP BY entity_type, field_path ORDER BY entity_type, field_path;

-- 4. Unique-key collisions after the backfill (expected: no rows).
SELECT project_id, count(*) AS colliding
FROM (SELECT project_id,
             CASE WHEN name ~ '&(amp|lt|gt);' AND updated_at < c.t
                  THEN replace(replace(replace(name, '&lt;', '<'), '&gt;', '>'), '&amp;', '&')
                  ELSE name END AS after_backfill
      FROM event_types CROSS JOIN (SELECT TIMESTAMPTZ '2026-10-10T12:00:00Z' AS t) c) d
GROUP BY project_id, after_backfill HAVING count(*) > 1;

ROLLBACK;
```

Expected inside the freeze: `excluded_after_cutoff` = 0 and `rows_not_sanitize_shaped` = 0 everywhere (L7,
L18). The query returns counts and ids, never values. The full block was run as written on PGlite
(Postgres 16.4) against a schema with these tables and seeded `sanitize()` output.

## Cutover

**[R1][R2][R6]** The phases, and what each one risks:

| Phase                             | Old rows | New writes                      | Emails                                  | Risk                                                                                             |
| --------------------------------- | -------- | ------------------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Today                             | escaped  | escaped                         | inert because input is pre-escaped      | over-escaped display only                                                                        |
| T2 live (own deploy), T3 not      | escaped  | escaped                         | escaped again → recipients see `&amp;`  | cosmetic, emails only. **This deploy is T3's rollback baseline.**                                |
| Freeze: T3 live, G4 not yet run   | escaped  | none expected; any are verbatim | correct for new values, `&amp;` for old | none from the decoder: post-cutoff rows are excluded                                             |
| After G4                          | as typed | as typed                        | correct                                 | stale forms (residual, below)                                                                    |
| Instant rollback T3 → T2 after G4 | as typed | escaped again                   | escaped, so safe                        | mixed rows; re-deploying T3 needs a follow-up decode limited to rows written during the rollback |
| **Rollback past T2 after G4**     | as typed | escaped                         | **raw values in unescaped HTML**        | **forbidden.** It is the one sequence that turns this into an injection path                     |

**Runbook (owner):**

- **C0 — Preconditions.**
  - T2's PR is merged, and its production deploy passed CI's live check; `/api/health` reports T2's
    merge SHA or later.
  - The T3+T4 PR is approved.
  - G2 passed on a production copy made within the last 24 h.
  - The owner has reviewed a provisional G1/G1b run (cutoff = `now()`).
- **C1 — Announce the freeze.** Everyone saves and **closes every open edit form**, then stops
  editing until C7. Pre-alpha has one real user, so this is a message (L18).
- **C2 — Merge the T3+T4 PR.** CI applies the schema-only migration (`data_backfills`,
  `backfill_150_originals`), deploys, promotes and live-checks.
- **C3 — Record the cutoff:** the `started_at` of that run's "Deploy to Vercel (production, not yet
  live)" step (L17). Confirm `/api/health` reports the T3 merge SHA.
- **C4 — G1 and G1b with the recorded cutoff.** Expected: `excluded_after_cutoff` = 0 and no
  collisions. If the review list changed since C0, re-review it.
- **C5 — G3:** create the backup branch.
- **C6 — G4:** run `--apply` with `--expect-branch`, `--cutoff`, `--expect-rows` and, if needed,
  `--keep-encoded`.
- **C7 — Spot-check the UI**, then lift the freeze.
- **C8 — Rechecks** at 24 h and after N days (see "Verification"). Delete the backup branch within
  48 h.

**Rollback rule (runbook; procedural, not enforced).** After C6, an instant rollback may target only
deployments that contain T2. Because T2 was a separate deploy before T3, the deployment just before
T3 qualifies, and so does every later one: `main` is linear. Choosing anything older brings back
templates that interpolate raw values into HTML. Nothing in Vercel or CI prevents that choice; open
question 7 asks whether to remove the pre-T2 production deployments so that it cannot be made. T4
puts this rule in its PR description and in the #150 closing comment.

**Residual risk — stale forms ([R6]).** An edit form left open across the freeze, despite the
announcement, writes its pre-backfill `&amp;` back verbatim when saved, because the update routes
have no stale-write precondition. That general lost-update gap is **#50**. This plan does not widen
#150 to fix it. The two rechecks find such saves made before day N; a save made later goes
unnoticed until someone sees `&amp;` on screen. The impact is one field displaying `&amp;` again:
visible, fixable by hand, and no security effect.

## Blast radius and test scope

Beyond the files touched:

- **Every text-write route** (11 route files + access request): T3 changes what they store. Their
  route tests mock `sanitize` as identity (`vi.mock("@/lib/sanitize", …)` in 14 test files), so they
  cannot observe the change — **method: unmocked unit tests** of the storage function (or, under
  D1 (ii), a test that the route stores the input byte-for-byte), plus E2E.
- **Every render surface** of the 36 columns: person, event, source, relation, evidence lists,
  detail pages, edit forms, settings pages for event and relation types, admin access-request page.
  **Method: E2E in a real browser** (`pnpm build && pnpm start`, CI's ephemeral Neon branch), not
  component tests with fixture strings.
- **All four email templates.** **Method: unit test with the real template** (not mocked) and a
  hostile value in every user-sourced parameter, asserting the HTML contains the value only in
  escaped form and the `text`/`subject` contain it verbatim. #149's P8 tests
  (`src/lib/email.test.ts`, "P8: sanitized stranger text is inert") currently run hostile input
  through the real `sanitize()` first; they will instead pass the raw payload to the template.
- **Search and sort** on persons, events, sources: results change for `&`, `<`, `>` — E2E search
  for `Müller & Söhne` finds the person.
- **#139 export**: inherits stored values. Its plan gains one assertion (a value with `& < > " '`
  appears in the download exactly as typed); the export lands after G4.
- **Unique key on `event_types`** (L10): **method: G1 query 4 and the in-transaction check.**
- **Backfill and restore**: **method: unit tests against PGlite** (Postgres 16 in WASM, a new dev
  dependency) seeded with real `sanitize()` output. Seed cases: `&amp;lt;`, mixed rows, `NULL`,
  soft-deleted rows, JSON `null` snapshots, relation snapshots that must stay untouched, and
  **[R1]** a post-cutoff row holding a typed `&lt;`. **Then G2, a rehearsal of both directions on a
  Neon branch copied from production [R3]**: real data, real Neon, zero production writes. CI cannot
  rehearse either direction (L15).
- **Cutover timing [R1][R2]**: no automated test can observe the freeze or the rollback rule (L18,
  L19). **Method: the runbook's preconditions, and G1's `excluded_after_cutoff` inside the freeze.**
- Not affected: auth gates, middleware, layouts. Smoke and security E2E run anyway as part of the
  full suite.

Docs sweep (T3): `src/lib/email.ts:140–148` and `:234–235` comments (contract changes); the 2-6b plan's
P8 row is a frozen historical spec — leave it, and reference this plan from the code comment instead.
`docs/strategy/roadmap.md:99,132` describe what Epic 1.4/2.x delivered at the time; leave unless
the owner wants a note. `README.md` does not mention `sanitize` (grep), so it needs no change.

## Tasks

Order **[R2]**:

1. **PR A = T2** → merge → production deploy, verified live.
2. **PR B = T3 + T4 + T5**, reviewed by T6 → G2 → the cutover runbook (C0–C8), which merges PR B
   inside the freeze.

T4 must be in PR B, because the backup and marker tables have to exist at C6.

### T1 — This plan (Opus)

Approved by the owner before T2 starts (G0).

### T2 — Output-escaping audit and email escaping (Sonnet) — PR A, alone [R2]

- **Files:** new `src/lib/html.ts` (or inside `email.ts`): an `escapeHtml` covering `& < > " '`,
  and an `html` tagged-template function that escapes **every** interpolation unless it is wrapped
  in an explicit trusted-fragment marker, so a forgotten escape is impossible rather than unlikely.
  `src/lib/email.ts`: all four templates build their `html` part with it (including `ctaUrl`, since
  an `&` inside an `href` must be `&amp;` anyway); `text` and `subject` stay unescaped.
- **Audit:** re-run the L2/L3 greps and the sink table against the branch; anything unproven blocks.
- **Tests first:** (1) `escapeHtml` on each of the five characters, an existing `&amp;`, empty
  string, astral characters; (2) each template with `name = Müller & Söhne <script>…` and quote
  payloads in every user-sourced parameter: HTML contains no raw `<script`, no unescaped `"`
  originating from the value, and contains `Müller &amp; Söhne`; `text` and `subject` contain
  `Müller & Söhne` verbatim; (3) a guard test: no `dangerouslySetInnerHTML` in `src/` outside the
  two marketing files, and no `generateMetadata` that reads from Prisma.
- **Acceptance:** each test fails before the change (the escaping tests against today's templates
  with raw input); `pnpm test`, `pnpm typecheck`, `pnpm lint`. **[R2]** Merged and deployed on its
  own. CI's live check passes and `/api/health` reports its SHA before PR B merges. That deploy is
  T3's rollback baseline.

### T3 — Write path (Sonnet)

- **Depends:** T2; D1.
- **Under D1 (ii):** remove `sanitize()` from every write site in the table (`?? null` / pass-through
  where it wrapped a nullable), delete `src/lib/sanitize.ts` and its test, drop `sanitize-html` and
  `@types/sanitize-html`, remove the 14 `vi.mock("@/lib/sanitize")` blocks. Keep every Zod rule.
  The access-request markup-only branch (`route.ts:124–133`) and `cleanOptional` reduce to the
  trim/empty checks. The person/event place-certainty normalisation keeps comparing against the
  stored value.
- **Under D1 (i):** `sanitize()` becomes strip-then-decode with the three-entity decoder (`&amp;`
  last), shared with T4's decoder so they cannot diverge.
- **Tests first:** per write route, one unmocked test that `Müller & Söhne`, `1848 < 1850` and
  `<b>x</b>` are stored as D1 prescribes; a guard that `sanitize-html` is not imported anywhere
  (D1 ii).
- **Acceptance:** `pnpm test`, `pnpm typecheck`, `pnpm lint`; the docs sweep above.

### T4 — Backfill and restore scripts (Sonnet prepares; owner runs — G1–G4)

- **Files:**
  - `scripts/backfill-150-plain-text.ts` and **[R3]** `scripts/restore-150-plain-text.ts`;
  - one shared module holding the column list, the cutoff column per table and the decoder;
  - a schema-only migration (and Prisma models) for `data_backfills` and **[R5]**
    `backfill_150_originals`;
  - PGlite tests for both scripts.
- **Behaviour:** "Script behaviour" and "Restore script" above, exactly.
- **Tests first:**
  - decode correctness on fuzzed `sanitize()` output (re-encode equals stored), and order
    (`&amp;lt;` → `&lt;`);
  - `NULL` and soft-deleted rows; activity scope (relation snapshot and JSON `null` untouched);
  - **[R1]** a post-cutoff row with a typed `&lt;` stays untouched and appears in `excluded_ids`, and
    a missing `--cutoff` is refused;
  - **[R5]** every changed row has exactly one backup row with original and decoded values;
    `access_requests` has none; `--keep-encoded` rows stay unchanged; the G1b list flags `&amp;lt;`
    and `&lt;script&gt;` rows;
  - **[R4]** the activity count equals the number of matching snapshots in a mixed group;
  - collision aborts with zero rows changed;
  - the run-once marker refuses a second run;
  - the identity guard refuses a mismatched and a `NULL` branch id;
  - `--apply` refuses a wrong `--expect-rows`; a dry run changes nothing;
  - the length-identity check catches a deliberately wrong decoder;
  - **[R3]** restore: restorable rows return to the original; an edited row is reported as a
    conflict and left alone without `--force`, and restored with it; an already-restored row is
    skipped; checksums after a full restore equal those before the backfill.
- **Acceptance:** tests pass; a local run of both scripts against the dev database (identity-checked);
  the cutover runbook (C0–C8) and the rollback rule are in the PR description.

### T5 — E2E (Sonnet)

- **Depends:** T2, T3.
- **Tests (real browser, production build):** create a person, an event, a source, a relation with
  evidence (quote and raw transcription), an event type and a relation type, each with
  `Müller & Söhne`, `Briefe 1848 < 1850` and a script-tag payload; assert the list and detail pages
  show them exactly as typed, no dialog fires, and opening the edit form and saving unchanged
  leaves the value unchanged (catches re-encode and re-strip on re-save). Search for
  `Müller & Söhne` finds the person. Access-request form with the same payload: the admin page shows
  it as typed.
- **Acceptance:** full E2E suite passes in CI.

### T6 — Whole-branch review and mutation checks (Opus)

- Review the branch against this plan's assumptions, in a real browser, not only the diff.
- Mutations, each must turn a test red: remove `escapeHtml` from one template parameter; escape
  `text` or `subject`; swap the decoder's order (`&amp;` first); drop the run-once check; drop the
  identity check; reintroduce `sanitize()` on one route (D1 ii) or drop its decode step (D1 i);
  remove one column from the backfill list (the list is compared against a single shared constant
  that the write-site test also uses). **[R1]** Drop the cutoff predicate. **[R5]** Skip the backup
  insert for one column. **[R3]** Drop the restore script's conflict check. **[R4]** Restore the
  group-level `count(*)`.
- Confirm the docs sweep and that no status words were added to any doc.

## Owner-only gates — agents must not perform these

- **G0 — Approve this plan**, including **D1** (strip vs verbatim), **[R5]** decode-by-default for
  ambiguous rows, and the open questions below.
- **G1 — Count query on production** (SQL above): provisional before the freeze, final at C4 with
  the recorded cutoff. Its result sets `--expect-rows` and shows whether the collision,
  not-sanitize-shaped or excluded counts need a decision first. Paste counts only into #150.
- **G1b — [R5] Review list.** For each listed id, decide decode (default) or keep encoded
  (`--keep-encoded`). Decide from the UI, not from pasted values.
- **G2 — [R3] Rehearsal of both directions**, on a Neon branch copied from production within 24 h
  of C0. It is a precondition of G4.
  1. Backfill dry run, then `--apply` with cutoff = the branch's creation time.
  2. Verify.
  3. Edit one affected row on the copy to simulate a stale save.
  4. Restore dry run: it must report exactly that row as a conflict.
  5. Restore `--apply --all`.
  6. Per-column checksums must equal the pre-backfill ones, except the edited row.
  7. Delete the branch.
- **G3 — Backup branch** from production at C5; deleted within 48 h.
- **G4 — Apply on production** at C6, inside the freeze, only when `/api/health` reports the T3
  merge SHA and PR A's deploy preceded it. Then the C8 rechecks, and the rollback rule from then on.

## Decisions (G0)

The owner approved the plan on PR #153 ("all approved", 2026-10-03). That approval takes each
recommendation below as decided:

- **D1 / Q1:** store verbatim (ii). T3 deletes `sanitize()` and `sanitize-html`.
- **[R5]:** decode ambiguous rows by default. The G1b review list still runs, and `--keep-encoded`
  stays available.
- **Q2:** decode the activity snapshots.
- **Q3:** keep the `data_backfills` marker table.
- **Q4:** second recheck at N = 14 days. Stale saves are fixed per row, by hand.
- **Q5:** the backfill writes no `entity_activity` rows.
- **Q8:** drop `backfill_150_originals` after the 14-day recheck.

Two questions carried no recommendation, so the approval does not settle them:

- **Q6 (U+0000)** stays open. T3 keeps today's behaviour (no new rule), so it is not on this
  plan's critical path.
- **Q7 (deleting pre-T2 deployments)** is destructive and stays the owner's call at G4.

## Open questions for review

1. **D1** — verbatim (recommended) or strip-then-decode?
2. **Activity snapshots** — decode them (recommended: they recorded a representation this change
   redefines, and the export would otherwise show `&amp;` in history next to `&` in the entity) or
   leave them as historical record?
3. **Marker table vs runbook-only guard** — is a schema migration for `data_backfills` worth it for a
   one-off, or is the `--expect-rows` check plus a runbook line enough? The plan recommends the
   table because a second run silently corrupts typed entity text.
4. **[R6] Stale forms after G4.** N for the second recheck (14 days proposed)? Per-row hand fixes
   (proposed), or a scripted id-scoped pass? The structural fix is #50 (stale-write protection),
   which this plan does not take on.
5. **Should the backfill write `entity_activity` rows?** The plan says no (not an edit by a person);
   the marker's report on #150 is the record.
6. **U+0000** — `sanitize()` passes it through today and Postgres `text` cannot store it (assumed,
   not measured here). Verbatim storage keeps that behaviour; is a Zod rule wanted, here or in a
   separate issue?
7. **[R2] Make the rollback rule enforceable?** After G4, the owner could delete the production
   deployments that predate T2 in Vercel, so an instant rollback cannot select them. That is
   destructive, so it is an owner choice. Without it, the rule stays procedural.
8. **[R5] Backup-table retention.** Drop `backfill_150_originals` after the N-day recheck
   (proposed), or keep it longer as a provenance record? It copies research text and `users.name`.
