import { render, screen, within } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";

import { RecordCertaintySpecimen } from "@/components/marketing/Specimens";

import deMessages from "../../../messages/de.json";
import enMessages from "../../../messages/en.json";

const LOCALES = [
  { locale: "de", messages: deMessages },
  { locale: "en", messages: enMessages },
] as const;

function renderSpecimen(locale: "de" | "en") {
  const messages = locale === "de" ? deMessages : enMessages;
  const onError = vi.fn();
  const utils = render(
    <NextIntlClientProvider locale={locale} messages={messages} onError={onError}>
      <RecordCertaintySpecimen />
    </NextIntlClientProvider>,
  );
  return { ...utils, onError };
}

/** The `<dd>`s of the specimen's description list, in document order. */
function descriptions(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll("dd"));
}

function descriptionAt(container: HTMLElement, index: number): HTMLElement {
  const dd = descriptions(container)[index];
  if (!dd) throw new Error(`no <dd> at index ${index}`);
  return dd;
}

describe("RecordCertaintySpecimen", () => {
  for (const { locale, messages } of LOCALES) {
    describe(locale, () => {
      const levelName = (level: keyof typeof messages.common.certainty) =>
        messages.common.certainty[level];

      it("renders four dt/dd pairs, each pair inside one wrapper", () => {
        const { container } = renderSpecimen(locale);
        expect(container.querySelectorAll("dt")).toHaveLength(4);
        expect(descriptions(container)).toHaveLength(4);
        for (const dd of descriptions(container)) {
          // The pairing pattern PartialDateSpecimen documents: <div><dt/><dd/></div>.
          expect(dd.parentElement?.tagName).toBe("DIV");
          expect(dd.parentElement?.querySelectorAll("dt")).toHaveLength(1);
        }
      });

      it("gives every field a marker and a visible level name — never colour or shape alone", () => {
        const { container } = renderSpecimen(locale);
        for (const dd of descriptions(container)) {
          const marker = within(dd).getByRole("img");
          const name = within(dd).getByTestId("certainty-level-name");
          expect(Object.values(messages.common.certainty)).toContain(name.textContent);
          // The visible name and the marker's accessible name agree.
          expect(marker.getAttribute("aria-label")).toContain(name.textContent ?? "");
          expect(marker.contains(name)).toBe(false);
        }
      });

      it("shows at least two different certainty levels in one record", () => {
        const { container } = renderSpecimen(locale);
        const levels = new Set(
          descriptions(container).map((dd) =>
            within(dd).getByRole("img").getAttribute("aria-label"),
          ),
        );
        expect(levels.size).toBeGreaterThanOrEqual(2);
      });

      it("shows the birthplace as unknown with no value", () => {
        const { container } = renderSpecimen(locale);
        const birthPlace = descriptionAt(container, 1);
        expect(within(birthPlace).getByRole("img")).toHaveAttribute(
          "aria-label",
          expect.stringContaining(levelName("UNKNOWN")),
        );
        expect(birthPlace).toHaveTextContent(levelName("UNKNOWN"));
        // No place name leaks in: Nuremberg is where he appeared, not where he was born.
        expect(birthPlace).not.toHaveTextContent(/N[uü]rnberg|Nuremberg/);
      });

      it("names the possible level in a legend, though no field holds it", () => {
        const { container } = renderSpecimen(locale);
        const legend = screen.getByTestId("certainty-specimen-legend");
        expect(legend).toHaveTextContent(levelName("POSSIBLE"));
        expect(within(legend).getByRole("img")).toBeInTheDocument();
        for (const dd of descriptions(container)) {
          expect(dd).not.toHaveTextContent(levelName("POSSIBLE"));
        }
      });

      it("formats its dates through formatPartialDate for the active locale", () => {
        const { container } = renderSpecimen(locale);
        const birthDate = descriptionAt(container, 0);
        const deathDate = descriptionAt(container, 2);
        expect(birthDate).toHaveTextContent("1812");
        expect(deathDate).toHaveTextContent(
          locale === "de" ? "17. Dezember 1833" : "December 17, 1833",
        );
      });

      it("resolves every string — no missing-key fallback", () => {
        const { container, onError } = renderSpecimen(locale);
        expect(onError).not.toHaveBeenCalled();
        expect(container.textContent).not.toMatch(/marketing\.panels|common\.certainty/);
      });
    });
  }
});
