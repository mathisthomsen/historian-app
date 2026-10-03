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

    it(`${locale}: the evidence headline states a capability, not a guarantee`, () => {
      expect(panels.evidence.title).not.toMatch(/Jede Aussage zeigt|Every claim points/i);
      // Evidence attaches to Person, Event and Source fields only, so "any" overclaims too.
      expect(panels.evidence.title).not.toMatch(/Jede Aussage|any claim/i);
    });
  }

  // "für jedes Datum, jeden Ort" / "each date, place" is the owner's chosen wording
  // (PR #155, 2026-10-03), kept although Location and Source dates carry no certainty;
  // spec 2-6c §2 records that. It is deliberately not guarded here.

  it("addresses the reader as Sie in the German panels", () => {
    const { certainty, evidence } = deMessages.marketing.panels;
    for (const text of [certainty.body, evidence.title, evidence.body]) {
      expect(text).not.toMatch(/\b(du|dich|dir|dein\w*|Gib)\b/);
    }
  });
});
