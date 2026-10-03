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

      it("renders two dt/dd pairs, each pair inside one wrapper", () => {
        const { container } = renderSpecimen(locale);
        expect(container.querySelectorAll("dt")).toHaveLength(2);
        expect(descriptions(container)).toHaveLength(2);
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

      it("shows the birth date as possible and the birthplace as certain", () => {
        const { container } = renderSpecimen(locale);
        expect(descriptionAt(container, 0)).toHaveTextContent(levelName("POSSIBLE"));
        expect(descriptionAt(container, 1)).toHaveTextContent(levelName("CERTAIN"));
        expect(descriptionAt(container, 1)).toHaveTextContent("Stratford-upon-Avon");
      });

      it("names the levels no field holds in a legend", () => {
        const { container } = renderSpecimen(locale);
        const legend = screen.getByTestId("certainty-specimen-legend");
        for (const level of ["PROBABLE", "UNKNOWN"] as const) {
          expect(legend).toHaveTextContent(levelName(level));
          for (const dd of descriptions(container)) {
            expect(dd).not.toHaveTextContent(levelName(level));
          }
        }
        expect(within(legend).getAllByRole("img")).toHaveLength(2);
      });

      it("explains the example beneath the card", () => {
        renderSpecimen(locale);
        expect(screen.getByTestId("certainty-specimen-caption")).toHaveTextContent(
          messages.marketing.panels.certainty.specimen.caption,
        );
      });

      it("formats its dates through formatPartialDate for the active locale", () => {
        const { container } = renderSpecimen(locale);
        expect(descriptionAt(container, 0)).toHaveTextContent(
          locale === "de" ? "23. April 1564" : "April 23, 1564",
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
