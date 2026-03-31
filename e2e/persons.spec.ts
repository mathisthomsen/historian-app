import { type Page, expect, test } from "@playwright/test";

import { resetRateLimits } from "./helpers/db";

// Tests share state (persons created in early tests are used in later tests)
test.describe.configure({ mode: "serial" });

const SEED_EMAIL = "admin@evidoxa.dev";
const SEED_PASSWORD = "Demo1234!";

// IDs of persons created during the test run — shared across tests
let createdPersonId = "";

async function loginAsAdmin(page: Page) {
  await page.goto("/de/auth/login");
  await page.getByLabel("E-Mail").fill(SEED_EMAIL);
  await page.getByLabel("Passwort", { exact: true }).fill(SEED_PASSWORD);
  await page.getByRole("button", { name: "Anmelden" }).click();
  await page.waitForURL(/\/de\/dashboard/, { timeout: 15_000 });
}

test.beforeEach(async ({ context, page }) => {
  await resetRateLimits();
  await context.clearCookies();
  await page.addInitScript(() => {
    window.localStorage.clear();
  });
});

// ---------------------------------------------------------------------------
// TC-P-01: List page renders with correct columns
// ---------------------------------------------------------------------------
test.describe("TC-P-01: Persons list page", () => {
  test("renders table with correct columns and seed persons", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/de/persons");

    await expect(page.getByRole("heading", { name: "Personen" })).toBeVisible();
    await expect(page.getByText("Nachname")).toBeVisible();
    await expect(page.getByText("Vorname")).toBeVisible();
    await expect(page.getByText("Geburtsdatum")).toBeVisible();
    await expect(page.getByText("Sterbedatum")).toBeVisible();
    // Seed has von Goethe, von Schiller, von Humboldt, von Humboldt (Caroline)
    await expect(page.getByText("von Goethe")).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// TC-P-02: Create person with year-only birth date and PROBABLE certainty
// ---------------------------------------------------------------------------
test.describe("TC-P-02: Create person with partial date", () => {
  test("creates Karl Maier with birth year 1848 and PROBABLE certainty", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/de/persons/new");

    await page.getByLabel("Vorname").fill("Karl");
    await page.getByLabel("Nachname").fill("Maier");

    // Birth year
    await page.getByLabel("Jahr").first().fill("1848");

    // Click Wahrscheinlich (PROBABLE) certainty for birth
    await page.getByText("Wahrscheinlich").first().click();

    await page.getByRole("button", { name: "Person speichern" }).click();

    // Should redirect to detail page (UUID, not "new")
    await page.waitForURL(/\/de\/persons\/(?!new$)[^/]+$/, { timeout: 10_000 });
    createdPersonId = page.url().split("/").pop() ?? "";

    await expect(page.getByRole("heading", { name: /Karl Maier/ })).toBeVisible();
    await expect(page.getByText("Person gespeichert.")).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// TC-P-03: Detail page shows "1848 (Wahrscheinlich)"
// ---------------------------------------------------------------------------
test.describe("TC-P-03: Detail page shows partial date with certainty", () => {
  test("shows 1848 with Wahrscheinlich label", async ({ page }) => {
    await loginAsAdmin(page);
    if (!createdPersonId) {
      // Create person if not done yet (in case tests run individually)
      await page.goto("/de/persons/new");
      await page.getByLabel("Vorname").fill("Karl");
      await page.getByLabel("Nachname").fill("Maier");
      await page.getByLabel("Jahr").first().fill("1848");
      await page.getByText("Wahrscheinlich").first().click();
      await page.getByRole("button", { name: "Person speichern" }).click();
      await page.waitForURL(/\/de\/persons\/(?!new$)[^/]+$/, { timeout: 10_000 });
      createdPersonId = page.url().split("/").pop() ?? "";
    } else {
      await page.goto(`/de/persons/${createdPersonId}`);
    }

    await expect(page.getByRole("heading", { name: /Karl Maier/ })).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByText("1848")).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText("Wahrscheinlich")).toBeVisible({ timeout: 10_000 });
  });
});

// ---------------------------------------------------------------------------
// TC-P-04: Add name variant
// ---------------------------------------------------------------------------
test.describe("TC-P-04: Add name variant", () => {
  test("adds Carolus Magnus (la) and shows in Weitere Namen tab", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto(`/de/persons/${createdPersonId}/edit`);

    // Click "Name hinzufügen"
    await page.getByRole("button", { name: "Name hinzufügen" }).click();

    // Fill in the name variant
    const nameInput = page.getByPlaceholder("Alternativer Name").last();
    await nameInput.fill("Carolus Magnus");

    const langInput = page.getByPlaceholder("de, la, en…").last();
    await langInput.fill("la");

    await page.getByRole("button", { name: "Person speichern" }).click();
    await page.waitForURL(/\/de\/persons\/[^/]+$/, { timeout: 10_000 });

    // After SPA navigation the loading.tsx skeleton is shown briefly with no tabs;
    // wait for the actual tab panel to become visible before clicking.
    await expect(page.getByRole("tab", { name: "Weitere Namen" })).toBeVisible({
      timeout: 15_000,
    });

    // Click Weitere Namen tab
    await page.getByRole("tab", { name: "Weitere Namen" }).click();
    await expect(page.getByText("Carolus Magnus")).toBeVisible();
    await expect(page.getByText("la")).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// TC-P-05: Search by last name
// ---------------------------------------------------------------------------
test.describe("TC-P-05: Search by last name", () => {
  test("filtering by 'Maier' shows only matching persons", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/de/persons");

    // Type in search box
    await page.getByPlaceholder("Nach Name suchen…").fill("Maier");

    // Wait for debounce and URL update
    await page.waitForURL(/search=Maier/, { timeout: 5_000 });

    // Karl Maier should be visible
    await expect(page.getByText("Maier").first()).toBeVisible();
    // von Goethe should NOT be visible
    await expect(page.getByText("von Goethe")).not.toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// TC-P-06: Search by name variant
// ---------------------------------------------------------------------------
test.describe("TC-P-06: Search by name variant", () => {
  test("searching 'Carolus' finds Karl Maier via name variant", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/de/persons");

    await page.getByPlaceholder("Nach Name suchen…").fill("Carolus");
    await page.waitForURL(/search=Carolus/, { timeout: 5_000 });

    // Karl Maier should be found via name variant
    await expect(page.getByText("Maier").first()).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// TC-P-07: Edit person (change death certainty)
// ---------------------------------------------------------------------------
test.describe("TC-P-07: Edit person", () => {
  test("changes death certainty to Sicher and shows updated value", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto(`/de/persons/${createdPersonId}/edit`);

    // In Sterbedaten section, click Sicher (CERTAIN)
    // The death certainty group is the second CertaintySelector
    await page.getByText("Sicher").last().click();

    await page.getByRole("button", { name: "Person speichern" }).click();
    await page.waitForURL(/\/de\/persons\/[^/]+$/, { timeout: 10_000 });

    await expect(page.getByText("Person gespeichert.")).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// TC-P-08: Delete single person from detail page
// ---------------------------------------------------------------------------
test.describe("TC-P-08: Delete single person", () => {
  test("soft-deletes person and redirects to list", async ({ page }) => {
    await loginAsAdmin(page);
    // Create a fresh person to delete (avoid deleting the one used in other tests)
    await page.goto("/de/persons/new");
    await page.getByLabel("Nachname").fill("ZuLoeschender");
    await page.getByRole("button", { name: "Person speichern" }).click();
    await page.waitForURL(/\/de\/persons\/(?!new$)[^/]+$/, { timeout: 10_000 });

    // Click "Person löschen"
    await page.getByRole("button", { name: "Person löschen" }).click();

    // Confirm in dialog
    await page.getByRole("dialog").getByRole("button", { name: "Person löschen" }).click();

    // Should redirect to list
    await page.waitForURL(/\/de\/persons$/, { timeout: 10_000 });
    await expect(page.getByText("Person gelöscht.")).toBeVisible();
    await expect(page.getByText("ZuLoeschender")).not.toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// TC-P-09: Bulk delete
// ---------------------------------------------------------------------------
test.describe("TC-P-09: Bulk delete", () => {
  test("bulk deletes 2 persons and removes them from list", async ({ page }) => {
    await loginAsAdmin(page);

    // Create 2 persons to bulk-delete
    for (const name of ["BulkDel1", "BulkDel2"]) {
      await page.goto("/de/persons/new");
      await page.getByLabel("Nachname").fill(name);
      await page.getByRole("button", { name: "Person speichern" }).click();
      await page.waitForURL(/\/de\/persons\/(?!new$)[^/]+$/, { timeout: 10_000 });
    }

    await page.goto("/de/persons");

    // Search for BulkDel to find only those
    await page.getByPlaceholder("Nach Name suchen…").fill("BulkDel");
    await page.waitForURL(/search=BulkDel/, { timeout: 5_000 });

    // Select all visible rows
    await page.getByRole("checkbox").first().check(); // header checkbox
    await expect(page.getByText(/\d+ ausgewählt/)).toBeVisible();

    // Click Löschen
    await page.getByRole("button", { name: "Löschen" }).click();

    // Confirm
    await page.getByRole("dialog").getByRole("button", { name: "Löschen" }).click();

    // Both should be gone
    await expect(page.getByText("BulkDel1")).not.toBeVisible({ timeout: 5_000 });
    await expect(page.getByText("BulkDel2")).not.toBeVisible({ timeout: 5_000 });
  });
});

// ---------------------------------------------------------------------------
// TC-P-10: English locale
// ---------------------------------------------------------------------------
test.describe("TC-P-10: English locale persons page", () => {
  test("renders all UI text in English at /en/persons", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/en/persons");

    await expect(page.getByRole("heading", { name: "Persons" })).toBeVisible();
    await expect(page.getByText("Last Name")).toBeVisible();
    await expect(page.getByText("First Name")).toBeVisible();
    await expect(page.getByRole("link", { name: "New Person" })).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// TC-P-11: Person detail shows correct attributes
// ---------------------------------------------------------------------------
test.describe("TC-P-11: Person detail attributes", () => {
  test("detail page shows birth year and seed person notes", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/de/persons");

    // Navigate to Goethe's detail page (seed data)
    await page.getByText("von Goethe").click();
    await page.waitForURL(/\/de\/persons\/[^/]+$/, { timeout: 5_000 });

    await expect(page.getByRole("heading", { name: /Goethe/ })).toBeVisible();
    // Birth year 1749 should be visible
    await expect(page.getByText("1749")).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// TC-P-12: Weitere Namen tab shows name variants
// ---------------------------------------------------------------------------
test.describe("TC-P-12: Weitere Namen tab", () => {
  test("Goethe detail page shows Latin name variant", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/de/persons");
    await page.getByText("von Goethe").click();
    await page.waitForURL(/\/de\/persons\/[^/]+$/, { timeout: 5_000 });

    // Click Weitere Namen tab
    await page.getByRole("tab", { name: "Weitere Namen" }).click();

    // Seed has Ioannes Wolfgangus de Goethe (la)
    await expect(page.getByText("Ioannes Wolfgangus de Goethe")).toBeVisible();
    await expect(page.getByText("la")).toBeVisible();
  });
});
