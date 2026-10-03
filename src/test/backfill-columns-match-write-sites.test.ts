import { describe, expect, it } from "vitest";

import { BACKFILL_COLUMNS, columnKey } from "@/lib/backfill-150/columns";
import { VERBATIM_WRITE_COLUMNS } from "@/test/verbatim-text";

/**
 * The backfill decodes exactly the columns the write routes used to encode
 * (#150 plan, T6). The write-site tests prove each route in
 * `VERBATIM_WRITE_COLUMNS` now stores text as typed; this ties that list to
 * the backfill's, so a column dropped from or added to either side fails here
 * instead of leaving encoded rows behind.
 */
describe("backfill columns and verbatim write sites", () => {
  it("name the same (table, column) pairs", () => {
    const backfill = BACKFILL_COLUMNS.map((c) => columnKey(c.table, c.column)).sort();
    const writeSites = VERBATIM_WRITE_COLUMNS.map((c) => columnKey(c.table, c.column)).sort();
    expect(backfill).toEqual(writeSites);
  });
});
