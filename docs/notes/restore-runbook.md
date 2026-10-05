# Restore runbook

How to get production data back. Two procedures, one per recovery source. Read the whole page
once before running anything: the first minutes are spent choosing, not typing.

This is a navigation aid, not a backlog. Backup design and rationale live in issue #140; the
job that produces the dumps is `.github/workflows/backup-production.yml`.

## What you have

| Source                       | Reaches back                    | Use it when                                |
| ---------------------------- | ------------------------------- | ------------------------------------------ |
| Neon point-in-time recovery  | **6 hours** (21 600 s)          | The damage happened in the last few hours. |
| Daily `pg_dump`, age-encrypt | 14 days, one per day, 02:23 UTC | The damage is older than 6 hours.          |

The 6-hour window is plain and hard: a state older than that cannot be recovered from Neon
history, however recently you noticed. If it is more than 6 hours ago, go to
[Procedure B](#procedure-b-from-a-daily-dump).

Both procedures restore into a **new, throwaway Neon branch**. Neither overwrites production.
What happens next (copy rows back, or switch the app over) is a separate decision, described
under Procedure A step 5, and is the owner's.

**By design, a dump contains no rows of `access_requests` or `invites`.** Their schema is
there; the tables come back empty. Applicants' data is erased within 6 h / 48 h (#29) and the
backups honour that. Procedure A (PITR) does restore whatever those tables held at that moment.

## Before you start (both procedures)

1. **Confirm who you are talking to, with a query, every time.** Before any write, run
   `select current_setting('neon.branch_id');` and compare with the branch you intend. Production
   is `br-old-grass-a9acitgb`. Never decide from a hostname, an endpoint name, a variable name or
   a row count; endpoint names in this project are misleading.
2. **Check branch headroom.** The Neon free plan caps a project at 10 branches (see #24).
   Existing long-lived branches plus any leaked `ci-run-*` ones count.

   ```bash
   export NEON_API="https://console.neon.tech/api/v2"
   export NEON_PROJECT_ID="quiet-fog-92876233"
   export NEON_API_KEY="..."   # from the Neon console; do not paste it into chat or an issue
   curl -sS -H "Authorization: Bearer $NEON_API_KEY" \
     "$NEON_API/projects/$NEON_PROJECT_ID/branches" | jq '.branches | length'
   ```

   If the answer is 10, delete a stale `ci-run-*` branch first (the CI job reaps them after 3 h).

3. **Pick one known record** from production now, while it is healthy: a person's `id` that was
   created well before the damage. You will look it up in the restored copy.
4. Connection strings carry the role password. Keep them in shell variables, not in files, chat
   or issues, and unset them when done.

The Neon calls below for creating a branch with an endpoint, polling its state, fetching a
connection URI and deleting a branch have the same shape as the ones `.github/workflows/ci.yml`
already makes. Everything marked **Unconfirmed** has not been exercised against this project;
treat it as the thing to confirm during the drill, and remove the mark only when a Drill log
row below records it.

## Procedure A: within 6 hours (PITR)

1. **Choose the timestamp**: the last moment you are sure the data was good, in UTC. It must be
   inside the last 6 hours when you create the branch.

   ```bash
   RESTORE_TS="$(date -u -d '-45 minutes' +%Y-%m-%dT%H:%M:%SZ)"   # example: 45 minutes ago
   ```

2. **Create a branch from production at that timestamp, with an endpoint.** **Unconfirmed:**
   `parent_timestamp` (CI creates branches from a parent without it).

   ```bash
   created="$(curl -sS --fail-with-body -X POST \
     -H "Authorization: Bearer $NEON_API_KEY" -H "Content-Type: application/json" \
     -d "$(jq -nc --arg ts "$RESTORE_TS" \
          '{branch:{name:("restore-pitr-"+$ts),parent_id:"br-old-grass-a9acitgb",parent_timestamp:$ts},
            endpoints:[{type:"read_write"}]}')" \
     "$NEON_API/projects/$NEON_PROJECT_ID/branches")"
   BRANCH_ID="$(jq -r '.branch.id' <<<"$created")"
   DB="$(jq -r '.databases[0].name' <<<"$created")"; ROLE="$(jq -r '.roles[0].name' <<<"$created")"
   ```

   Wait until `GET $NEON_API/projects/$NEON_PROJECT_ID/branches/$BRANCH_ID` reports
   `.branch.current_state` of `ready`.

3. **Get a direct connection string for the new branch.**

   ```bash
   RESTORE_URL="$(curl -sS --fail-with-body -G -H "Authorization: Bearer $NEON_API_KEY" \
     --data-urlencode "branch_id=$BRANCH_ID" --data-urlencode "database_name=$DB" \
     --data-urlencode "role_name=$ROLE" --data-urlencode "pooled=false" \
     "$NEON_API/projects/$NEON_PROJECT_ID/connection_uri" | jq -r '.uri')"
   psql "$RESTORE_URL" -tAc "select current_setting('neon.branch_id')"   # must equal $BRANCH_ID
   ```

4. **Verify** with the SQL in [Verifying a restore](#verifying-a-restore). Counts will differ
   from today's production by exactly the rows written after `RESTORE_TS`; that is the point.
5. **Decide what to do with it** (owner's call, each **Unconfirmed**):
   - **Copy rows back.** For a narrow loss (a deleted record, a bad bulk edit): `pg_dump` only the
     affected tables from the restore branch and load them into production, after re-running
     the identity query against production. This writes to production; do it in a transaction
     and check `EntityActivity` and relation endpoints (relations carry no foreign keys) afterwards.
   - **Point the app at the branch.** For wholesale loss: set `DATABASE_URL`,
     `DATABASE_URL_UNPOOLED` in Vercel and `PRODUCTION_DATABASE_URL` in GitHub secrets to the
     new branch, then redeploy. **`backup-production.yml` will then refuse to run** until its
     `EXPECTED_BRANCH_ID` is changed to the new branch id; that guard is working as intended.

## Procedure B: from a daily dump

Needs: the GitHub CLI logged in to this repository, PostgreSQL **17** client tools
(`pg_restore --version` must say 17; an older `pg_restore` refuses a newer archive), `age`, and
the age **private key file** held offline by the owner.

1. **Find and download the backup.** One artifact per run, named `evidoxa-backup-YYYY-MM-DD`,
   kept 14 days; the file inside is `evidoxa-YYYY-MM-DD.dump.age`.

   ```bash
   gh run list --workflow backup-production.yml --status success --limit 14
   gh run download <run-id> -n evidoxa-backup-YYYY-MM-DD -D restore
   ```

2. **Decrypt.** The plaintext is the whole database: work on an encrypted disk and delete it at
   the end.

   ```bash
   age -d -i /path/to/age-private-key.txt -o backup.dump restore/evidoxa-YYYY-MM-DD.dump.age
   pg_restore --list backup.dump > /dev/null && echo readable
   ```

3. **Create an empty branch.** Branching from `ci-base` (`br-morning-band-a9yuaa6k`) gives an
   empty database; `.github/workflows/ci.yml` documents it as an empty root branch with no
   schema, but check it yourself in the next step. Use the create call from Procedure A step 2
   with `parent_id` set to that id and no `parent_timestamp`, name it `restore-dump-YYYY-MM-DD`,
   then fetch `RESTORE_URL` as in step 3 there.

   ```bash
   psql "$RESTORE_URL" -tAc "select current_setting('neon.branch_id'), (select count(*) from pg_tables where schemaname = 'public')"
   # branch id must be the new branch (never br-old-grass-a9acitgb); the count must be 0
   ```

4. **Restore.** **Unconfirmed:** a full restore of this schema into Neon; read every error line
   and do not treat a non-zero exit as noise.

   ```bash
   pg_restore --no-owner --no-privileges --dbname "$RESTORE_URL" backup.dump
   ```

5. **Verify** with the SQL below, comparing against the manifest the backup run printed:

   ```bash
   gh run view <run-id> --log | grep -E '(persons|events|sources|relations) \|'
   ```

   The manifest was taken from production seconds after the dump started, so a small difference
   is possible if someone wrote in between; a large one is not acceptable. `access_requests` and
   `invites` must be empty here.

## Verifying a restore

Run on the restored branch (after the identity query), then run the first two on production
(read-only) or compare with the backup run's manifest.

```sql
select current_setting('neon.branch_id') as branch_id;

select 'persons' as table_name, count(*) as total, count(*) filter (where deleted_at is null) as live from persons
union all select 'events',    count(*), count(*) filter (where deleted_at is null) from events
union all select 'sources',   count(*), count(*) filter (where deleted_at is null) from sources
union all select 'relations', count(*), count(*) filter (where deleted_at is null) from relations;

-- the record you picked before you started
select id, first_name, last_name, created_at, updated_at, deleted_at from persons where id = '<person id>';

-- Procedure B only: both must be 0
select (select count(*) from access_requests) as access_requests, (select count(*) from invites) as invites;
```

"Total" includes soft-deleted rows. The restore is verified when the counts match (Procedure A:
production's, less the rows written after the timestamp; Procedure B: the manifest's) and the
known record is identical, including `updated_at`.

## Afterwards

- Delete every throwaway branch **unless the app now runs on it**:

  ```bash
  curl -sS -o /dev/null -w '%{http_code}\n' -X DELETE -H "Authorization: Bearer $NEON_API_KEY" \
    "$NEON_API/projects/$NEON_PROJECT_ID/branches/$BRANCH_ID"   # 200 expected
  ```

- Delete the plaintext (`shred -u backup.dump`) and the downloaded `.age` file, and run `unset RESTORE_URL NEON_API_KEY`.
- Run the branch-count query from "Before you start" and confirm headroom is back.
- Add a row to the Drill log below, whether this was real or a drill.

## Drill log

A restore that has never been rehearsed is a guess. One row per procedure run (drill or real).
Rows are written by the person who ran it.

| Date | Procedure (A / B) | Duration | Result | Who |
| ---- | ----------------- | -------- | ------ | --- |
|      |                   |          |        |     |
