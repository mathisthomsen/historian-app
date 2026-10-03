import { type Locator, type Page, expect, test as base } from "@playwright/test";

import { resetAuthState, loginAsAdmin } from "./helpers/auth";
import {
  createTestUser,
  deleteTestAccessRequest,
  deleteTestUser,
  getTestAccessRequest,
  setTestUserRole,
} from "./helpers/db";

/**
 * Text is stored, and shown, exactly as typed (#150, plan T5).
 *
 * Until #150 the write path HTML-encoded `&`, `<` and `>` and stripped tags, so
 * a researcher who typed "Müller & Söhne" saw "Müller &amp; Söhne" and
 * "Briefe 1848 < 1850" lost everything after the `<`. T3 stores the typed value
 * verbatim; output escaping (React) is now the only defence against markup.
 *
 * Method: a real browser against a production build and a real database. Every
 * entity is created through the real UI, then asserted on its list page, its
 * detail page and its edit form, and finally re-saved unchanged. The re-save is
 * the check that catches a second encode or strip on the way back in. Route
 * tests mock Prisma and cannot observe any of this (plan "Blast radius").
 *
 * Each value reaches at least one free-text field that a list or detail page
 * renders. `raw_transcription` is the exception: no screen reads or writes it
 * today, so it is covered at the API only (see the property-evidence test).
 *
 * Names carry a per-run suffix because event and relation type names are
 * unique per project and a second run (or the firefox project) shares the
 * database. The suffix is part of the typed value: assertions compare the whole
 * string.
 */

const MULLER = "Müller & Söhne";
const BRIEFE = "Briefe 1848 < 1850";
const XSS = '<script>window.__xss=1</script><img src=x onerror="window.__xss=1">';

const uid = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

const eventTypeName = `${XSS} ${uid}`;
const relationType = {
  name: `${MULLER} ${uid}`,
  inverse: `${BRIEFE} ${uid}`,
  description: XSS,
};
const person = {
  first: BRIEFE,
  last: `${MULLER} ${uid}`,
  birthPlace: XSS,
  deathPlace: MULLER,
  notes: `${BRIEFE}; ${MULLER}`,
};
const event = {
  title: `${BRIEFE} ${uid}`,
  description: XSS,
  location: MULLER,
  notes: `${BRIEFE}; ${MULLER}`,
};
const source = {
  title: `${MULLER} ${uid}`,
  author: MULLER,
  date: "ca. 1848 < 1850",
  repository: XSS,
  callNumber: BRIEFE,
  notes: `${BRIEFE}; ${MULLER}`,
};
const relation = { notes: `${BRIEFE}; ${MULLER}` };

// Shared across the serial tests below.
let personId = "";
let eventId = "";
let sourceId = "";

// Every test fails on a dialog (an executed `alert`, `confirm`, …) and, after
// the last navigation, on `window.__xss` having been set. The payload is inert
// when escaped, so neither may ever happen; this is what proves it.
const test = base.extend<{ xssGuard: undefined }>({
  xssGuard: [
    async ({ page }, use) => {
      const dialogs: string[] = [];
      page.on("dialog", (dialog) => {
        if (dialog.type() === "beforeunload") {
          void dialog.accept();
          return;
        }
        dialogs.push(`${dialog.type()}: ${dialog.message()}`);
        void dialog.dismiss();
      });
      await use(undefined);
      expect(dialogs).toEqual([]);
      expect(await page.evaluate(() => (window as { __xss?: unknown }).__xss)).toBeUndefined();
    },
    { auto: true },
  ],
});

test.describe.configure({ mode: "serial" });

test.beforeEach(resetAuthState);

/**
 * `value` is on the page exactly as typed: whole, and not as its encoded form.
 * `getByText(..., { exact: true })` compares the full text of an element, so
 * `Müller &amp; Söhne` or a value cut off at the `<` both fail it.
 */
async function expectShown(scope: Page | Locator, value: string): Promise<void> {
  await expect(scope.getByText(value, { exact: true }).first()).toBeVisible();
}

/** Nothing the payloads contain was turned into markup, and nothing is encoded. */
async function expectInert(page: Page): Promise<void> {
  await expect(page.locator('img[src="x"]')).toHaveCount(0);
  await expect(page.locator("[onerror]")).toHaveCount(0);
  await expect(page.locator("body")).not.toContainText("&amp;");
  await expect(page.locator("body")).not.toContainText("&lt;");
  await expect(page.locator("body")).not.toContainText("&gt;");
  expect(await page.evaluate(() => (window as { __xss?: unknown }).__xss)).toBeUndefined();
}

async function expectAllShown(page: Page, values: string[]): Promise<void> {
  for (const value of values) {
    await expectShown(page, value);
  }
  await expectInert(page);
}

// ---------------------------------------------------------------------------
// Event type and relation type (settings pages)
// ---------------------------------------------------------------------------
test.describe("Settings: event and relation types", () => {
  test("an event type name is shown as typed and survives an unchanged save", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/de/settings/event-types");

    await page.getByRole("button", { name: "Neuer Ereignistyp" }).click();
    await page.getByPlaceholder("Name").last().fill(eventTypeName);
    const created = page.waitForResponse(
      (res) => res.url().includes("/api/event-types") && res.request().method() === "POST",
    );
    await page.getByRole("button", { name: "Speichern" }).last().click();
    expect((await created).status()).toBe(201);

    const row = page.getByRole("row").filter({ hasText: uid });
    await expect(row.getByRole("cell", { name: eventTypeName, exact: true })).toBeVisible();
    await expectInert(page);

    // Reload, so the value is read back from the database, not from local state.
    await page.reload();
    await expect(
      page.getByRole("row").filter({ hasText: uid }).getByRole("cell", {
        name: eventTypeName,
        exact: true,
      }),
    ).toBeVisible();

    // Edit and save without changing anything.
    await page
      .getByRole("row")
      .filter({ hasText: uid })
      .getByRole("button", { name: "Bearbeiten" })
      .click();
    await expect(page.getByRole("textbox").last()).toHaveValue(eventTypeName);
    const saved = page.waitForResponse(
      (res) => res.url().includes("/api/event-types/") && res.request().method() === "PUT",
    );
    await page.getByRole("button", { name: "Speichern" }).last().click();
    expect((await saved).status()).toBe(200);

    await page.reload();
    await expect(
      page.getByRole("row").filter({ hasText: uid }).getByRole("cell", {
        name: eventTypeName,
        exact: true,
      }),
    ).toBeVisible();
    await expectInert(page);
  });

  test("a relation type's name, inverse name and description are shown as typed", async ({
    page,
  }) => {
    await loginAsAdmin(page);
    await page.goto("/de/settings/relation-types");

    await page.getByRole("button", { name: "Neuer Typ" }).click();
    const dialog = page.getByRole("dialog");
    await dialog.locator("#rt-name").fill(relationType.name);
    await dialog.getByPlaceholder("z. B. ist Kind von").fill(relationType.inverse);
    await dialog.locator("textarea").fill(relationType.description);
    // The relation form only offers a type whose valid-from/to types match.
    await dialog.getByRole("checkbox", { name: "Person" }).first().click();
    await dialog.getByRole("checkbox", { name: "Ereignis" }).nth(1).click();
    const created = page.waitForResponse(
      (res) => res.url().includes("/api/relation-types") && res.request().method() === "POST",
    );
    await dialog.getByRole("button", { name: "Speichern" }).click();
    expect((await created).status()).toBe(201);
    await expect(dialog).toBeHidden();

    const row = page.getByRole("row").filter({ hasText: uid });
    await expect(row.getByRole("cell", { name: relationType.name, exact: true })).toBeVisible();
    await expect(row.getByRole("cell", { name: relationType.inverse, exact: true })).toBeVisible();
    await expectInert(page);

    // The description is not a table column: read it back through the edit form.
    await page.reload();
    await page
      .getByRole("row")
      .filter({ hasText: uid })
      .getByRole("button", { name: "Typ bearbeiten" })
      .click();
    await expect(dialog.locator("#rt-name")).toHaveValue(relationType.name);
    await expect(dialog.getByPlaceholder("z. B. ist Kind von")).toHaveValue(relationType.inverse);
    await expect(dialog.locator("textarea")).toHaveValue(relationType.description);

    const saved = page.waitForResponse(
      (res) => res.url().includes("/api/relation-types/") && res.request().method() === "PUT",
    );
    await dialog.getByRole("button", { name: "Speichern" }).click();
    expect((await saved).status()).toBe(200);
    await expect(dialog).toBeHidden();

    await page.reload();
    const after = page.getByRole("row").filter({ hasText: uid });
    await expect(after.getByRole("cell", { name: relationType.name, exact: true })).toBeVisible();
    await expect(
      after.getByRole("cell", { name: relationType.inverse, exact: true }),
    ).toBeVisible();
    await after.getByRole("button", { name: "Typ bearbeiten" }).click();
    await expect(dialog.locator("textarea")).toHaveValue(relationType.description);
    await expectInert(page);
  });
});

// ---------------------------------------------------------------------------
// Person
// ---------------------------------------------------------------------------
test.describe("Person", () => {
  test("every text field is shown as typed on the list and the detail page", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/de/persons/new");

    await page.locator("#first_name").fill(person.first);
    await page.locator("#last_name").fill(person.last);
    await page.locator("#birth_place").fill(person.birthPlace);
    await page.locator("#death_place").fill(person.deathPlace);
    await page.locator("#notes").fill(person.notes);
    await page.getByRole("button", { name: "Person speichern" }).click();

    await page.waitForURL(/\/de\/persons\/(?!new$)[^/]+$/, { timeout: 15_000 });
    personId = page.url().split("/").pop() ?? "";

    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      `${person.first} ${person.last}`,
    );
    await expectAllShown(page, [person.birthPlace, person.deathPlace, person.notes]);

    // Read back from the database on a fresh load.
    await page.reload();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      `${person.first} ${person.last}`,
    );
    await expectAllShown(page, [person.birthPlace, person.deathPlace, person.notes]);

    // The list page.
    await page.goto(`/de/persons?search=${uid}`);
    const row = page.getByRole("row").filter({ hasText: uid });
    await expect(row.getByText(person.last, { exact: true })).toBeVisible();
    await expect(row.getByText(person.first, { exact: true })).toBeVisible();
    await expectInert(page);
  });

  test("searching for 'Müller & Söhne' finds the person", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/de/persons");

    await page.getByPlaceholder("Nach Name suchen…").fill(MULLER);
    await page.waitForURL(/search=/, { timeout: 10_000 });

    // The search term travelled through the URL and the API as typed: a person
    // whose last name contains `&` is found by the term containing `&`.
    const row = page.getByRole("row").filter({ hasText: uid });
    await expect(row.getByText(person.last, { exact: true })).toBeVisible({ timeout: 10_000 });
    await expectInert(page);
  });

  test("the edit form holds the typed values and an unchanged save keeps them", async ({
    page,
  }) => {
    await loginAsAdmin(page);
    await page.goto(`/de/persons/${personId}/edit`);

    await expect(page.locator("#first_name")).toHaveValue(person.first);
    await expect(page.locator("#last_name")).toHaveValue(person.last);
    await expect(page.locator("#birth_place")).toHaveValue(person.birthPlace);
    await expect(page.locator("#death_place")).toHaveValue(person.deathPlace);
    await expect(page.locator("#notes")).toHaveValue(person.notes);

    const saved = page.waitForResponse(
      (res) => res.url().includes(`/api/persons/${personId}`) && res.request().method() === "PUT",
    );
    await page.getByRole("button", { name: "Person speichern" }).click();
    expect((await saved).status()).toBe(200);
    await page.waitForURL(new RegExp(`/de/persons/${personId}$`), { timeout: 15_000 });

    await page.reload();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      `${person.first} ${person.last}`,
    );
    await expectAllShown(page, [person.birthPlace, person.deathPlace, person.notes]);
  });
});

// ---------------------------------------------------------------------------
// Event (uses the event type created above)
// ---------------------------------------------------------------------------
test.describe("Event", () => {
  test("every text field and the event type are shown as typed", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/de/events/new");

    await page.locator("#title").fill(event.title);
    await page.getByText("Typ").locator("..").getByRole("combobox").click();
    await page.getByPlaceholder("Name").last().fill(uid);
    await page.getByRole("option", { name: eventTypeName, exact: true }).click();
    await page.locator("#description").fill(event.description);
    await page.locator("#location").fill(event.location);
    await page.locator("#notes").fill(event.notes);
    await page.getByRole("button", { name: "Ereignis speichern" }).click();

    await page.waitForURL(/\/de\/events\/(?!new$)[^/]+$/, { timeout: 15_000 });
    eventId = page.url().split("/").pop() ?? "";

    await expect(page.getByRole("heading", { level: 1 })).toHaveText(event.title);
    await expectAllShown(page, [eventTypeName, event.description, event.location, event.notes]);

    await page.reload();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(event.title);
    await expectAllShown(page, [eventTypeName, event.description, event.location, event.notes]);

    await page.goto(`/de/events?search=${uid}`);
    const row = page.getByRole("row").filter({ hasText: uid });
    await expect(row.getByText(event.title, { exact: true })).toBeVisible();
    await expect(row.getByText(eventTypeName, { exact: true })).toBeVisible();
    await expectInert(page);
  });

  test("the edit form holds the typed values and an unchanged save keeps them", async ({
    page,
  }) => {
    await loginAsAdmin(page);
    await page.goto(`/de/events/${eventId}/edit`);

    await expect(page.locator("#title")).toHaveValue(event.title);
    await expect(page.locator("#description")).toHaveValue(event.description);
    await expect(page.locator("#location")).toHaveValue(event.location);
    await expect(page.locator("#notes")).toHaveValue(event.notes);

    const saved = page.waitForResponse(
      (res) => res.url().includes(`/api/events/${eventId}`) && res.request().method() === "PUT",
    );
    await page.getByRole("button", { name: "Ereignis speichern" }).click();
    expect((await saved).status()).toBe(200);
    await page.waitForURL(new RegExp(`/de/events/${eventId}$`), { timeout: 15_000 });

    await page.reload();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(event.title);
    await expectAllShown(page, [eventTypeName, event.description, event.location, event.notes]);
  });
});

// ---------------------------------------------------------------------------
// Source
// ---------------------------------------------------------------------------
test.describe("Source", () => {
  test("every text field is shown as typed on the list and the detail page", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/de/sources/new");

    await page.locator("#title").fill(source.title);
    // `sources.type` is free text, but typing a value that matches no suggestion
    // crashes the form (React #185, measured: SourceForm.tsx, unrelated to #150),
    // so the payloads cannot go through this field and a suggestion is picked.
    await page.getByRole("combobox").first().click();
    await page.getByRole("option", { name: "Brief" }).click();
    await page.locator("#author").fill(source.author);
    await page.locator("#date").fill(source.date);
    await page.locator("#repository").fill(source.repository);
    await page.locator("#call_number").fill(source.callNumber);
    await page.locator("#notes").fill(source.notes);
    await page.getByRole("button", { name: "Quelle erstellen" }).click();

    await page.waitForURL(/\/de\/sources\/(?!new$)[^/]+$/, { timeout: 15_000 });
    sourceId = page.url().split("/").pop() ?? "";

    const shown = [source.author, source.date, source.repository, source.callNumber, source.notes];
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(source.title);
    await expectAllShown(page, shown);

    await page.reload();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(source.title);
    await expectAllShown(page, shown);

    await page.goto(`/de/sources?search=${encodeURIComponent(uid)}`);
    const row = page.getByRole("row").filter({ hasText: uid });
    await expect(row.getByText(source.title, { exact: true })).toBeVisible();
    await expect(row.getByText(source.author, { exact: true })).toBeVisible();
    await expectInert(page);
  });

  test("searching a source by an author containing '&' finds it", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/de/sources");

    await page.getByPlaceholder("Titel oder Autor suchen…").fill(MULLER);
    await page.waitForURL(/search=/, { timeout: 10_000 });
    const row = page.getByRole("row").filter({ hasText: uid });
    await expect(row.getByText(source.title, { exact: true })).toBeVisible({ timeout: 10_000 });
  });

  test("the edit form holds the typed values and an unchanged save keeps them", async ({
    page,
  }) => {
    await loginAsAdmin(page);
    await page.goto(`/de/sources/${sourceId}/edit`);

    await expect(page.locator("#title")).toHaveValue(source.title);
    await expect(page.locator("#author")).toHaveValue(source.author);
    await expect(page.locator("#date")).toHaveValue(source.date);
    await expect(page.locator("#repository")).toHaveValue(source.repository);
    await expect(page.locator("#call_number")).toHaveValue(source.callNumber);
    await expect(page.locator("#notes")).toHaveValue(source.notes);

    const saved = page.waitForResponse(
      (res) => res.url().includes(`/api/sources/${sourceId}`) && res.request().method() === "PUT",
    );
    await page.getByRole("button", { name: "Änderungen speichern" }).click();
    expect((await saved).status()).toBe(200);
    await page.waitForURL(new RegExp(`/de/sources/${sourceId}$`), { timeout: 15_000 });

    await page.reload();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(source.title);
    await expectAllShown(page, [
      source.author,
      source.date,
      source.repository,
      source.callNumber,
      source.notes,
    ]);
  });
});

// ---------------------------------------------------------------------------
// Relation, with evidence (uses the person, event, source and relation type above)
// ---------------------------------------------------------------------------
test.describe("Relation with evidence", () => {
  const evidenceQuote = XSS;
  const secondEvidence = { pageReference: BRIEFE, quote: MULLER };

  /** The person's Relations tab with the one relation this spec created. */
  async function openRelationsTab(page: Page): Promise<void> {
    await page.goto(`/de/persons/${personId}`);
    await page.getByRole("tab", { name: "Relationen" }).click();
    await expectShown(page, relationType.name);
  }

  test("creates a relation whose notes and evidence quote carry the payloads", async ({ page }) => {
    // The dialog with its evidence section open is taller than the default
    // viewport, and the submit button is then outside it.
    await page.setViewportSize({ width: 1280, height: 1600 });
    await loginAsAdmin(page);
    await page.goto(`/de/persons/${personId}`);
    await page.getByRole("tab", { name: "Relationen" }).click();
    await page.getByRole("button", { name: "Relation hinzufügen" }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    // To: the event, found by searching for the run's suffix.
    const toSection = dialog
      .locator("form .space-y-1")
      .filter({ has: page.getByText("Zu", { exact: true }) })
      .first();
    await toSection.locator("select").selectOption({ label: "Ereignis" });
    await toSection.getByRole("button", { name: "Entität auswählen…" }).click();
    await page.getByPlaceholder("Suchen…").last().fill(uid);
    await page.getByRole("option", { name: event.title, exact: true }).click();

    // The type list is filtered by from/to entity type, so pick it after both are set.
    await dialog
      .locator("select")
      .last()
      .selectOption({ label: `${relationType.name} / ${relationType.inverse}` });

    await dialog.locator("textarea").first().fill(relation.notes);

    // Evidence: a source and a quote.
    await dialog.getByRole("button", { name: "Beleg hinzufügen" }).click();
    await dialog.getByRole("button", { name: "Entität auswählen…" }).last().click();
    await page.getByPlaceholder("Suchen…").last().fill(uid);
    await page.getByRole("option", { name: source.title, exact: true }).click();
    await dialog.getByPlaceholder("Relevante Textstelle…").fill(evidenceQuote);

    await dialog.getByRole("button", { name: "Relation erstellen" }).click();
    await expect(page.getByText("Relation gespeichert.")).toBeVisible({ timeout: 10_000 });
    await expect(dialog).toBeHidden();

    await expectShown(page, relationType.name);
    await expectShown(page, event.title);
    await expectInert(page);
  });

  test("shows the evidence as typed and accepts a second piece of evidence", async ({ page }) => {
    await loginAsAdmin(page);
    await openRelationsTab(page);

    await page
      .getByRole("button", { name: /^\d+ Beleg/ })
      .first()
      .click();
    await expectShown(page, `“${evidenceQuote}”`);

    // A second piece, through the evidence form: page reference and quote. A
    // relation holds one piece of evidence per source, so this one cites a
    // seeded source rather than the one the first piece used.
    await page.getByRole("button", { name: "Beleg hinzufügen", exact: true }).click();
    await page.getByPlaceholder("Quelle suchen…").fill("Schillers");
    await page.getByRole("button", { name: "Schillers Tagebücher", exact: true }).first().click();
    await page.getByPlaceholder("z. B. S. 42, fol. 3v").fill(secondEvidence.pageReference);
    await page.getByPlaceholder("Relevantes Zitat").fill(secondEvidence.quote);
    await page
      .locator("form")
      .filter({ has: page.getByPlaceholder("Relevantes Zitat") })
      .getByRole("button", { name: "Beleg hinzufügen" })
      .click();

    await expectShown(page, secondEvidence.pageReference);
    await expectShown(page, `“${secondEvidence.quote}”`);
    await expectShown(page, `“${evidenceQuote}”`);
    await expectInert(page);

    // Read back from the database on a fresh load.
    await page.reload();
    await page.getByRole("tab", { name: "Relationen" }).click();
    await page
      .getByRole("button", { name: /^\d+ Bele/ })
      .first()
      .click();
    await expectShown(page, secondEvidence.pageReference);
    await expectShown(page, `“${secondEvidence.quote}”`);
    await expectShown(page, `“${evidenceQuote}”`);
    await expectInert(page);
  });

  test("the relations list shows the labels as typed", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/de/relations");

    // Newest first, so this run's relation is on the first page.
    await expectShown(page, relationType.name);
    await expectShown(page, event.title);
    await expectShown(page, `${person.first} ${person.last}`);
    await expectInert(page);
  });

  test("the edit dialog holds the typed notes and an unchanged save keeps everything", async ({
    page,
  }) => {
    await loginAsAdmin(page);
    await openRelationsTab(page);

    await page.getByRole("button", { name: "Relation bearbeiten" }).first().click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.locator("textarea").first()).toHaveValue(relation.notes);
    await dialog.getByRole("button", { name: "Relation speichern" }).click();
    await expect(page.getByText("Relation gespeichert.")).toBeVisible({ timeout: 10_000 });
    await expect(dialog).toBeHidden();

    await page.reload();
    await page.getByRole("tab", { name: "Relationen" }).click();
    await expectShown(page, relationType.name);
    await expectShown(page, event.title);
    await page
      .getByRole("button", { name: /^\d+ Bele/ })
      .first()
      .click();
    await expectShown(page, `“${evidenceQuote}”`);
    await expectShown(page, `“${secondEvidence.quote}”`);
    await expectShown(page, secondEvidence.pageReference);

    await page.getByRole("button", { name: "Relation bearbeiten" }).first().click();
    await expect(page.getByRole("dialog").locator("textarea").first()).toHaveValue(relation.notes);
    await expectInert(page);
  });
});

// ---------------------------------------------------------------------------
// Property evidence: quote and raw transcription
// ---------------------------------------------------------------------------
test.describe("Property evidence", () => {
  test("quote and raw transcription round-trip verbatim; the quote renders as typed", async ({
    page,
  }) => {
    await loginAsAdmin(page);

    const evidence = {
      page_reference: BRIEFE,
      quote: MULLER,
      raw_transcription: XSS,
      notes: `${BRIEFE}; ${MULLER}`,
    };

    // No screen edits `raw_transcription` yet, so the write goes through the
    // route the future form will use.
    const created = await page.request.post("/api/property-evidence", {
      data: {
        project_id: "seed-project-demo",
        entity_type: "PERSON",
        entity_id: personId,
        property: "birth_place",
        source_id: sourceId,
        confidence: "PROBABLE",
        ...evidence,
      },
    });
    expect(created.status()).toBe(201);

    const read = await page.request.get(
      `/api/property-evidence?projectId=seed-project-demo&entityType=PERSON&entityId=${personId}&property=birth_place`,
    );
    expect(read.status()).toBe(200);
    const body = (await read.json()) as { data: Array<Record<string, unknown>> };
    expect(body.data).toHaveLength(1);
    expect(body.data[0]).toMatchObject(evidence);

    // The panel renders page reference and quote; open it and compare.
    await page.goto(`/de/persons/${personId}`);
    await page.getByRole("button", { name: /^Geburtsort: 1 Quelle/ }).click();
    await expectShown(page, evidence.page_reference);
    await expectShown(page, `“${evidence.quote}”`);
    await expectInert(page);
  });
});

// ---------------------------------------------------------------------------
// Access request: public form -> operator's confirmation page
// ---------------------------------------------------------------------------
test.describe("Access request", () => {
  const applicant = `e2e-plain-text-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@test.local`;
  const operator = `e2e-plain-text-op-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@test.local`;
  const PASSWORD = "ValidP@ss1";

  const request = {
    name: MULLER,
    institution: BRIEFE,
    researchArea: XSS,
    toolGap: `${MULLER}; ${BRIEFE}; ${XSS}`,
  };

  test.afterAll(async () => {
    await deleteTestAccessRequest(applicant);
    await deleteTestUser(operator);
  });

  test("the operator's page shows the submitted fields as typed", async ({ page }) => {
    // The route treats an answer within 2 s of the form mounting as a bot, so
    // let hydration finish and the 2 s pass before submitting.
    await page.goto("/de#access");
    const form = page.locator("#access");
    await expect(form.locator("#access-name")).toBeVisible();
    await page.waitForTimeout(3_000);

    await form.locator("#access-name").fill(request.name);
    await form.locator("#access-email").fill(applicant);
    await form.locator("#access-institution").fill(request.institution);
    await form.locator("#access-research-area").fill(request.researchArea);
    await form.locator("#access-tool-gap").fill(request.toolGap);
    await form.getByRole("checkbox").click();
    await form.getByRole("button", { name: "Zugang anfragen" }).click();
    await expect(page.getByText(/Danke\. Wenn wir Sie einladen können/)).toBeVisible({
      timeout: 10_000,
    });

    const row = await getTestAccessRequest(applicant);
    expect(row).not.toBeNull();
    // The stored name, read straight from the database.
    expect(row?.name).toBe(MULLER);

    // The operator, a throw-away ADMIN account (never the seeded admin).
    await createTestUser(operator, PASSWORD);
    await setTestUserRole(operator, "ADMIN");
    await page.context().clearCookies();
    await page.goto("/de/auth/login");
    await page.getByLabel("E-Mail").fill(operator);
    await page.getByLabel("Passwort", { exact: true }).fill(PASSWORD);
    await page.getByRole("button", { name: "Anmelden" }).click();
    await page.waitForURL(/\/de\/dashboard/, { timeout: 15_000 });

    await page.goto(`/de/admin/access-requests/${row?.id}`);
    await expect(page.getByRole("heading", { name: "Zugangsanfrage" })).toBeVisible();
    await expectAllShown(page, [
      request.name,
      request.institution,
      request.researchArea,
      request.toolGap,
    ]);
  });
});
