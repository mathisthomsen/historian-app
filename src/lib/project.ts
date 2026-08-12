import type { ProjectRole } from "@prisma/client";

import { prisma } from "@/lib/db";

/**
 * Name given to the project provisioned on first sign-in. The default locale is
 * `de`, and Epic 3.1 adds renaming, so this is deliberately not translated —
 * `authorize()` has no request locale to translate against.
 */
export const DEFAULT_PROJECT_NAME = "Forschungsprojekt";

/**
 * The membership that decides the active project. Declared once because
 * `ensureDefaultProject` has to ask the same question twice — before taking the
 * lock and again inside it — and the two must not drift apart.
 */
const WRITABLE_ROLES: ProjectRole[] = ["OWNER", "EDITOR"];

const DEFAULT_PROJECT_MEMBERSHIP = (userId: string) => ({
  where: {
    user_id: userId,
    role: { in: WRITABLE_ROLES },
    // A soft-deleted project must not be handed out as the active one.
    project: { deleted_at: null },
  },
  orderBy: { created_at: "asc" as const },
  select: { project_id: true },
});

/**
 * Fill `session.user.projectId` in, in place, when the JWT does not carry it.
 *
 * The claim is written into the token at sign-in only, and the token lives 30
 * days — so a user signed in before default-project provisioning existed would
 * stay unable to create anything for a month (#64). Resolving it per session
 * read costs one indexed query, and only while the claim is still missing.
 *
 * Kept here rather than inline in the `session` callback so it can be tested
 * without standing up next-auth, and mutates rather than returns so the caller
 * can hand next-auth back its own `Session` type unchanged.
 */
export async function attachProjectId(session: unknown): Promise<void> {
  const target = session as { user?: { id?: string; projectId?: string } } | null;
  if (!target?.user || target.user.projectId || !target.user.id) return;

  const projectId = await ensureDefaultProject(target.user.id);
  if (projectId) target.user.projectId = projectId;
}

/**
 * Resolve the user's default project, creating one if they have none.
 *
 * Until the Epic 3.1 project switcher exists, `projectId` is derived from the
 * user's first OWNER/EDITOR project (roadmap: "temporary project scope
 * scaffold"). Nothing ever created that project for a self-registered user, so
 * every account made through `/auth/register` had no project — which made the
 * create pages redirect to the dashboard and every list render empty (#64).
 *
 * Provisioning here rather than in the register route also repairs accounts that
 * were created before this fix: they get their project on next sign-in, with no
 * backfill migration.
 *
 * Returns `null` if provisioning fails. A user without a project sees empty
 * lists, which is bad but recoverable; failing to sign in is worse.
 */
export async function ensureDefaultProject(userId: string): Promise<string | null> {
  const existing = await prisma.userProject.findFirst(DEFAULT_PROJECT_MEMBERSHIP(userId));

  if (existing) return existing.project_id;

  try {
    return await prisma.$transaction(async (tx) => {
      // Two session reads can run in parallel for one user — a page render and
      // an RSC prefetch, say — and both would pass the check above and create a
      // project, leaving the user owning a duplicate they never asked for. The
      // advisory lock is held to the end of the transaction and serialises
      // provisioning per user; a plain unique constraint cannot express this,
      // because the two rows differ in project_id.
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${userId}, 0))`;

      // Whoever waited on the lock must not create a second project.
      const won = await tx.userProject.findFirst(DEFAULT_PROJECT_MEMBERSHIP(userId));
      if (won) return won.project_id;

      const project = await tx.project.create({ data: { name: DEFAULT_PROJECT_NAME } });
      await tx.userProject.create({
        data: { user_id: userId, project_id: project.id, role: "OWNER" },
      });
      return project.id;
    });
  } catch (err) {
    console.error("[project] default project provisioning failed", {
      userId,
      error: err instanceof Error ? err.message : String(err),
    });
    return null;
  }
}
