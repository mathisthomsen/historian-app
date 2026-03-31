import { describe, expect, it } from "vitest";

import { formatPartialDate } from "@/lib/date";

describe("formatPartialDate", () => {
  it("returns the year only when month and day are null", () => {
    expect(formatPartialDate(1848, null, null, "de")).toBe("1848");
  });

  it("returns month name and year in German when day is null", () => {
    expect(formatPartialDate(1848, 3, null, "de")).toBe("März 1848");
  });

  it("returns full date in German format (D. Month Year)", () => {
    expect(formatPartialDate(1848, 3, 15, "de")).toBe("15. März 1848");
  });

  it("returns full date in English format (Month D, Year)", () => {
    expect(formatPartialDate(1848, 3, 15, "en")).toBe("March 15, 1848");
  });

  it("returns em dash when all parts are null", () => {
    expect(formatPartialDate(null, null, null, "de")).toBe("—");
  });

  it("returns em dash when year is null even if month and day are set", () => {
    expect(formatPartialDate(null, 3, 15, "de")).toBe("—");
  });

  it("formats December 31 in English correctly", () => {
    expect(formatPartialDate(2000, 12, 31, "en")).toBe("December 31, 2000");
  });
});
