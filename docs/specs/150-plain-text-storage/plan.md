# Plain-text storage — Implementation Plan

> **For agentic workers:** this plan carries no code. Each task names its files, the tests written
> first and the check that ends it. The backfill rewrites production rows, so this plan ships in its
> own PR, ahead of any implementation (`CLAUDE.md`, "Reviewing the plan before the implementation").

**Tracks:** #150. **Precedes:** #139's export (owner, 2026-10-03, [#150 comment](https://github.com/mathisthomsen/historian-app/issues/150)).

**Goal:** text a researcher types will be stored exactly as the write path is designed to keep it,
and will be shown exactly as typed. `Müller & Söhne` will be stored and displayed as `Müller & Söhne`,
not `Müller &amp; Söhne`.

**Decision recap (option a, owner):** store text as typed; escape at every output boundary instead of
on write; backfill the rows already stored. The problem itself is described in #150 and not restated
here.

**Architecture:** three changes, in this order of going live —

1. **Output escaping** (T2): every non-React HTML sink — today only the four email templates in
   `src/lib/email.ts` — escapes every interpolated value by construction.
2. **Write path** (T3): `sanitize()` stops entity-encoding. Whether it keeps stripping tags is owner
   decision **D1** below; the recommendation is to store verbatim and remove `sanitize()` entirely.
3. **Backfill** (T4): an owner-run, guarded script decodes `&lt;`, `&gt;`, then `&amp;` in the 36
   columns listed below and in the matching activity snapshots — once, in one transaction, after T2
   and T3 are live in production.

## Global constraints

- **T2 is live no later than T3.** A raw value must never reach an unescaped HTML sink. T2 and T3
  may share a PR; T2's commits come first and its tests must pass on their own.
- **The backfill never runs while code without T2 is live**, and production is never rolled back
  past T2 once the backfill has run (see "Ordering and windows").
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

Consequence for the backfill: information lost at write time (stripped tags, decoded input
entities, truncated text after `<letter`) **cannot be recovered**. The backfill restores the text
as `sanitize-html` understood it, which for ordinary input is what was typed.

## Load-bearing assumptions

M = measured, A = assumed. Security-relevant or production-bound entries marked A name the task
that measures them; none may still be A when its gate is reached.

| #   | Premise                                                                                                                          | State                       | Evidence · method that could observe it false                                                                                                                                                                                                                                                                                                                                                                                          |
| --- | -------------------------------------------------------------------------------------------------------------------------------- | --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| L1  | React escapes every JSX text and attribute sink these columns reach.                                                             | M (library) · A (app) → T5  | `react-dom/server@19.2.4`, `renderToString`: text `Müller & Söhne 1848 < 1850 <script>x</script> " '` → `&amp; … &lt; … &lt;script&gt; … &quot; &#x27;`; attribute `a"b<c>&d` → `a&quot;b&lt;c&gt;&amp;d`. Whether every app surface goes through JSX is the next row. Method: T5 E2E in a real browser renders payloads as literal text and no dialog fires.                                                                          |
| L2  | No `dangerouslySetInnerHTML`, `innerHTML` or HTML-string API renders any of these columns.                                       | M (code)                    | `git grep` over `src/`: two `dangerouslySetInnerHTML`, both static (`(marketing)/layout.tsx:29` inline boot script, `(marketing)/page.tsx:153` JSON-LD from constants). No `innerHTML`/`insertAdjacentHTML`/`DOMParser` in app code; no `t.markup`/`t.rich`; `next-mdx-remote` renders only `src/lib/changelog.ts` content. Method: T2 adds a guard test (below).                                                                      |
| L3  | `generateMetadata`/`<title>` never interpolates a stored value.                                                                  | M (code)                    | Every `generateMetadata` under `src/app` returns translation strings only (list, settings and marketing pages); detail pages have none. Method: T2 guard test greps for it.                                                                                                                                                                                                                                                            |
| L4  | The email templates are the only non-React HTML sinks, and they will escape every interpolation after T2.                        | M (sinks) · A (escape) → T2 | Today they interpolate `name`, `institution`, `researchArea`, `toolGap`, `email`, `locale` into HTML text nodes **relying on pre-escaped input** (`src/lib/email.ts:77,85,108,116,191–192,249,259`; contract comments `:140–148`, `:234–235`). Method: T2 unit test renders every template with a hostile value in every user-sourced parameter; T6 mutation removes the escape and watches it fail.                                   |
| L5  | Plain-text parts and subjects must **not** be HTML-escaped.                                                                      | M (code)                    | `text` (`email.ts:92,123,205–213,266`) and `subject` (`:175`, which carries the requester's name) are plain text; escaping them reintroduces `&amp;` literally. Today the escaped name already shows literally there. Method: T2 unit asserts `Müller & Söhne` verbatim in `text` and `subject`.                                                                                                                                       |
| L6  | `sanitize-html` emits exactly `&amp;`, `&lt;`, `&gt;` and nothing else.                                                          | M                           | See "What `sanitize()` does today". Method: T4's script test asserts the decoder on fuzzed `sanitize()` output (re-encode equals input).                                                                                                                                                                                                                                                                                               |
| L7  | Every stored value in the 36 columns was written through `sanitize()` — so decoding is exact for it.                             | A → G1                      | All application write sites go through it (table below). Exceptions that would break the premise: rows written by hand, by `prisma/seed.ts` (no `&` in it; dev/CI only, never production per `ci.yml:313`), or **after T3 is live** (raw). Method: G1's `rows_not_sanitize_shaped` column counts rows with a raw `<`, `>` or bare `&` — expected 0 before T3, small after.                                                             |
| L8  | No stored value holds a literally typed `&amp;` that the researcher meant as five characters.                                    | A — not measurable          | Before T3 this cannot occur: `sanitize()` decodes a typed `&amp;` to `&` **at write time** (measured above), so stored `&amp;` always means `&`; the loss already happened and the backfill adds none. After T3 and before T4 a typed `&amp;` would be stored raw and then decoded by T4 to `&`. Consequence: that researcher sees `&`. Frequency proxy: G1's count of rows updated after T3's deploy that contain an entity sequence. |
| L9  | Row counts per column in production.                                                                                             | **Unmeasured** → G1         | Production-bound: must be an owner-run, read-only query before the backfill (SQL below).                                                                                                                                                                                                                                                                                                                                               |
| L10 | Decoding cannot violate a unique constraint — except `event_types (project_id, name)`.                                           | M (schema) · A (data) → G1  | Unique text keys: `users.email`, `access_requests.email` (validated, cannot contain `&`/`<`/`>` — `zod@3.25.76` `.email()` rejects `a<b@`, `a&b@`, `a"b@`; accepts `a'b@`) and `event_types @@unique([project_id, name])` (`schema.prisma:272`). After T3, `A & B` can be created next to a stored `A &amp; B`; decoding both collides. Method: G1 collision query; the backfill transaction aborts on it.                             |
| L11 | Raw SQL `UPDATE` leaves `updated_at` alone.                                                                                      | M (code)                    | `@updatedAt` is set by Prisma Client; no trigger or function in `prisma/migrations/`. Intended: the backfill is a representation change, not an edit by a person.                                                                                                                                                                                                                                                                      |
| L12 | `entity_activity.old_value/new_value` are JSONB, and for `PERSON`/`EVENT`/`SOURCE` field updates they hold the sanitized string. | M (code)                    | JSONB (`20260314180300_epic_2_4_entity_activity/migration.sql:24–25`); written from the updated row (`persons/[id]/route.ts:221–233`, `events/[id]/route.ts:311–323`, `sources/[id]/route.ts:143–157`). **Not** for relations: `relations/[id]/route.ts:128–135` logs the raw request body, which was never sanitized, so those snapshots are already as typed and must not be decoded.                                                |
| L13 | No reader decodes these values today.                                                                                            | M (code)                    | `git grep` for `decode`, `unescape`, `he.`, `&amp;` in `src/` outside tests: no decoder. So removing the encoding cannot double-decode anywhere. (Closes #150's "not verified" line.)                                                                                                                                                                                                                                                  |
| L14 | The backfill SQL behaves as written on Postgres.                                                                                 | M (PGlite) · A (Neon) → G2  | Run on PGlite (Postgres 16.4) with seeded `sanitize()` output: lookahead regex `&(?!(amp\|lt\|gt);)` works; decode order correct; length identity below holds (111 → 83 chars = 4×4 + 2×3 + 2×3); `jsonb_typeof`/`#>> '{}'` leaf decode leaves `null` and objects alone; a `READ ONLY` transaction refuses `UPDATE`. Method: G2 rehearsal on a Neon branch copied from production.                                                     |
| L15 | A migration would not be rehearsed on data by CI.                                                                                | M                           | CI's ephemeral branch is created from `ci-base`, an empty root branch (`ci.yml:106–109`); `prisma migrate deploy` there builds schema on zero rows.                                                                                                                                                                                                                                                                                    |
| L16 | There is no CSP backstop for the web app.                                                                                        | M                           | Production CSP allows `script-src 'self' 'unsafe-inline'` (`next.config.ts:52–54`). So output escaping is the only defence; L1/L2 carry the weight.                                                                                                                                                                                                                                                                                    |

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
  still decoded (measured: `&amp;` → `&`), so strictly worse than (ii). `parser.decodeEntities:
false` — still strips and truncates (measured: `a<b` → `a`).

Recommendation: **(ii)**. It is the only option under which "store text as typed" is true, and the
evidence fields are where researchers most often type `<` and markup.

## Backfill design

### Migration or owner-run script?

A SQL data migration in `prisma/migrations/` runs **on merge**: `ci.yml:316–321` runs `prisma migrate
deploy` against production on every push to `main`, before the deploy step (`:338`). That makes the
merge itself the production action, and it rewrites rows while the previous release — the one
without T2 — still serves traffic and sends email. It has no dry run, no owner gate between counts
and writes, and CI would rehearse it only on an empty database (L15).

An **owner-run guarded script** separates the three things a migration fuses: reviewing the code
(PR), deciding to run it (owner, after counts), and running it (owner, after T2+T3 are verified live).

**Recommendation: the script**, `scripts/backfill-150-plain-text.ts`, run with `tsx` like
`scripts/roadmap-status.ts`. Run-once is enforced by a marker table instead of `_prisma_migrations`
(see below), created by a schema-only migration in T4 — schema-only migrations on merge are routine.

### Script behaviour

1. **Identity first.** Connects with an explicitly passed URL (prefer the unpooled one), runs
   `SELECT current_setting('neon.branch_id', true)`, and refuses unless it equals
   `--expect-branch <id>`. A `NULL` (any non-Neon Postgres) is refused unless `--local` is given,
   and `--local` refuses any host other than `localhost`/`127.0.0.1`. Never derive the branch from a
   hostname or env-var name.
2. **Dry run is the default.** Without `--apply` it prints the G1 report (below) and exits. With
   `--apply` it also requires `--expect-rows <n>`, the total `rows_to_decode` from a dry run, and
   refuses if the live count differs — the owner applies what they reviewed, not something else.
3. **Run-once.** A one-row-per-backfill marker table (`data_backfills (name text primary key,
applied_at timestamptz, report jsonb)`). The script refuses if `150-plain-text` is present. The
   decode is **not idempotent** (stored `&amp;lt;` → `&lt;` → `<` on a second run — measured), so
   this guard is load-bearing.
4. **One transaction**, `SET LOCAL lock_timeout = '5s'`, `SET LOCAL statement_timeout = '60s'`:
   - collision check (G1 query 4) inside the transaction; any row aborts;
   - for each of the 36 columns:
     `UPDATE t SET c = replace(replace(replace(c, '&lt;', '<'), '&gt;', '>'), '&amp;', '&') WHERE c ~ '&(amp|lt|gt);'`
     — `&lt;`, `&gt;` first, `&amp;` last; the first two passes cannot create a new match because
     neither produces `&`, and `replace` is single-pass;
   - for `entity_activity`, the same decode on JSON string leaves only, scoped as listed above:
     `old_value = CASE WHEN jsonb_typeof(old_value) = 'string' THEN to_jsonb(<decode>(old_value #>> '{}')) ELSE old_value END`,
     likewise `new_value`;
   - in-transaction verification (below); any mismatch raises and rolls back;
   - insert the marker row with the report; commit.
5. **Writes no values to stdout or files** — counts and ids only (production data, public CI logs
   are not involved but terminals get pasted into issues).
6. Records the affected row ids per table in the marker's `report`, so a targeted reversal is
   possible: re-encoding (`&` → `&amp;` first, then `<`, `>`) is the exact inverse for rows not edited
   since (L6).

### Verification (in-transaction and again after commit)

Per column, from the dry-run figures taken in the same transaction:

- `sum(length(c))` after = before − 4·`n_amp` − 3·`n_lt` − 3·`n_gt`;
- `rows_to_decode` after = `rows_changed_by_second_decode` before (rows that legitimately still
  contain an entity sequence, e.g. a typed `&lt;` stored as `&amp;lt;`);
- unchanged `count(c)` and unchanged row counts.

After commit, the owner opens one affected record in the UI (expected: `&` shown once), and 24 h
later re-runs the dry run: any row with `updated_at` after the backfill that contains `&amp;` came
from a form loaded before the backfill and saved after it (see "Ordering and windows").

### Backup and restore path

- **Before `--apply`: a Neon branch from production** at the current time (G3), named
  `pre-150-backfill-<date>`. Branch creation is copy-on-write and instant. It is the restore source
  for this rewrite and does not depend on the PITR window, which is **6 h** (measured in #140:
  `history_retention_seconds = 21600`). Restoring means copying the affected columns back by id
  from that branch, not replacing production (which would lose every write since).
- The free plan caps the project at **10 branches** (`ci.yml:146`); the backup and rehearsal branches
  count against it while CI runs. Delete the rehearsal branch after G2; keep the backup branch until
  the 24 h re-check passes.

### Owner's read-only count query (G1)

Run against production by the owner. Read-only by construction; step 1 must be checked before
reading anything else. The `access_requests` line applies only once #149's migration is deployed;
drop it if the table is absent.

```sql
BEGIN TRANSACTION READ ONLY;

-- 1. Identity. Stop unless this equals the production branch id in the Neon console.
SELECT current_setting('neon.branch_id', true) AS branch_id;

-- 2. Per column.
WITH v(col, val) AS (
            SELECT 'users.name', name FROM users
  UNION ALL SELECT 'persons.first_name', first_name FROM persons
  UNION ALL SELECT 'persons.last_name', last_name FROM persons
  UNION ALL SELECT 'persons.birth_place', birth_place FROM persons
  UNION ALL SELECT 'persons.death_place', death_place FROM persons
  UNION ALL SELECT 'persons.notes', notes FROM persons
  UNION ALL SELECT 'person_names.name', name FROM person_names
  UNION ALL SELECT 'event_types.name', name FROM event_types
  UNION ALL SELECT 'event_types.icon', icon FROM event_types
  UNION ALL SELECT 'events.title', title FROM events
  UNION ALL SELECT 'events.description', description FROM events
  UNION ALL SELECT 'events.location', location FROM events
  UNION ALL SELECT 'events.notes', notes FROM events
  UNION ALL SELECT 'sources.title', title FROM sources
  UNION ALL SELECT 'sources.type', type FROM sources
  UNION ALL SELECT 'sources.author', author FROM sources
  UNION ALL SELECT 'sources.date', date FROM sources
  UNION ALL SELECT 'sources.repository', repository FROM sources
  UNION ALL SELECT 'sources.call_number', call_number FROM sources
  UNION ALL SELECT 'sources.notes', notes FROM sources
  UNION ALL SELECT 'relation_types.name', name FROM relation_types
  UNION ALL SELECT 'relation_types.inverse_name', inverse_name FROM relation_types
  UNION ALL SELECT 'relation_types.description', description FROM relation_types
  UNION ALL SELECT 'relation_types.icon', icon FROM relation_types
  UNION ALL SELECT 'relations.notes', notes FROM relations
  UNION ALL SELECT 'relation_evidence.notes', notes FROM relation_evidence
  UNION ALL SELECT 'relation_evidence.page_reference', page_reference FROM relation_evidence
  UNION ALL SELECT 'relation_evidence.quote', quote FROM relation_evidence
  UNION ALL SELECT 'property_evidence.notes', notes FROM property_evidence
  UNION ALL SELECT 'property_evidence.page_reference', page_reference FROM property_evidence
  UNION ALL SELECT 'property_evidence.quote', quote FROM property_evidence
  UNION ALL SELECT 'property_evidence.raw_transcription', raw_transcription FROM property_evidence
  UNION ALL SELECT 'access_requests.name', name FROM access_requests
  UNION ALL SELECT 'access_requests.institution', institution FROM access_requests
  UNION ALL SELECT 'access_requests.research_area', research_area FROM access_requests
  UNION ALL SELECT 'access_requests.tool_gap', tool_gap FROM access_requests
)
SELECT col,
  count(val)                                                         AS non_null,
  count(*) FILTER (WHERE val ~ '&(amp|lt|gt);')                      AS rows_to_decode,
  count(*) FILTER (WHERE val ~ '&amp;(amp|lt|gt);')                  AS rows_changed_by_second_decode,
  count(*) FILTER (WHERE val ~ '[<>]' OR val ~ '&(?!(amp|lt|gt);)')  AS rows_not_sanitize_shaped,
  coalesce(sum(length(val)), 0)                                      AS total_length,
  coalesce(sum((length(val) - length(replace(val, '&amp;', ''))) / 5), 0) AS n_amp,
  coalesce(sum((length(val) - length(replace(val, '&lt;', ''))) / 4), 0)  AS n_lt,
  coalesce(sum((length(val) - length(replace(val, '&gt;', ''))) / 4), 0)  AS n_gt
FROM v GROUP BY col ORDER BY col;

-- 3. Activity snapshots in scope.
SELECT entity_type, field_path, count(*) AS rows_to_decode
FROM entity_activity
WHERE (entity_type = 'PERSON' AND field_path IN ('first_name','last_name','birth_place','death_place','notes'))
   OR (entity_type = 'EVENT'  AND field_path IN ('title','description','location','notes'))
   OR (entity_type = 'SOURCE' AND field_path IN ('title','type','author','date','repository','call_number','notes'))
GROUP BY entity_type, field_path
HAVING count(*) FILTER (WHERE
     (jsonb_typeof(old_value) = 'string' AND old_value #>> '{}' ~ '&(amp|lt|gt);')
  OR (jsonb_typeof(new_value) = 'string' AND new_value #>> '{}' ~ '&(amp|lt|gt);')) > 0;

-- 4. Unique-key collisions the decode would create (expected: no rows).
SELECT project_id, count(*) AS colliding
FROM (SELECT project_id,
             replace(replace(replace(name, '&lt;', '<'), '&gt;', '>'), '&amp;', '&') AS decoded
      FROM event_types) d
GROUP BY project_id, decoded HAVING count(*) > 1;

ROLLBACK;
```

Expected before T3: `rows_not_sanitize_shaped` = 0 everywhere (L7). After T3: rows with a raw `<`,
`>` or bare `&` written since; a row in both `rows_to_decode` and `rows_not_sanitize_shaped` is a
mixed edit (an escaped value re-saved with new raw text) — decoding it is still correct unless the
researcher typed an entity on purpose (L8). The query returns no values, only counts and project ids.

## Ordering and windows

| Phase                         | Old rows | New writes | Emails                                       | Risk                                                                                                         |
| ----------------------------- | -------- | ---------- | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Today                         | escaped  | escaped    | inert because input is pre-escaped           | over-escaped display only                                                                                    |
| T2 live, T3 not               | escaped  | escaped    | escaped again → recipients see `&amp;`       | cosmetic, emails only                                                                                        |
| T2 + T3 live, T4 not run      | escaped  | as typed   | correct for new values, `&amp;` for old ones | mixed display; edit forms prefill `&amp;`, and a save stores it — T4 then repairs it. Keep this phase short. |
| T4 run                        | as typed | as typed   | correct                                      | a form loaded before T4 and saved after re-stores `&amp;` (24 h re-check)                                    |
| **Rollback past T2 after T4** | as typed | escaped    | **raw values in unescaped HTML**             | **forbidden** — the one ordering that turns this into a vulnerability                                        |

So: T2 ships before or with T3; G4 (apply) requires `/api/health`'s `commit` to be the T3 merge or
later; after G4, a production rollback may target only commits that contain T2. T4 writes this rule
into the PR description and the #150 closing comment.

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
- **Backfill**: **method: unit test against PGlite** (Postgres 16 in WASM, a new dev dependency)
  seeded with real `sanitize()` output, including `&amp;lt;`, mixed rows, `NULL`, soft-deleted rows,
  JSON `null` snapshots and relation snapshots that must stay untouched; **then G2, a rehearsal on a
  Neon branch copied from production** — real data, real Neon, zero production writes. CI cannot
  rehearse it (L15).
- Not affected: auth gates, middleware, layouts. Smoke and security E2E run anyway as part of the
  full suite.

Docs sweep (T3): `src/lib/email.ts:140–148` and `:234–235` comments (contract changes); the 2-6b plan's
P8 row is a frozen historical spec — leave it, and reference this plan from the code comment instead.
`docs/strategy/roadmap.md:99,132` describe what Epic 1.4/2.x delivered at the time; leave unless
the owner wants a note. `README.md` does not mention `sanitize` (grep), so it needs no change.

## Tasks

Order: **T2 → T3 → T5 (alongside) → T6 → merge → G4 preconditions → T4's script runs (G1–G4)**.
T4's code may be written in parallel with T3 and ship in the same PR or the next.

### T1 — This plan (Opus)

Approved by the owner before T2 starts (G0).

### T2 — Output-escaping audit and email escaping (Sonnet)

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
  with raw input); `pnpm test`, `pnpm typecheck`, `pnpm lint`.

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

### T4 — Backfill script (Sonnet prepares; owner runs — G1–G4)

- **Files:** `scripts/backfill-150-plain-text.ts`; schema-only migration for `data_backfills`;
  `scripts/backfill-150-plain-text.test.ts` (PGlite).
- **Behaviour:** "Script behaviour" above, exactly.
- **Tests first:** decode correctness on fuzzed `sanitize()` output (re-encode equals stored);
  order (`&amp;lt;` → `&lt;`); `NULL` and soft-deleted rows; activity scope (relation snapshot and
  JSON `null` untouched); collision aborts with zero rows changed; run-once marker refuses a second
  run; identity guard refuses a mismatched and a `NULL` branch id; `--apply` refuses a wrong
  `--expect-rows`; dry run changes nothing; the length-identity check catches a deliberately wrong
  decoder.
- **Acceptance:** tests pass; a local run against the dev database (identity-checked) shows the
  report; the owner has the runbook text in the PR description.

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
  that the write-site test also uses).
- Confirm the docs sweep and that no status words were added to any doc.

## Owner-only gates — agents must not perform these

- **G0 — Approve this plan**, including **D1** (strip vs verbatim) and the open questions below.
- **G1 — Count query on production** (SQL above), after T3 is live. Its result decides `--expect-rows`
  and whether the collision or not-sanitize-shaped counts need a decision first. Paste counts only
  into #150.
- **G2 — Rehearsal:** create a Neon branch from production, run the script with `--apply` against
  it, check the verification output and the UI against it if desired; delete the branch.
- **G3 — Backup branch** from production immediately before G4.
- **G4 — Apply on production**, only when `/api/health` reports a commit containing T2 and T3.
  Then the 24 h re-check, and the no-rollback-past-T2 rule from then on.

## Open questions for review

1. **D1** — verbatim (recommended) or strip-then-decode?
2. **Activity snapshots** — decode them (recommended: they recorded a representation this change
   redefines, and the export would otherwise show `&amp;` in history next to `&` in the entity) or
   leave them as historical record?
3. **Marker table vs runbook-only guard** — is a schema migration for `data_backfills` worth it for a
   one-off, or is the `--expect-rows` check plus a runbook line enough? The plan recommends the
   table because a second run silently corrupts typed entity text.
4. **Stale forms after G4** — if the 24 h re-check finds re-saved `&amp;`, a second, id-scoped pass
   (`150-plain-text-followup`) or leave it to the researcher?
5. **Should the backfill write `entity_activity` rows?** The plan says no (not an edit by a person);
   the marker's report on #150 is the record.
6. **U+0000** — `sanitize()` passes it through today and Postgres `text` cannot store it (assumed,
   not measured here). Verbatim storage keeps that behaviour; is a Zod rule wanted, here or in a
   separate issue?
