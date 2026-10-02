import { beforeEach, describe, expect, it, vi } from "vitest";

const mockUserFindUnique = vi.fn();
const mockUserFindMany = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    user: { findUnique: mockUserFindUnique, findMany: mockUserFindMany },
  },
}));

const { isOperator, operatorEmails } = await import("@/lib/operators");

describe("isOperator", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("is true for an ADMIN in the database", async () => {
    mockUserFindUnique.mockResolvedValue({ role: "ADMIN" });
    await expect(isOperator("u1")).resolves.toBe(true);
  });

  it("is false for a USER", async () => {
    mockUserFindUnique.mockResolvedValue({ role: "USER" });
    await expect(isOperator("u1")).resolves.toBe(false);
  });

  it("is false when the user does not exist", async () => {
    mockUserFindUnique.mockResolvedValue(null);
    await expect(isOperator("ghost")).resolves.toBe(false);
  });

  it("is false for an empty id without querying", async () => {
    await expect(isOperator("")).resolves.toBe(false);
    expect(mockUserFindUnique).not.toHaveBeenCalled();
  });

  it("reads the role by id from the database", async () => {
    mockUserFindUnique.mockResolvedValue({ role: "ADMIN" });
    await isOperator("u1");
    expect(mockUserFindUnique).toHaveBeenCalledWith({
      where: { id: "u1" },
      select: { role: true },
    });
  });

  it("reads the database on every call and never caches (I7, A2)", async () => {
    mockUserFindUnique.mockResolvedValueOnce({ role: "ADMIN" });
    mockUserFindUnique.mockResolvedValueOnce({ role: "USER" });
    mockUserFindUnique.mockResolvedValueOnce({ role: "ADMIN" });

    await expect(isOperator("u1")).resolves.toBe(true);
    await expect(isOperator("u1")).resolves.toBe(false); // demoted between calls
    await expect(isOperator("u1")).resolves.toBe(true); // promoted again

    expect(mockUserFindUnique).toHaveBeenCalledTimes(3);
  });
});

describe("operatorEmails", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("queries only verified ADMIN users", async () => {
    mockUserFindMany.mockResolvedValue([]);
    await operatorEmails();
    expect(mockUserFindMany).toHaveBeenCalledWith({
      where: { role: "ADMIN", email_verified_at: { not: null } },
      select: { email: true },
    });
  });

  it("returns the addresses as a flat list", async () => {
    mockUserFindMany.mockResolvedValue([{ email: "a@example.org" }, { email: "b@example.org" }]);
    await expect(operatorEmails()).resolves.toEqual(["a@example.org", "b@example.org"]);
  });

  it("returns an empty list when there is no verified admin", async () => {
    mockUserFindMany.mockResolvedValue([]);
    await expect(operatorEmails()).resolves.toEqual([]);
  });

  it("queries at every call (no cache)", async () => {
    mockUserFindMany.mockResolvedValue([]);
    await operatorEmails();
    await operatorEmails();
    expect(mockUserFindMany).toHaveBeenCalledTimes(2);
  });
});
