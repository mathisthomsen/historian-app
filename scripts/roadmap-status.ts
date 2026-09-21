/**
 * Derives per-epic roadmap status from GitHub milestones.
 *
 * `docs/strategy/roadmap.md` is deliberately status-free (see
 * `docs/decisions/0002-documentation-architecture.md`): status is
 * hand-written in exactly one place, GitHub milestones, and every other
 * surface — this script included — derives it rather than duplicating it.
 *
 * One milestone exists per epic, titled exactly `Epic N.N — <epic name>`
 * (matching the roadmap's own `### Epic N.N — <epic name>` headings). This
 * script never hardcodes the epic list: it walks whatever milestones GitHub
 * currently has and reports on those. An epic added to the roadmap has no
 * status here until its milestone is created — that is a gap to close in
 * GitHub, not something this script should paper over by inventing state.
 *
 * Run with: `pnpm roadmap:status`
 */
import { execFileSync } from "node:child_process";

export const REPO = "mathisthomsen/historian-app";

export type EpicState = "shipped" | "in_progress" | "planned";

export interface EpicStatus {
  epic: string;
  title: string;
  state: EpicState;
  openIssues: number;
  closedIssues: number;
}

/** The subset of GitHub's milestone API response this script depends on. */
export interface GhMilestone {
  title: string;
  state: string;
  open_issues: number;
  closed_issues: number;
}

// Matches "Epic 2.7 — Session & Authorization Hardening". Accepts a plain
// hyphen too, in case a milestone is ever typed without the em dash.
const EPIC_TITLE_PATTERN = /^Epic\s+(\d+\.\d+)\s+[—-]\s+(.+)$/u;

/**
 * Parses "Epic N.N — Name" out of a milestone title. Returns null for any
 * milestone that isn't an epic milestone (title doesn't match) — the repo
 * may one day have other, non-epic milestones, and those are silently
 * excluded from roadmap status rather than misreported.
 */
export function parseEpicTitle(title: string): { epic: string; name: string } | null {
  const match = EPIC_TITLE_PATTERN.exec(title.trim());
  if (!match) return null;
  const epic = match[1];
  const name = match[2]?.trim();
  if (!epic || !name) return null;
  return { epic, name };
}

/**
 * The four derivation rules, applied to a single epic's milestone data.
 * `undefined` (no milestone for this epic at all) is a first-class input,
 * not an error case — it must resolve to "planned", never throw or default
 * to "shipped".
 */
export function deriveEpicState(
  milestone: Pick<GhMilestone, "state" | "open_issues" | "closed_issues"> | undefined,
): EpicState {
  if (!milestone) return "planned";
  if (milestone.state === "closed") return "shipped";
  if (milestone.open_issues > 0 || milestone.closed_issues > 0) return "in_progress";
  return "planned";
}

function compareEpicNumbers(a: string, b: string): number {
  const [aMajorRaw, aMinorRaw] = a.split(".");
  const [bMajorRaw, bMinorRaw] = b.split(".");
  const aMajor = Number(aMajorRaw ?? 0);
  const bMajor = Number(bMajorRaw ?? 0);
  if (aMajor !== bMajor) return aMajor - bMajor;
  return Number(aMinorRaw ?? 0) - Number(bMinorRaw ?? 0);
}

/**
 * Builds one status entry per epic milestone found in GitHub, newest-first
 * by epic number. Milestones that aren't epic milestones (title doesn't
 * parse) are dropped.
 */
export function deriveEpicStatuses(milestones: GhMilestone[]): EpicStatus[] {
  const statuses: EpicStatus[] = [];
  for (const milestone of milestones) {
    const parsed = parseEpicTitle(milestone.title);
    if (!parsed) continue;
    statuses.push({
      epic: parsed.epic,
      title: parsed.name,
      state: deriveEpicState(milestone),
      openIssues: milestone.open_issues,
      closedIssues: milestone.closed_issues,
    });
  }
  return statuses.sort((a, b) => compareEpicNumbers(a.epic, b.epic));
}

/**
 * Fetches every milestone (open and closed) via the `gh` CLI. Throws — does
 * not return an empty list or swallow the error — when GitHub is
 * unreachable, `gh` isn't authenticated, or the response isn't the JSON
 * array the API contract promises. A status generator that quietly reports
 * "planned" for everything on a network blip is worse than one that fails
 * the build.
 */
export function fetchMilestones(): GhMilestone[] {
  let raw: string;
  try {
    raw = execFileSync("gh", ["api", `repos/${REPO}/milestones?state=all&per_page=100`], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch (error) {
    throw new Error(
      `Could not reach GitHub for milestone data (gh api repos/${REPO}/milestones). ` +
        "Refusing to report roadmap status as if nothing were known — fix connectivity/auth " +
        `and retry. Underlying error: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    throw new Error(
      `GitHub returned unparseable milestone data: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  if (!Array.isArray(parsed)) {
    throw new Error("Expected the GitHub milestones API to return an array of milestones.");
  }

  return parsed as GhMilestone[];
}

function main(): void {
  const milestones = fetchMilestones();
  const statuses = deriveEpicStatuses(milestones);
  console.log(JSON.stringify(statuses, null, 2));
}

const isMain = process.argv[1] !== undefined && import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
  try {
    main();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}
