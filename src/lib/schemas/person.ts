import { z } from "zod";

/**
 * Single source of truth for person validation (audit X-H-b / X-H-c).
 *
 * The person schema previously existed three times — in the create route, the
 * update route, and PersonForm — and had already drifted: the form carried no
 * `superRefine` at all, so partial-date mistakes skipped client validation and
 * surfaced as a raw 400 from the server.
 *
 * The three shapes genuinely differ (create requires `project_id` and a name;
 * update accepts `null` to clear a field), so they are composed from shared
 * field definitions rather than forced into one schema.
 */

/** Certainty enum — was repeated as a literal 17x across 11 files. */
export const certaintySchema = z.enum(["CERTAIN", "PROBABLE", "POSSIBLE", "UNKNOWN"]);

export const yearSchema = z.number().int().min(1).max(2100);
export const monthSchema = z.number().int().min(1).max(12);
export const daySchema = z.number().int().min(1).max(31);

export const personNameSchema = z.object({
  name: z.string().min(1),
  language: z.string().nullable().optional(),
  is_primary: z.boolean().optional(),
});

interface PartialDateFields {
  birth_year?: number | null | undefined;
  birth_month?: number | null | undefined;
  birth_day?: number | null | undefined;
  death_year?: number | null | undefined;
  death_month?: number | null | undefined;
  death_day?: number | null | undefined;
}

/**
 * Partial-date ordering rules: a month needs a year, a day needs a month.
 *
 * `t` lets the client render translated copy while the API keeps emitting the
 * stable message keys that are part of its contract.
 */
export function addPartialDateIssues(
  data: PartialDateFields,
  ctx: z.RefinementCtx,
  t: (key: string) => string = (key) => key,
): void {
  const pairs = [
    ["birth_month", "birth_year", "month_requires_year"],
    ["birth_day", "birth_month", "day_requires_month"],
    ["death_month", "death_year", "month_requires_year"],
    ["death_day", "death_month", "day_requires_month"],
  ] as const;

  for (const [field, requires, message] of pairs) {
    if (data[field] && !data[requires]) {
      ctx.addIssue({ code: "custom", path: [field], message: t(message) });
    }
  }
}

/** A person must be identifiable by at least one of the name fields. */
export function addNameRequiredIssue(
  data: {
    first_name?: string | null | undefined;
    last_name?: string | null | undefined;
    names?: unknown[] | undefined;
  },
  ctx: z.RefinementCtx,
  t: (key: string) => string = (key) => key,
): void {
  const hasName =
    (data.first_name && data.first_name.trim().length > 0) ||
    (data.last_name && data.last_name.trim().length > 0) ||
    (data.names && data.names.length > 0);
  if (!hasName) {
    ctx.addIssue({ code: "custom", path: ["first_name"], message: t("name_required") });
  }
}

/** POST /api/persons — `project_id` required, fields absent rather than null. */
export const createPersonSchema = z
  .object({
    project_id: z.string().min(1),
    first_name: z.string().optional(),
    last_name: z.string().optional(),
    birth_year: yearSchema.optional(),
    birth_month: monthSchema.optional(),
    birth_day: daySchema.optional(),
    birth_date_certainty: certaintySchema.optional(),
    birth_place: z.string().optional(),
    death_year: yearSchema.optional(),
    death_month: monthSchema.optional(),
    death_day: daySchema.optional(),
    death_date_certainty: certaintySchema.optional(),
    death_place: z.string().optional(),
    notes: z.string().optional(),
    names: z.array(personNameSchema).optional(),
  })
  .superRefine((data, ctx) => {
    addNameRequiredIssue(data, ctx);
    addPartialDateIssues(data, ctx);
  });

/** PUT /api/persons/[id] — all fields optional, `null` clears a value. */
export const updatePersonSchema = z
  .object({
    first_name: z.string().optional(),
    last_name: z.string().optional(),
    birth_year: yearSchema.optional().nullable(),
    birth_month: monthSchema.optional().nullable(),
    birth_day: daySchema.optional().nullable(),
    birth_date_certainty: certaintySchema.optional(),
    birth_place: z.string().optional().nullable(),
    death_year: yearSchema.optional().nullable(),
    death_month: monthSchema.optional().nullable(),
    death_day: daySchema.optional().nullable(),
    death_date_certainty: certaintySchema.optional(),
    death_place: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
    names: z.array(personNameSchema).optional(),
  })
  .superRefine(addPartialDateIssues);

/**
 * PersonForm — mirrors the update shape but requires the certainty selectors
 * (the form always has a value) and validates the same rules as the server, so
 * users no longer discover partial-date mistakes via a raw 400.
 */
export function buildPersonFormSchema(t: (key: string) => string = (key) => key) {
  return z
    .object({
      first_name: z.string().optional(),
      last_name: z.string().optional(),
      birth_year: yearSchema.optional().nullable(),
      birth_month: monthSchema.optional().nullable(),
      birth_day: daySchema.optional().nullable(),
      birth_date_certainty: certaintySchema,
      birth_place: z.string().optional(),
      death_year: yearSchema.optional().nullable(),
      death_month: monthSchema.optional().nullable(),
      death_day: daySchema.optional().nullable(),
      death_date_certainty: certaintySchema,
      death_place: z.string().optional(),
      notes: z.string().optional(),
      names: z.array(personNameSchema).optional(),
    })
    .superRefine((data, ctx) => {
      addNameRequiredIssue(data, ctx, t);
      addPartialDateIssues(data, ctx, t);
    });
}

export type CreatePersonInput = z.infer<typeof createPersonSchema>;
export type UpdatePersonInput = z.infer<typeof updatePersonSchema>;
export type PersonFormValues = z.infer<ReturnType<typeof buildPersonFormSchema>>;
