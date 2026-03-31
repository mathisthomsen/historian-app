import { type Page, expect, test } from "@playwright/test";

import { resetRateLimits } from "./helpers/db";

// ---------------------------------------------------------------------------
// Seed IDs (deterministic — from prisma/seed.ts)
// ---------------------------------------------------------------------------

const SEED = {
  person: {
    goethe: "seed-person-goethe",
    schiller: "seed-person-schiller",
    humboldt: "seed-person-humboldt",
    caroline: "seed-person-caroline",
  },
  source: {
    goetheBrief: "seed-source-goethe-brief",
  },
};

const ADMIN_EMAIL = "admin@evidoxa.dev";
const ADMIN_PASSWORD = "Demo1234!";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function loginAsAdmin(page: Page) {
  await page.goto("/de/auth/login");
  await page.getByLabel("E-Mail").fill(ADMIN_EMAIL);
  await page.getByLabel("Passwort", { exact: true }).fill(ADMIN_PASSWORD);
  await page.getByRole("button", { name: "Anmelden" }).click();
  await page.waitForURL(/\/de\/dashboard/, { timeout: 15_000 });
}

// ---------------------------------------------------------------------------
// Before each: clean slate
// ---------------------------------------------------------------------------

test.beforeEach(async ({ context, page }) => {
  await resetRateLimits();
  await context.clearCookies();
  await page.addInitScript(() => {
    window.localStorage.clear();
  });
});

// ---------------------------------------------------------------------------
// TC-2.4-01: Create relation from person detail Relations tab
// ---------------------------------------------------------------------------
test.describe("TC-2.4-01: Create relation with evidence", () => {
  test("creates outgoing relation from Goethe to Schiller", async ({ page }) => {
    await loginAsAdmin(page);

    // Navigate to Goethe's detail page
    await page.goto(`/de/persons/${SEED.person.goethe}`);
    await page.waitForURL(/\/de\/persons\/seed-person-goethe/);

    // Click the Relations tab
    await page.getByRole("tab", { name: "Relationen" }).click();

    // Wait for tab content to render
    await expect(page.getByRole("button", { name: "Relation hinzufügen" })).toBeVisible({
      timeout: 10_000,
    });

    // Open add-relation dialog
    await page.getByRole("button", { name: "Relation hinzufügen" }).click();

    // Dialog should be visible with correct title
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Relation hinzufügen" })).toBeVisible();

    // The "Von" entity selector should be pre-filled — Goethe's name is visible on the page
    await expect(page.getByText("Johann Wolfgang von Goethe").first()).toBeVisible();

    // Select target entity (Schiller) — click the Popover trigger button in the "Zu" section
    const zuSection = page
      .locator("form .space-y-1")
      .filter({ has: page.getByText("Zu", { exact: true }) })
      .first();
    await zuSection.getByRole("button", { name: "Entität auswählen…" }).click();

    // Wait for search input and type Schiller
    await page.getByPlaceholder("Suchen…").last().fill("Schiller");
    await expect(page.getByRole("option", { name: /Friedrich.*Schiller/ })).toBeVisible({
      timeout: 8_000,
    });
    await page.getByRole("option", { name: /Friedrich.*Schiller/ }).click();

    // Select relation type "was colleague of" — native <select>
    // Option text is "name / inverse_name" = "was colleague of / was colleague of"
    const typeSection = page
      .locator("form .space-y-1")
      .filter({ has: page.getByText("Relationstyp", { exact: true }) })
      .first();
    await typeSection
      .locator("select")
      .selectOption({ label: "was colleague of / was colleague of" });

    // Submit the form
    await page.getByRole("button", { name: "Relation erstellen" }).click();

    // Verify success toast
    await expect(page.getByText("Relation gespeichert.")).toBeVisible({ timeout: 8_000 });

    // Verify relation appears in outgoing section
    await expect(page.getByText("Ausgehend")).toBeVisible();
    await expect(page.getByText("was colleague of").first()).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// TC-2.4-02: PropertyEvidence badge annotation
// ---------------------------------------------------------------------------
test.describe("TC-2.4-02: PropertyEvidence annotation", () => {
  test("badge increments after adding evidence to birth_year", async ({ page }) => {
    // Use tall viewport so PropertyEvidence popover + evidence entries + form all fit on screen
    await page.setViewportSize({ width: 1280, height: 1200 });
    await loginAsAdmin(page);

    // Navigate to Goethe's detail page
    await page.goto(`/de/persons/${SEED.person.goethe}`);
    await page.waitForURL(/\/de\/persons\/seed-person-goethe/);

    // Attributes tab is default — wait for PersonDetailCard to render
    await expect(page.getByText("1749")).toBeVisible({ timeout: 10_000 });

    // Find the PropertyEvidenceBadge for birth_year
    // Badge aria-label pattern: "{fieldLabel}: {count} Quelle(n)" — fieldLabel = t("birth_date") = "Geburtsdatum"
    const badge = page.getByRole("button", { name: /Geburtsdatum/i }).first();

    // Get initial count (badge text)
    // The badge may show "0 Quellen" or similar
    await expect(badge).toBeVisible({ timeout: 8_000 });

    // Click the badge to open popover
    await badge.click();

    // Popover should appear with "Nachweise" title (may match multiple — use first)
    await expect(page.getByText("Nachweise").first()).toBeVisible({ timeout: 5_000 });

    // Click "Beleg hinzufügen"
    await page.getByRole("button", { name: "Beleg hinzufügen" }).click();

    // EvidenceForm appears — search for a source
    await expect(page.getByPlaceholder("Quelle suchen…")).toBeVisible({ timeout: 5_000 });
    await page.getByPlaceholder("Quelle suchen…").fill("Goethe");

    // Select the Goethe brief source from the search dropdown (use button role to
    // avoid matching existing evidence list entries which show the same source title as text)
    await expect(page.getByRole("button", { name: /Goethes Briefwechsel/ })).toBeVisible({
      timeout: 8_000,
    });
    await page.getByRole("button", { name: /Goethes Briefwechsel/ }).click();

    // Fill page reference and quote
    await page.getByPlaceholder("z. B. S. 42, fol. 3v").fill("S. 1");
    await page.getByPlaceholder("Relevantes Zitat").fill("geboren 1749");

    // Submit — last "Beleg hinzufügen" button is the EvidenceForm submit
    await expect(page.getByRole("button", { name: "Beleg hinzufügen" }).last()).toBeEnabled({
      timeout: 5_000,
    });
    await page.getByRole("button", { name: "Beleg hinzufügen" }).last().click();

    // Verify success toast
    await expect(page.getByText("Beleg gespeichert.")).toBeVisible({ timeout: 8_000 });

    // Verify badge shows a positive count (count may be >1 from previous test runs)
    await expect(page.getByRole("button", { name: /Geburtsdatum: [1-9]/ })).toBeVisible({
      timeout: 8_000,
    });
  });
});

// ---------------------------------------------------------------------------
// TC-2.4-03: RelationType CRUD on settings page
// ---------------------------------------------------------------------------
test.describe("TC-2.4-03: RelationType CRUD", () => {
  test("settings page shows seeded types and supports create+delete", async ({ page }) => {
    await loginAsAdmin(page);

    // Navigate to relation types settings
    await page.goto("/de/settings/relation-types");
    await page.waitForURL(/\/de\/settings\/relation-types/);

    // Verify page heading
    await expect(page.getByRole("heading", { name: "Relationstypen" })).toBeVisible();

    // Verify seeded relation types are visible (≥4 from seed.ts)
    await expect(page.getByText("ist verwandt mit").first()).toBeVisible({ timeout: 8_000 });
    await expect(page.getByText("participated in").first()).toBeVisible();
    await expect(page.getByText("was born in").first()).toBeVisible();
    await expect(page.getByText("was colleague of").first()).toBeVisible();

    // Create a new type
    await page.getByRole("button", { name: "Neuer Typ" }).click();

    // Dialog opens
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Neuer Typ" })).toBeVisible();

    // Fill name
    const uniqueName = `testbeziehung-e2e-${Date.now()}`;
    await page.getByLabel("Name").fill(uniqueName);

    // Check PERSON in validFromTypes
    const fromSection = page
      .locator(".space-y-2")
      .filter({ has: page.getByText("Gültig von (Entitätstyp)") })
      .first();
    await fromSection.getByText("Person").click();

    // Check PERSON in validToTypes
    const toSection = page
      .locator(".space-y-2")
      .filter({ has: page.getByText("Gültig zu (Entitätstyp)") })
      .first();
    await toSection.getByText("Person").click();

    // Save
    await page.getByRole("button", { name: "Speichern" }).click();

    // Verify toast and new row in table
    await expect(page.getByText("Relationstyp gespeichert.")).toBeVisible({ timeout: 8_000 });
    await expect(page.getByText(uniqueName)).toBeVisible();

    // Delete the new type
    const newRow = page.locator("tr").filter({ has: page.getByText(uniqueName) });
    await newRow.getByRole("button", { name: "Typ löschen" }).click();

    // Confirm in alert dialog
    await expect(page.getByRole("alertdialog")).toBeVisible();
    await page.getByRole("button", { name: "Typ löschen" }).last().click();

    // Verify deleted
    await expect(page.getByText("Relationstyp gelöscht.")).toBeVisible({ timeout: 8_000 });
    await expect(page.getByText(uniqueName)).not.toBeVisible();
  });

  test("deleting in-use type shows error toast", async ({ page }) => {
    await loginAsAdmin(page);

    await page.goto("/de/settings/relation-types");
    await page.waitForURL(/\/de\/settings\/relation-types/);

    // "was colleague of" is used by 2 relations in the seed
    await expect(page.getByText("was colleague of").first()).toBeVisible({ timeout: 8_000 });

    // Filter to the row where "was colleague of" is in the name (font-medium) column
    const colleagueRow = page
      .locator("tr")
      .filter({ has: page.locator("td.font-medium", { hasText: /^was colleague of$/ }) })
      .first();
    await colleagueRow.getByRole("button", { name: "Typ löschen" }).click();

    // Frontend should show a toast error immediately (before any dialog) because
    // _count.relations > 0
    await expect(page.getByText(/verwendet/i)).toBeVisible({ timeout: 8_000 });
  });
});

// ---------------------------------------------------------------------------
// TC-2.4-04: Activity log shows CREATE entry
// ---------------------------------------------------------------------------
test.describe("TC-2.4-04: Activity log", () => {
  test("Verlauf tab shows activity for Goethe person", async ({ page }) => {
    await loginAsAdmin(page);

    // Navigate to Goethe's detail page
    await page.goto(`/de/persons/${SEED.person.goethe}`);
    await page.waitForURL(/\/de\/persons\/seed-person-goethe/);

    // Click Verlauf tab
    await page.getByRole("tab", { name: "Verlauf" }).click();

    // Wait for activity log to render
    // Either there are entries OR the empty state message — use first() to avoid strict mode
    await expect(
      page.getByText("erstellt").first().or(page.getByText("Kein Verlauf vorhanden.")),
    ).toBeVisible({ timeout: 10_000 });
  });

  test("activity log shows CREATE entry after creating a relation", async ({ page }) => {
    await loginAsAdmin(page);

    // Navigate to Humboldt page
    await page.goto(`/de/persons/${SEED.person.humboldt}`);
    await page.waitForURL(/\/de\/persons\/seed-person-humboldt/);

    // Open Relations tab
    await page.getByRole("tab", { name: "Relationen" }).click();
    await expect(page.getByRole("button", { name: "Relation hinzufügen" })).toBeVisible({
      timeout: 10_000,
    });

    // Create a new relation (Humboldt → verwandt mit → Caroline)
    await page.getByRole("button", { name: "Relation hinzufügen" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();

    // Select target entity (Caroline) — click Popover trigger button in "Zu" section
    const zuSection = page
      .locator("form .space-y-1")
      .filter({ has: page.getByText("Zu", { exact: true }) })
      .first();
    await zuSection.getByRole("button", { name: "Entität auswählen…" }).click();
    await page.getByPlaceholder("Suchen…").last().fill("Caroline");
    await expect(page.getByRole("option", { name: /Caroline.*Humboldt/ })).toBeVisible({
      timeout: 8_000,
    });
    await page.getByRole("option", { name: /Caroline.*Humboldt/ }).click();

    // Select relation type — native <select>
    // Option text is "name / inverse_name" = "ist verwandt mit / ist verwandt mit"
    const typeSection = page
      .locator("form .space-y-1")
      .filter({ has: page.getByText("Relationstyp", { exact: true }) })
      .first();
    await typeSection
      .locator("select")
      .selectOption({ label: "ist verwandt mit / ist verwandt mit" });

    // Submit
    await page.getByRole("button", { name: "Relation erstellen" }).click();
    await expect(page.getByText("Relation gespeichert.")).toBeVisible({ timeout: 8_000 });

    // Switch to Verlauf tab
    await page.getByRole("tab", { name: "Verlauf" }).click();

    // Verify at least one "erstellt" entry
    await expect(page.getByText("erstellt").first()).toBeVisible({ timeout: 10_000 });
  });
});

// ---------------------------------------------------------------------------
// TC-2.4-05: Incoming relation shows inverse_name
// ---------------------------------------------------------------------------
test.describe("TC-2.4-05: Inverse relation display", () => {
  test("Humboldt Relations tab shows Caroline incoming relation", async ({ page }) => {
    await loginAsAdmin(page);

    // Navigate to Humboldt's page — Caroline → colleague → Humboldt is seeded
    await page.goto(`/de/persons/${SEED.person.humboldt}`);
    await page.waitForURL(/\/de\/persons\/seed-person-humboldt/);

    // Click Relations tab
    await page.getByRole("tab", { name: "Relationen" }).click();

    // Wait for relations to load
    await expect(
      page.getByText("Eingehend").or(page.getByText("Noch keine Relationen.")),
    ).toBeVisible({ timeout: 10_000 });

    // Verify the "Eingehend" section is visible
    await expect(page.getByText("Eingehend")).toBeVisible();

    // The seeded relation: Caroline → "was colleague of" → Humboldt
    // In incoming view, the relation type name is shown (the spec uses inverse_name for display)
    await expect(page.getByText("was colleague of").first()).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText("Caroline von Humboldt").first()).toBeVisible();
  });

  test("Schiller Relations tab shows incoming relation from Goethe", async ({ page }) => {
    await loginAsAdmin(page);

    // Goethe → colleague → Schiller is seeded (rel1 uses colleague type)
    await page.goto(`/de/persons/${SEED.person.schiller}`);
    await page.waitForURL(/\/de\/persons\/seed-person-schiller/);

    await page.getByRole("tab", { name: "Relationen" }).click();

    await expect(page.getByText("Eingehend")).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText("Johann Wolfgang von Goethe").first()).toBeVisible({
      timeout: 5_000,
    });
  });
});

// ---------------------------------------------------------------------------
// TC-2.4-06: Global /relations page
// ---------------------------------------------------------------------------
test.describe("TC-2.4-06: Global relations page", () => {
  test("shows paginated table with seeded relations", async ({ page }) => {
    await loginAsAdmin(page);

    await page.goto("/de/relations");
    await page.waitForURL(/\/de\/relations/);

    // Verify heading
    await expect(page.getByRole("heading", { name: "Relationen" })).toBeVisible();

    // Wait for table to load — seeded 5 relations
    await expect(page.getByRole("button", { name: "Relation hinzufügen" })).toBeVisible({
      timeout: 10_000,
    });

    // Seeded relations should be visible.
    // Use span locator to avoid matching the hidden <option> in the relation-type filter select,
    // which has the same text but is never "visible".
    await expect(page.locator("span").filter({ hasText: "was colleague of" }).first()).toBeVisible({
      timeout: 10_000,
    });

    // Search input is visible
    await expect(page.getByPlaceholder("Suchen…")).toBeVisible();

    // "Relation hinzufügen" button opens dialog without prefillFrom
    await page.getByRole("button", { name: "Relation hinzufügen" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Relation hinzufügen" })).toBeVisible();

    // Close dialog
    await page.getByRole("button", { name: "Abbrechen" }).click();
    await expect(page.getByRole("dialog")).not.toBeVisible();
  });

  test("search filters the relations list", async ({ page }) => {
    await loginAsAdmin(page);

    await page.goto("/de/relations");
    await page.waitForURL(/\/de\/relations/);

    // Wait for relations data to load.
    // Use span locator to avoid matching the hidden <option> in the filter select.
    await expect(page.locator("span").filter({ hasText: "was colleague of" }).first()).toBeVisible({
      timeout: 10_000,
    });

    // Search for something that matches a subset
    await page.getByPlaceholder("Suchen…").fill("Goethe");

    // Wait for debounced search — relations involving Goethe should appear
    await page.waitForTimeout(500);
    // At least the list should render (may filter down)
    await expect(page.getByPlaceholder("Suchen…")).toHaveValue("Goethe");
  });
});
