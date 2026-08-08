import { describe, expect, it } from "vitest";

import { bulkDeleteSchema } from "@/lib/schemas/bulk";

const valid = { action: "delete", ids: ["a"], project_id: "proj-1" };

describe("bulkDeleteSchema", () => {
  it("accepts the unified body", () => {
    expect(bulkDeleteSchema.safeParse(valid).success).toBe(true);
  });

  it("requires action — sources previously omitted it, so a malformed request deleted", () => {
    expect(bulkDeleteSchema.safeParse({ ids: ["a"], project_id: "proj-1" }).success).toBe(false);
  });

  it("rejects any action other than delete", () => {
    expect(bulkDeleteSchema.safeParse({ ...valid, action: "restore" }).success).toBe(false);
  });

  it("requires project_id, so a request can never span projects", () => {
    expect(bulkDeleteSchema.safeParse({ action: "delete", ids: ["a"] }).success).toBe(false);
  });

  it("rejects the old camelCase projectId spelling", () => {
    expect(
      bulkDeleteSchema.safeParse({ action: "delete", ids: ["a"], projectId: "proj-1" }).success,
    ).toBe(false);
  });

  it("rejects an empty ids array", () => {
    expect(bulkDeleteSchema.safeParse({ ...valid, ids: [] }).success).toBe(false);
  });

  it("rejects empty-string ids", () => {
    expect(bulkDeleteSchema.safeParse({ ...valid, ids: [""] }).success).toBe(false);
  });

  it("caps ids at 500 for every family — sources used to cap at 100", () => {
    const make = (n: number) => ({ ...valid, ids: Array.from({ length: n }, (_, i) => `id-${i}`) });
    expect(bulkDeleteSchema.safeParse(make(500)).success).toBe(true);
    expect(bulkDeleteSchema.safeParse(make(501)).success).toBe(false);
    // 101 used to be rejected by sources alone; it is now uniformly accepted.
    expect(bulkDeleteSchema.safeParse(make(101)).success).toBe(true);
  });
});
