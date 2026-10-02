# Epic 2.6 follow-up — The certainty claim, scoped to what the model does

## Specification

**Tracks:** #97 (primary) and #101 (folded in — its own text says the wording "should be settled
together with #97") · **Milestone:** Pre-Alpha Gate (gate 3 of 5)
**Deliverable:** Every certainty and evidence claim on the landing page is true of the shipped model,
and the page _shows_ the scope it claims instead of asserting it.
**Verifiable:** Read the certainty and evidence panels and the hero frame against `prisma/schema.prisma`:
no sentence names a scope the schema lacks, and the certainty specimen shows two fields of one record
with different certainties.

---

## 0. Load-bearing assumptions

| #   | Premise                                                                                                                                                                                                                                          | State                        | Evidence / what breaks if false                                                                                                                                                                                                                                  |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| C1  | **Certainty exists on exactly these columns:** Person birth/death date and place (4); Event start/end date and location (3); Relation itself, plus its `valid_from` / `valid_to` dates (3); each `PropertyEvidence` and `RelationEvidence` item. | Measured                     | `prisma/schema.prisma` lines 208, 210, 215, 217, 290, 295, 304, 452, 459, 462, 493, 528 (2026-10-02). The new copy (§2) is written against this list; if it were wider or narrower the copy would be false again. §4 makes the specimen unable to drift from it. |
| C2  | **Source carries no `Certainty`.** It has `reliability` — `SourceReliability` (`HIGH/MEDIUM/LOW/UNKNOWN`), one per record — and `date` is free text.                                                                                             | Measured                     | `schema.prisma:56–61, 338, 342`. This is why "per field" cannot be a model-wide claim, and why the copy must not say "every date" (a Source date has no certainty).                                                                                              |
| C3  | **The app displays per-field certainty where the copy says it does.** Persons list: separate markers on birth and death date in one row.                                                                                                         | Measured                     | `PersonsListClient.tsx:107–125` (`DatedCell` per date column), `EventsListClient.tsx:141,155`. The hero frame (§3.3) depicts this list; if the app did not render it, the picture would be the new overclaim.                                                    |
| C4  | **Evidence can be attached to individual fields of Person, Event and Source.**                                                                                                                                                                   | Measured                     | `src/app/api/property-evidence/route.ts:16–40` (`ALLOWED_PROPERTIES`), and `PropertyEvidenceBadge` mounted per field in `{Person,Event,Source}DetailCard.tsx`. Backs the evidence panel's body copy, which stays.                                                |
| C5  | **Evidence is optional.** A record can be fully filled with zero evidence.                                                                                                                                                                       | Measured (#101)              | `PropertyEvidence` has no required link from any field; `PropertyEvidenceBadge.tsx:89–101` renders "No evidence yet". Makes "Every claim points at its source" false.                                                                                            |
| C6  | **The specimen's historical facts are correct** (§3.2).                                                                                                                                                                                          | **Assumed** — owner verifies | Copy, not code. A wrong date in a page arguing for rigour is the same failure this spec fixes. Not security- or production-bound, so "assumed" is acceptable until the copy pass, which must check it against a cited source.                                    |

## 0b. Blast radius and test scope

Marketing surface only: `messages/{de,en}.json` (`marketing.panels.*`), `Specimens.tsx`,
`HeroAppFrame.tsx`, their tests. No route, auth, data or shared-layout change. Test scope: the
marketing unit tests, `src/test/certainty-vocabulary.test.ts`, `src/test/certainty-visibility.test.tsx`,
and `e2e/marketing.spec.ts` (320 px no-horizontal-scroll is the one most likely to catch a wider
specimen). Method: the type-level guard in §4 is checked by `pnpm typecheck`, and a mutation (§6)
proves it bites.

---

## 1. Decision — narrow the claim, do not widen the model

Three ways to make the sentence true:

- **Widen the model** — add certainty to Source fields and to names. Rejected: a Source's title or
  call number is not a historical assertion with a degree of belief; Source already has the property
  that does make sense for it (`reliability`, a judgement about the document). It would be a schema
  change made to rescue a slogan.
- **Drop the scope** — "four levels" and nothing more. Rejected: the scope is the product's actual
  distinction, and it is true where it matters.
- **Name the scope — chosen.** Say exactly which statements carry certainty, and show one record whose
  fields disagree.

This is a product-copy decision; the owner can veto it before implementation.

---

## 2. Copy

Drafts against `skills/platforms/evidoxa.md` § Brand Voice; the owner edits in place (2.6 D12).

| Key                                      | Now                                                                            | New (de)                                                                                                                   | New (en)                                                                                                              |
| ---------------------------------------- | ------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `marketing.panels.certainty.body`        | Gesichert, wahrscheinlich, möglich, unbekannt — pro Feld, nicht pro Datensatz. | Gesichert, wahrscheinlich, möglich, unbekannt — für jedes Lebens- und Ereignisdatum, jeden Ort und jede Beziehung einzeln. | Certain, probable, possible, unknown — for each date of a life or an event, each place and each relation, separately. |
| `marketing.panels.evidence.title` (#101) | Jede Aussage zeigt auf ihre Quelle.                                            | Jede Aussage kann auf ihre Quelle zeigen.                                                                                  | Any claim can point at its source.                                                                                    |

Unchanged, each re-checked against the schema on 2026-10-02:

- `panels.evidence.body` — "Belege hängen am einzelnen Feld …" — true (C4).
- `panels.relations.body` — "Jede Beziehung trägt ihre eigene Gewissheit" — true (C1, `Relation.certainty`).
- `hero.sub` — "Ungewissheit ein Feld ist" — true literally: certainty is stored as a column, not a note.
- `panels.dates.*` — not about certainty scope; untouched.

**Forbidden copy**, added to the list in 2.6 §6.1: "per field" / "pro Feld" as a model-wide claim;
"every date" / "jedes Datum" (C2); any sentence implying evidence is required (C5).

---

## 3. Demonstration

### 3.1 Principle

The page currently proves that four levels exist (`CertaintyScale`, a legend) and, in the hero,
pictures one marker per row — per-record certainty, one band above the sentence that denies it. Both
specimens change so that the **scope** is what the visitor sees.

### 3.2 Certainty panel — `RecordCertaintySpecimen` (replaces `CertaintyScale`)

One record, four fields, each with its own marker and level name. Kaspar Hauser, because the
evidence panel already cites the 1828 Nuremberg police file on him — the page then follows one
person through two panels instead of introducing a second.

```
┌ Kaspar Hauser ─────────────────────────────────┐
│ Geburtsdatum   1812         ◐ wahrscheinlich    │
│ Geburtsort     Karlsruhe    ◔ möglich           │
│ Sterbedatum    17.12.1833   ● gesichert         │
│ Sterbeort      Ansbach      ● gesichert         │
└──────────────────────────────────────────────────┘
  ○ unbekannt  — fourth level named in a one-line legend below
```

Values and levels are the copy pass's to confirm (C6). The UNKNOWN level is named in a legend line
because forcing a fourth field to UNKNOWN would mean picking a field and inventing ignorance about
it.

Markup: a `<dl>` with one `<div>` per field wrapping its `<dt>`/`<dd>` (the pairing pattern
`PartialDateSpecimen` already documents); each `<dd>` holds the value, `CertaintyMarker`, and the
visible level name — colour and shape are never the only signal. Lives in `Specimens.tsx`, which
`certainty-vocabulary.test.ts` already allows; no new file, so that allow-list does not change.
Fits 320 px: label column wraps above value on narrow widths.

Strings: `marketing.panels.certainty.specimen.{person, birthDate, birthPlace, deathDate, deathPlace,
legendUnknown}`; level names come from `common.certainty.*` as now; date values are formatted with
the existing `formatPartialDate`, not hand-written per locale.

### 3.3 Hero frame — columns, like the real persons list

`HeroAppFrame` rows become three cells — name bar · birth-date bar + marker · death-date bar + marker
— mirroring `PersonsListClient` (C3). At least two rows carry **different** markers in their two
date cells, so per-field scope is visible even at a glance. The frame stays `aria-hidden` and
decorative; the doc comment in `certainty-vocabulary.test.ts` that describes the hero ("every row is
a record whose field genuinely has a certainty") is updated to say "each date cell".

---

## 4. Guard — the specimen cannot name a field that has no certainty

```ts
import type { Certainty, Person } from "@prisma/client";

/** Every Person column whose type is Certainty — derived, never listed by hand. */
type PersonCertaintyField = {
  [K in keyof Person]: Person[K] extends Certainty ? K : never;
}[keyof Person];

const SPECIMEN: { field: PersonCertaintyField; certainty: Certainty; labelKey: string }[] = [
  { field: "birth_date_certainty", certainty: "PROBABLE", labelKey: "birthDate" },
  …
];
```

**Measured 2026-10-02:** a probe file with this type compiled the four certainty columns and
rejected `"first_name"` under `tsc --noEmit` (via a satisfied `@ts-expect-error`). If a field is
removed from the schema, or someone points the specimen at a column without a
certainty, `pnpm typecheck` fails. That is the compile-time guardrail `CLAUDE.md` prefers to a review
checklist. It covers the specimen's _data_; the copy in §2 has no equivalent guard and relies on
review against C1.

---

## 5. Files

```
messages/de.json, messages/en.json            certainty.body, evidence.title, + certainty.specimen.*
src/components/marketing/Specimens.tsx        CertaintyScale → RecordCertaintySpecimen
src/components/marketing/HeroAppFrame.tsx     three-cell rows
src/app/[locale]/(marketing)/page.tsx         :12, :76 — swap CertaintyScale for the new specimen
src/test/certainty-vocabulary.test.ts         comment only (§3.3)
src/test/components/HighlightStage.test.tsx   follow the rename
src/test/components/Specimens.test.tsx        new or extended (§6)
docs/specs/2-6-marketing-landing/specification.md  §6.1 forbidden-copy list gains §2's entries
```

---

## 6. Testing

- `RecordCertaintySpecimen`: renders four `dt`/`dd` pairs; each `dd` contains a marker **and** a
  visible level name; at least two distinct certainty levels among the four; legend names UNKNOWN;
  renders in DE and EN with no missing-key fallback.
- `HeroAppFrame`: some row has two markers with different `certainty` props.
- Copy guard: a unit test asserts `marketing.panels.certainty.body` in both locales contains neither
  "pro Feld" nor "per field", and `panels.evidence.title` contains neither "Jede Aussage zeigt" nor
  "Every claim points" — a regression tripwire, not proof of truth.
- **Mutation check:** point one `SPECIMEN.field` at `"first_name"` → `pnpm typecheck` must fail. Record
  the failing output in the PR.
- E2E: existing `e2e/marketing.spec.ts` unchanged and green — especially "no horizontal scroll at
  320px" and "reveals visible without JavaScript".
- Write / read-back / edit-mode / activity-log tests: not applicable — no persisted data.

---

## 7. Acceptance criteria

1. No string under `marketing.*` claims certainty "per field" model-wide, or for "every date".
2. The evidence panel headline states a capability, not a guarantee, in DE and EN.
3. The certainty panel shows one record whose fields carry at least two different certainty levels,
   each named in text.
4. The hero frame shows per-date-cell markers, with differing markers within one row.
5. Changing the specimen to a field without certainty fails `pnpm typecheck`.
6. The specimen's historical values are confirmed by the owner against a cited source, noted in the PR.
7. Unit, typecheck and E2E pass in CI; #97 and #101 close on merge.

---

## 8. Out of scope

#99 items 2–3 (changelog backfill, "Ansehen" CTA) — same class, separate copy decisions; #99 item 1
is retired by the #29 spec. #98 (Place drawn as a relation endpoint). #100 (certainty palette
borrowed elsewhere). Adding certainty to Source or names (§1). Making evidence mandatory.
