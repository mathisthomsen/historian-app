## Context efficiency

Be conservative with tool output.

- Limit potentially verbose Bash output with `head`, `tail`, `grep`, or command-specific limits.
- Never `cat` large files; use Read with offset/limit.
- Search files before reading them in full.
- Show test failures/errors rather than complete successful test output.
- Prefer targeted `git diff`, file searches, and directory listings.
- Do not load large generated files, logs, lockfiles, or build output unless necessary.

## Keep the README current

`README.md` documents the stack and, more importantly, *why* the data model looks
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