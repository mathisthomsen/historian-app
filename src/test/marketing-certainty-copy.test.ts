import { describe, expect, it } from "vitest";

import deMessages from "../../messages/de.json";
import enMessages from "../../messages/en.json";

/**
 * Regression tripwire for the certainty and evidence claims on the landing page
 * (#97, #101; docs/specs/2-6c-certainty-claim-scope §2).
 *
 * The model stores certainty on specific columns — Person birth/death date and
 * place, Event dates and location, Relation — and not on Source or on names.
 * "per field, not per record" read as a model-wide claim, and "every claim points
 * at its source" implied evidence is mandatory. Neither is true, so neither may
 * come back. This guards the wording, not the truth: the copy is still reviewed
 * against the schema.
 */
const LOCALES = { de: deMessages, en: enMessages } as const;

describe("marketing certainty and evidence copy", () => {
  for (const [locale, messages] of Object.entries(LOCALES)) {
    const panels = messages.marketing.panels;

    it(`${locale}: the certainty body does not claim "per field" as a model-wide scope`, () => {
      expect(panels.certainty.body).not.toMatch(/pro Feld|per field/i);
    });

    it(`${locale}: the certainty body does not claim every date carries a certainty`, () => {
      // A Source's date is free text and carries none (spec C2).
      expect(panels.certainty.body).not.toMatch(/jedes Datum|every date/i);
    });

    it(`${locale}: the evidence headline states a capability, not a guarantee`, () => {
      expect(panels.evidence.title).not.toMatch(/Jede Aussage zeigt|Every claim points/i);
    });
  }

  it("the evidence headline says a claim can, not must, point at its source", () => {
    expect(deMessages.marketing.panels.evidence.title).toMatch(/kann/);
    expect(enMessages.marketing.panels.evidence.title).toMatch(/\bcan\b|\bany claim\b/i);
  });
});
