import { beforeEach, describe, expect, it, vi } from "vitest";

const mockUserProjectFindFirst = vi.fn();
const mockProjectCreate = vi.fn();
const mockUserProjectCreate = vi.fn();
const mockTransaction = vi.fn();
const mockExecuteRaw = vi.fn();
const mockTxFindFirst = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    userProject: {
      findFirst: mockUserProjectFindFirst,
      create: mockUserProjectCreate,
    },
    project: {
      create: mockProjectCreate,
    },
    $transaction: mockTransaction,
  },
}));

const { DEFAULT_PROJECT_NAME, attachProjectId, ensureDefaultProject } =
  await import("@/lib/project");

describe("ensureDefaultProject", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Run the callback against the same mocked client, as Prisma does.
    mockTransaction.mockImplementation(
      async (fn: (tx: unknown) => Promise<unknown>) =>
        await fn({
          $executeRaw: mockExecuteRaw,
          project: { create: mockProjectCreate },
          userProject: { create: mockUserProjectCreate, findFirst: mockTxFindFirst },
        }),
    );
  });

  it("returns the existing project when the user already owns one", async () => {
    mockUserProjectFindFirst.mockResolvedValue({ project_id: "proj-existing" });

    const result = await ensureDefaultProject("user-1");

    expect(result).toBe("proj-existing");
    expect(mockProjectCreate).not.toHaveBeenCalled();
    expect(mockUserProjectCreate).not.toHaveBeenCalled();
  });

  it("only considers OWNER and EDITOR memberships of live projects", async () => {
    mockUserProjectFindFirst.mockResolvedValue({ project_id: "proj-existing" });

    await ensureDefaultProject("user-1");

    expect(mockUserProjectFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          user_id: "user-1",
          role: { in: ["OWNER", "EDITOR"] },
          project: { deleted_at: null },
        },
        orderBy: { created_at: "asc" },
      }),
    );
  });

  // This is the regression: a self-registered user has no membership at all, so
  // the create pages redirected to the dashboard (issue #64).
  it("provisions a project with an OWNER membership when the user has none", async () => {
    mockUserProjectFindFirst.mockResolvedValue(null);
    mockProjectCreate.mockResolvedValue({ id: "proj-new" });

    const result = await ensureDefaultProject("user-1");

    expect(result).toBe("proj-new");
    expect(mockProjectCreate).toHaveBeenCalledWith({
      data: { name: DEFAULT_PROJECT_NAME },
    });
    expect(mockUserProjectCreate).toHaveBeenCalledWith({
      data: { user_id: "user-1", project_id: "proj-new", role: "OWNER" },
    });
  });

  it("creates the project and the membership in a single transaction", async () => {
    mockUserProjectFindFirst.mockResolvedValue(null);
    mockProjectCreate.mockResolvedValue({ id: "proj-new" });

    await ensureDefaultProject("user-1");

    expect(mockTransaction).toHaveBeenCalledTimes(1);
  });

  it("returns null instead of throwing when provisioning fails, so login still succeeds", async () => {
    mockUserProjectFindFirst.mockResolvedValue(null);
    mockTransaction.mockRejectedValue(new Error("db down"));

    await expect(ensureDefaultProject("user-1")).resolves.toBeNull();
  });

  // Two parallel session reads (a page render plus an RSC prefetch) would both
  // see "no membership" and each create a project, leaving the user owning a
  // duplicate they never asked for. The lock serialises them per user.
  it("takes a per-user advisory lock before creating anything", async () => {
    mockUserProjectFindFirst.mockResolvedValue(null);
    mockTxFindFirst.mockResolvedValue(null);
    mockProjectCreate.mockResolvedValue({ id: "proj-new" });

    await ensureDefaultProject("user-1");

    expect(mockExecuteRaw).toHaveBeenCalledTimes(1);
    const sql = mockExecuteRaw.mock.calls[0]?.[0] as { strings?: string[] } | string[];
    const text = Array.isArray(sql) ? sql.join("") : (sql.strings?.join("") ?? String(sql));
    expect(text).toContain("pg_advisory_xact_lock");
  });

  it("re-checks inside the lock and reuses the project the other request created", async () => {
    mockUserProjectFindFirst.mockResolvedValue(null); // lost the race before the lock
    mockTxFindFirst.mockResolvedValue({ project_id: "proj-from-winner" }); // winner got there first

    const result = await ensureDefaultProject("user-1");

    expect(result).toBe("proj-from-winner");
    expect(mockProjectCreate).not.toHaveBeenCalled();
    expect(mockUserProjectCreate).not.toHaveBeenCalled();
  });
});

describe("attachProjectId", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTransaction.mockImplementation(
      async (fn: (tx: unknown) => Promise<unknown>) =>
        await fn({
          $executeRaw: mockExecuteRaw,
          project: { create: mockProjectCreate },
          userProject: { create: mockUserProjectCreate, findFirst: mockTxFindFirst },
        }),
    );
  });

  // The reporter of #64 was already signed in, and the JWT carries projectId
  // only from sign-in, so their 30-day token would never pick the new project up.
  it("fills in a projectId that the token never carried", async () => {
    mockUserProjectFindFirst.mockResolvedValue({ project_id: "proj-1" });
    const session = { user: { id: "user-1" } as { id: string; projectId?: string } };

    await attachProjectId(session);

    expect(session.user.projectId).toBe("proj-1");
  });

  it("leaves an existing projectId untouched and does not hit the database", async () => {
    const session = { user: { id: "user-1", projectId: "proj-kept" } };

    await attachProjectId(session);

    expect(session.user.projectId).toBe("proj-kept");
    expect(mockUserProjectFindFirst).not.toHaveBeenCalled();
  });

  it("does nothing when there is no user id to resolve against", async () => {
    const session = { user: {} as { id?: string; projectId?: string } };

    await attachProjectId(session);

    expect(session.user.projectId).toBeUndefined();
    expect(mockUserProjectFindFirst).not.toHaveBeenCalled();
  });

  it("leaves projectId unset when provisioning fails", async () => {
    mockUserProjectFindFirst.mockResolvedValue(null);
    mockTransaction.mockRejectedValue(new Error("db down"));
    const session = { user: { id: "user-1" } as { id: string; projectId?: string } };

    await attachProjectId(session);

    expect(session.user.projectId).toBeUndefined();
  });

  it("tolerates a session with no user at all", async () => {
    await expect(attachProjectId({})).resolves.toBeUndefined();
    expect(mockUserProjectFindFirst).not.toHaveBeenCalled();
  });
});
