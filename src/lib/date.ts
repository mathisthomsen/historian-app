const MONTH_NAMES_DE: Record<number, string> = {
  1: "Januar",
  2: "Februar",
  3: "März",
  4: "April",
  5: "Mai",
  6: "Juni",
  7: "Juli",
  8: "August",
  9: "September",
  10: "Oktober",
  11: "November",
  12: "Dezember",
};

const MONTH_NAMES_EN: Record<number, string> = {
  1: "January",
  2: "February",
  3: "March",
  4: "April",
  5: "May",
  6: "June",
  7: "July",
  8: "August",
  9: "September",
  10: "October",
  11: "November",
  12: "December",
};

/**
 * Formats a partial historical date (year-only, month+year, or full date).
 * Returns "—" when no date parts are provided.
 *
 * @param year  - The year, or null
 * @param month - The month (1–12), or null
 * @param day   - The day (1–31), or null
 * @param locale - "de" or "en"
 */
export function formatPartialDate(
  year: number | null,
  month: number | null,
  day: number | null,
  locale: string,
): string {
  if (!year) return "—";

  const months = locale === "de" ? MONTH_NAMES_DE : MONTH_NAMES_EN;

  if (!month) return String(year);

  const monthName = months[month] ?? String(month);

  if (!day) {
    return locale === "de" ? `${monthName} ${year}` : `${monthName} ${year}`;
  }

  return locale === "de" ? `${day}. ${monthName} ${year}` : `${monthName} ${day}, ${year}`;
}
