import { type Page, expect, test } from "@playwright/test";

import { resetRateLimits } from "./helpers/db";

// Tests share state — created sources are used in later tests
test.describe.configure({ mode: "serial" });

const SEED_EMAIL = "admin@evidoxa.dev";
const SEED_PASSWORD = "Demo1234!";

// IDs created during the test run — shared across tests
let sourceId = "";
let source2Id = "";
let source3Id = "";

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
// TC-SRC-01: Create source with all fields
// ---------------------------------------------------------------------------
test.describe("TC-SRC-01: Create source with all fields", () => {
  test("creates source with reliability HIGH and redirects to detail page", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/de/sources/new");

    await page.getByLabel("Titel").fill("Test Archivbrief 1848");

    // Open type combobox and select "letter"
    await page.getByRole("combobox").first().click();
    await page.getByRole("option", { name: "Brief" }).click();

    await page.getByLabel("Autor").fill("Johann Müller");

    // Set reliability to HIGH
    await page.getByRole("button", { name: "Hoch" }).click();

    await page.getByLabel("Datum").fill("ca. März 1848");
    await page.getByLabel("Archiv / Repository").fill("Staatsarchiv München");

    await page.getByRole("button", { name: "Quelle erstellen" }).click();

    await page.waitForURL(/\/de\/sources\/(?!new$)[^/]+$/, { timeout: 15_000 });

    const url = page.url();
    sourceId = url.split("/").pop() ?? "";

    await expect(page.getByRole("heading", { name: "Test Archivbrief 1848" })).toBeVisible();
    // Reliability badge should show "Hoch" (green)
    await expect(page.getByText("Hoch", { exact: true }).first()).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// TC-SRC-02: Edit source title and reliability
// ---------------------------------------------------------------------------
test.describe("TC-SRC-02: Edit source title and reliability", () => {
  test("updates title and reliability; detail page reflects changes", async ({ page }) => {
    await loginAsAdmin(page);

    if (!sourceId) {
      test.skip(true, "Requires TC-SRC-01 to have run first");
      return;
    }

    await page.goto(`/de/sources/${sourceId}/edit`);

    // Clear and update title
    await page.getByLabel("Titel").clear();
    await page.getByLabel("Titel").fill("Test Archivbrief 1848 (bearbeitet)");

    // Change reliability to MEDIUM
    await page.getByRole("button", { name: "Mittel" }).click();

    await page.getByRole("button", { name: "Änderungen speichern" }).click();

    await page.waitForURL(`/de/sources/${sourceId}`, { timeout: 15_000 });

    await expect(
      page.getByRole("heading", { name: "Test Archivbrief 1848 (bearbeitet)" }),
    ).toBeVisible();
    await expect(page.getByText("Mittel", { exact: true }).first()).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// TC-SRC-05: Search by title
// ---------------------------------------------------------------------------
test.describe("TC-SRC-05: Search by title", () => {
  test("filters source list by title substring", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/de/sources");

    await page.getByPlaceholder("Titel oder Autor suchen…").fill("Archivbrief");
    await page.waitForTimeout(600); // debounce

    await expect(page.getByText("Test Archivbrief 1848 (bearbeitet)")).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// TC-SRC-06: Search by author
// ---------------------------------------------------------------------------
test.describe("TC-SRC-06: Search by author", () => {
  test("filters source list by author name", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/de/sources");

    await page.getByPlaceholder("Titel oder Autor suchen…").fill("Müller");
    await page.waitForTimeout(600);

    await expect(page.getByText("Test Archivbrief 1848 (bearbeitet)")).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// TC-SRC-07: Filter by reliability=HIGH — create a HIGH source first
// ---------------------------------------------------------------------------
test.describe("TC-SRC-07: Filter by reliability HIGH", () => {
  test("create a HIGH source and filter shows only HIGH sources", async ({ page }) => {
    await loginAsAdmin(page);
    // Create a second source with HIGH reliability
    await page.goto("/de/sources/new");
    await page.getByLabel("Titel").fill("Hochwertige Quelle");

    await page.getByRole("combobox").first().click();
    await page.getByRole("option", { name: "Brief" }).click();

    await page.getByRole("button", { name: "Hoch" }).click();
    await page.getByRole("button", { name: "Quelle erstellen" }).click();

    await page.waitForURL(/\/de\/sources\/(?!new$)[^/]+$/, { timeout: 15_000 });
    const url = page.url();
    source2Id = url.split("/").pop() ?? "";

    // Now filter by HIGH
    await page.goto("/de/sources?reliability=HIGH");
    await expect(page.getByText("Hochwertige Quelle")).toBeVisible();
    // The MEDIUM source should not be visible
    await expect(page.getByText("Test Archivbrief 1848 (bearbeitet)")).not.toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// TC-SRC-08: Source detail page shows all attributes
// ---------------------------------------------------------------------------
test.describe("TC-SRC-08: Source detail page shows all attributes", () => {
  test("detail page renders all fields including type, reliability, metadata", async ({ page }) => {
    await loginAsAdmin(page);

    if (!sourceId) {
      test.skip(true, "Requires TC-SRC-01 to have run first");
      return;
    }

    await page.goto(`/de/sources/${sourceId}`);

    await expect(
      page.getByRole("heading", { name: "Test Archivbrief 1848 (bearbeitet)" }),
    ).toBeVisible();
    // Type pill
    await expect(page.getByText("letter")).toBeVisible();
    // Author
    await expect(page.getByText("Johann Müller")).toBeVisible();
    // Repository
    await expect(page.getByText("Staatsarchiv München")).toBeVisible();
    // Date
    await expect(page.getByText("ca. März 1848")).toBeVisible();
    // Reliability badge
    await expect(page.getByText("Mittel", { exact: true }).first()).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// TC-SRC-09: Relations tab renders placeholder without error
// ---------------------------------------------------------------------------
test.describe("TC-SRC-09: Relations tab renders placeholder", () => {
  test("clicking Relations tab shows placeholder and no console errors", async ({ page }) => {
    await loginAsAdmin(page);

    if (!sourceId) {
      test.skip(true, "Requires TC-SRC-01 to have run first");
      return;
    }

    const errors: string[] = [];
    page.on("console", (msg) => {
      if (
        msg.type() === "error" &&
        !msg.text().includes("Hydration") &&
        !msg.text().includes("hydrat")
      ) {
        errors.push(msg.text());
      }
    });

    await page.goto(`/de/sources/${sourceId}`);
    await page.getByRole("tab", { name: "Verknüpfungen" }).click();

    await expect(
      page.getByText("Verknüpfungen werden nach Abschluss von Epic 2.4 angezeigt."),
    ).toBeVisible();
    expect(errors).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// TC-SRC-04: Bulk delete 2 sources
// ---------------------------------------------------------------------------
test.describe("TC-SRC-04: Bulk delete 2 sources", () => {
  test("selecting and bulk-deleting 2 sources removes them from list", async ({ page }) => {
    await loginAsAdmin(page);

    // Create a third source for bulk delete
    await page.goto("/de/sources/new");
    await page.getByLabel("Titel").fill("Bulk Delete Quelle 3");
    await page.getByRole("combobox").first().click();
    await page.getByRole("option", { name: "Zeitung" }).click();
    await page.getByRole("button", { name: "Quelle erstellen" }).click();
    await page.waitForURL(/\/de\/sources\/(?!new$)[^/]+$/, { timeout: 15_000 });
    const url = page.url();
    source3Id = url.split("/").pop() ?? "";

    await page.goto("/de/sources");

    // Select source2 and source3 via checkboxes — use data rows
    const rows = page.getByRole("row");
    const rowCount = await rows.count();

    // Select first two data rows (skip header)
    if (rowCount > 1) {
      await rows.nth(1).getByRole("checkbox").check();
    }
    if (rowCount > 2) {
      await rows.nth(2).getByRole("checkbox").check();
    }

    // Click bulk delete button
    await page.getByRole("button", { name: "Löschen" }).click();

    // Confirm in dialog
    await page.getByRole("button", { name: "Löschen" }).last().click();

    // Wait for refresh
    await page.waitForTimeout(1_000);

    // Sources should be gone
    if (source2Id) {
      await expect(page.getByText("Hochwertige Quelle")).not.toBeVisible();
    }
    if (source3Id) {
      await expect(page.getByText("Bulk Delete Quelle 3")).not.toBeVisible();
    }
  });
});

// ---------------------------------------------------------------------------
// TC-SRC-03: Delete source from detail page
// ---------------------------------------------------------------------------
test.describe("TC-SRC-03: Delete source from detail page", () => {
  test("soft-deletes source, redirects to list, 404 on direct URL", async ({ page }) => {
    await loginAsAdmin(page);

    if (!sourceId) {
      test.skip(true, "Requires TC-SRC-01 to have run first");
      return;
    }

    await page.goto(`/de/sources/${sourceId}`);

    // Click delete button
    await page.getByRole("button", { name: "Quelle löschen" }).click();

    // Confirm in dialog
    await page.getByRole("button", { name: "Quelle löschen" }).last().click();

    await page.waitForURL(/\/de\/sources$/, { timeout: 15_000 });
    await expect(page).toHaveURL(/\/de\/sources$/);

    // The deleted source should not be in the list
    await expect(page.getByText("Test Archivbrief 1848 (bearbeitet)")).not.toBeVisible();

    // Navigating directly should show 404
    await page.goto(`/de/sources/${sourceId}`);
    await expect(page.getByText(/nicht gefunden|not found/i).first()).toBeVisible();
  });
});
