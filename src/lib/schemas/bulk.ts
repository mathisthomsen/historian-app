import { z } from "zod";

/**
 * The one bulk-delete contract (audit A-H3).
 *
 * The four families had drifted into four contracts: two body casings
 * (`projectId` vs `project_id`), two scoping models (project taken from the
 * body vs inferred from the rows themselves), two response shapes (`{deleted}`
 * vs `{deleted, skipped}`), and two limits (500 vs 100). Sources didn't even
 * require `action`, so a malformed request could delete rather than 400.
 *
 * Taking `project_id` from the body — rather than inferring it from the rows —
 * is also the safer scoping model: membership is checked against the caller's
 * stated project, and the delete is then constrained to it, so a request can
 * never span projects.
 */
export const bulkDeleteSchema = z.object({
  action: z.literal("delete"),
  ids: z.array(z.string().min(1)).min(1).max(500),
  project_id: z.string().min(1),
});

export type BulkDeleteInput = z.infer<typeof bulkDeleteSchema>;

/** Why a requested id was not deleted. */
export interface BulkSkipped {
  id: string;
  reason: string;
}

/**
 * Uniform bulk response. `skipped` is always present — an empty array rather
 * than an omitted field — so clients never branch on its existence.
 */
export interface BulkDeleteResult {
  deleted: number;
  skipped: BulkSkipped[];
}
