# Evidoxa — Personas

**This is an extraction, not a new set of personas.** Everything below is lifted from
the persona matrix and persona profiles in
[`docs/design-system/01-ux/research.md`](../design-system/01-ux/research.md) §2.1–2.4.
That document remains the source of record; `skills/platforms/evidoxa.md` cites the
same §2.4 matrix for the project's user-type vocabulary, and this file exists so that
strategy documents can link to the personas without restating — or quietly diverging
from — them.

**If a persona needs to change, change it in `research.md` §2.4 and re-extract here.**
A second, independently edited set of personas is precisely the duplication this
consolidation removed.

The wording is kept in English, matching both the source matrix and the platform
skill, so that the user-type vocabulary stays identical across all three files. (The
rest of `docs/strategy/` is German where its sources are German; see
[`vision.md`](./vision.md).)

---

## The three user types

| Persona                               | Identity in `research.md`                                                                             | In one line                                                                        |
| ------------------------------------- | ----------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| **Faculty Leader**                    | §2.1 — Prof. Dr. Margarethe Engel, Chair of Early Modern History, University of Heidelberg (age 54)   | Reviews the team's work; wants rigor visible at a glance, not a new tool to learn. |
| **Student / Early-Career Researcher** | §2.2 — Lukas Brandt, 2nd-year doctoral candidate, Early Modern History (age 27)                       | Creates most of the data; long sessions, high tolerance for complex workflows.     |
| **Archivist / Collection Manager**    | §2.3 — Dr. Anneliese Mertens, Head of Collections, Landesarchiv Baden-Württemberg, Karlsruhe (age 41) | Catalogues sources and maintains controlled vocabulary; standards before speed.    |

**Default persona when a design decision does not name one:** `student / early-career
researcher` — the primary data-entry persona (`skills/platforms/evidoxa.md`).

---

## Overlap and divergence matrix

Reproduced verbatim from `research.md` §2.4.

| Dimension                | Faculty Leader                                    | Student Researcher                                    | Archivist                                                   |
| ------------------------ | ------------------------------------------------- | ----------------------------------------------------- | ----------------------------------------------------------- |
| Primary concern          | Oversight and rigor                               | Efficiency and depth                                  | Standards and precision                                     |
| Session pattern          | Short, frequent check-ins (15-30 min)             | Long, deep sessions (2-4 hours)                       | Moderate, methodical sessions (1-2 hours)                   |
| Data entry volume        | Low (reviews others' work)                        | High (primary data creator)                           | Moderate (source records, authority maintenance)            |
| Certainty usage          | Evaluative (is the student's assessment correct?) | Generative (assigning certainty during data entry)    | Conservative (prefers documented fact over inference)       |
| Collaboration mode       | Supervisory, asynchronous review                  | Peer-to-peer, mentor feedback                         | Cross-institutional data sharing                            |
| Language needs           | Multilingual sources; German UI preferred         | Multilingual sources; comfort with either DE or EN UI | German UI strongly preferred; metadata in original language |
| Feature priority         | Dashboard, activity feeds, export                 | Entity creation, evidence linking, search             | Source cataloging, vocabulary management, data quality      |
| Tolerance for complexity | Low -- wants clarity at a glance                  | High -- willing to learn complex workflows            | High for familiar paradigms, low for unfamiliar ones        |

---

## What the matrix implies for the product

Two consequences are load-bearing enough to name here; both follow directly from the
rows above.

1. **The same data model serves opposite complexity tolerances.** The student will
   learn a complex workflow; the faculty leader will not. This aligns with the
   positioning in [`vision.md`](./vision.md) §1 — the complexity lives in the
   model, and the UX keeps it away from the user.
2. **German is the primary UI language.** Two of three personas prefer or strongly
   prefer a German interface, which matches `de` being the default locale
   (`src/i18n/routing.ts`).

---

## What this extraction deliberately leaves out

`research.md` §2.1–2.3 carries considerably more per persona than is reproduced here.
The following stayed in the source rather than being copied, because duplicating it
would create two versions to keep in sync:

- Full demographic snapshots (devices, accessibility needs, digital proficiency,
  language repertoire beyond the UI preference).
- Goals, motivations, frustrations and representative quotes per persona.
- Mental models (e.g. the faculty leader's prosopographic, relationship-first model of
  the domain).
- Per-persona core workflows in Evidoxa and pain points with existing tools
  (FileMaker/Access, Excel, Zotero, email attachments).
- The journey maps in §4, which build on these personas.

Read `research.md` §2.1–2.3 whenever a design decision needs any of that. This file
is a pointer with enough content to be useful in a strategy discussion, not a
replacement.
