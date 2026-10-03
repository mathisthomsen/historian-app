import { describe, expect, it } from "vitest";

import type { PersonCertaintyField } from "@/components/marketing/Specimens";

/**
 * The certainty specimen may only name a Person column that carries a
 * certainty (spec 2-6c §4). These assertions are checked by `pnpm typecheck`,
 * not by the test runner: a `@ts-expect-error` that stops erroring is itself a
 * compile error, so the guard cannot be loosened — or the schema changed under
 * it — without this file failing.
 */
describe("PersonCertaintyField", () => {
  it("accepts the four Person certainty columns and rejects any other column", () => {
    const accepted: PersonCertaintyField[] = [
      "birth_date_certainty",
      "birth_place_certainty",
      "death_date_certainty",
      "death_place_certainty",
    ];

    // A column without a certainty.
    // @ts-expect-error first_name carries no certainty
    const name: PersonCertaintyField = "first_name";
    // A certainty that belongs to a different model.
    // @ts-expect-error Event.start_date_certainty is not a Person column
    const eventField: PersonCertaintyField = "start_date_certainty";

    expect(accepted).toHaveLength(4);
    expect([name, eventField]).toHaveLength(2);
  });
});
