import { describe, expect, it } from "vitest";

import {
  buildPersonFormSchema,
  createPersonSchema,
  updatePersonSchema,
} from "@/lib/schemas/person";

const validCreate = { project_id: "proj-1", first_name: "Ada", last_name: "Lovelace" };

function messagesFor(result: { success: boolean; error?: { issues: { message: string }[] } }) {
  return result.error?.issues.map((i) => i.message) ?? [];
}

describe("createPersonSchema", () => {
  it("accepts a minimal valid person", () => {
    expect(createPersonSchema.safeParse(validCreate).success).toBe(true);
  });

  it("requires project_id", () => {
    expect(createPersonSchema.safeParse({ first_name: "Ada", last_name: "Lovelace" }).success).toBe(
      false,
    );
  });

  it("requires at least one name field", () => {
    const result = createPersonSchema.safeParse({ project_id: "proj-1" });
    expect(result.success).toBe(false);
    expect(messagesFor(result)).toContain("name_required");
  });

  it("accepts a person identified only by a name variant", () => {
    const result = createPersonSchema.safeParse({
      project_id: "proj-1",
      names: [{ name: "Ada" }],
    });
    expect(result.success).toBe(true);
  });

  it("rejects a month without a year", () => {
    const result = createPersonSchema.safeParse({ ...validCreate, birth_month: 3 });
    expect(result.success).toBe(false);
    expect(messagesFor(result)).toContain("month_requires_year");
  });

  it("rejects a day without a month", () => {
    const result = createPersonSchema.safeParse({
      ...validCreate,
      birth_year: 1815,
      birth_day: 10,
    });
    expect(result.success).toBe(false);
    expect(messagesFor(result)).toContain("day_requires_month");
  });

  it("applies the same date rules to death fields", () => {
    const result = createPersonSchema.safeParse({ ...validCreate, death_month: 11 });
    expect(messagesFor(result)).toContain("month_requires_year");
  });

  it("rejects out-of-range months and days", () => {
    expect(
      createPersonSchema.safeParse({ ...validCreate, birth_year: 1815, birth_month: 13 }).success,
    ).toBe(false);
    expect(
      createPersonSchema.safeParse({
        ...validCreate,
        birth_year: 1815,
        birth_month: 1,
        birth_day: 32,
      }).success,
    ).toBe(false);
  });
});

describe("updatePersonSchema", () => {
  it("allows an empty patch", () => {
    expect(updatePersonSchema.safeParse({}).success).toBe(true);
  });

  it("does not require a name (unlike create)", () => {
    expect(updatePersonSchema.safeParse({ notes: "a note" }).success).toBe(true);
  });

  it("accepts null to clear a field", () => {
    expect(updatePersonSchema.safeParse({ birth_year: null, notes: null }).success).toBe(true);
  });

  it("still enforces the partial-date rules", () => {
    const result = updatePersonSchema.safeParse({ birth_month: 3 });
    expect(result.success).toBe(false);
    expect(messagesFor(result)).toContain("month_requires_year");
  });
});

describe("buildPersonFormSchema", () => {
  it("routes messages through the supplied translator", () => {
    const schema = buildPersonFormSchema((key) => `translated:${key}`);
    const result = schema.safeParse({
      birth_date_certainty: "UNKNOWN",
      death_date_certainty: "UNKNOWN",
      birth_month: 3,
    });
    expect(result.success).toBe(false);
    expect(messagesFor(result)).toContain("translated:month_requires_year");
    expect(messagesFor(result)).toContain("translated:name_required");
  });

  it("enforces the same rules the server does — the X-H-c drift the form used to have", () => {
    const schema = buildPersonFormSchema();
    const withMonthOnly = {
      first_name: "Ada",
      birth_date_certainty: "UNKNOWN" as const,
      death_date_certainty: "UNKNOWN" as const,
      birth_month: 3,
    };
    expect(schema.safeParse(withMonthOnly).success).toBe(false);
    expect(createPersonSchema.safeParse({ project_id: "p", ...withMonthOnly }).success).toBe(false);
  });

  it("requires the certainty selectors the form always supplies", () => {
    const schema = buildPersonFormSchema();
    expect(schema.safeParse({ first_name: "Ada" }).success).toBe(false);
  });
});
