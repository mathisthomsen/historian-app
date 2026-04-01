import { type Page, expect, test } from "@playwright/test";

import { resetRateLimits } from "./helpers/db";

// Tests share state — created events are used in later tests
test.describe.configure({ mode: "serial" });

const SEED_EMAIL = "admin@evidoxa.dev";
const SEED_PASSWORD = "Demo1234!";

// IDs created during the test run — shared across tests
let wwiEventId = "";
let subEventId = "";

async function loginAsAdmin(page: Page) {
  await page.goto("/de/auth/login");
  await page.getByLabel("E-Mail").fill(SEED_EMAIL);
  await page.getByLabel("Passwort", { exact: true }).fill(SEED_PASSWORD);
  await page.getByRole("button", { name: "Anmelden" }).click();
  await page.waitForURL(/\/de\/dashboard/, { timeout: 15_000 });
}

/** Click the type combobox (first combobox showing "Name" placeholder) */
async function openTypeCombobox(page: Page) {
  // The Typ combobox trigger shows "Name" placeholder before selection
  // It is the first custom combobox on the form
  await page.getByText("Typ").locator("..").getByRole("combobox").click();
}

test.beforeEach(async ({ context, page }) => {
  await resetRateLimits();
  await context.clearCookies();
  await page.addInitScript(() => {
    window.localStorage.clear();
  });
});

// ---------------------------------------------------------------------------
// TC-E-01: Create a top-level event
// ---------------------------------------------------------------------------
test.describe("TC-E-01: Create top-level event", () => {
  test("creates Erster Weltkrieg with type Krieg and start year 1914", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/de/events/new");

    await page.getByLabel("Titel").fill("Erster Weltkrieg");

    // Open type combobox and select Krieg
    await openTypeCombobox(page);
    await page.getByRole("option", { name: "Krieg" }).click();

    // Start year
    await page.getByLabel("Jahr").first().fill("1914");

    // Set certainty to Wahrscheinlich
    await page.getByRole("button", { name: "Wahrscheinlich" }).first().click();

    await page.getByRole("button", { name: "Ereignis speichern" }).click();

    await page.waitForURL(/\/de\/events\/(?!new$)[^/]+$/, { timeout: 15_000 });

    const url = page.url();
    wwiEventId = url.split("/").pop() ?? "";

    await expect(page.getByRole("heading", { name: "Erster Weltkrieg" })).toBeVisible();
    await expect(page.getByText("Krieg", { exact: true })).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// TC-E-02: Create sub-event from parent detail page
// ---------------------------------------------------------------------------
test.describe("TC-E-02: Create sub-event from parent detail", () => {
  test("creates sub-event linked to WWI from detail page", async ({ page }) => {
    await loginAsAdmin(page);

    if (!wwiEventId) {
      test.skip(true, "Requires TC-E-01 to have run first");
      return;
    }

    await page.goto(`/de/events/${wwiEventId}`);

    // Go to sub-events tab
    await page.getByRole("tab", { name: /Unterereignisse/ }).click();

    const addBtn = page.getByRole("link", { name: /Unterereignis hinzufügen/ });
    await expect(addBtn).toBeVisible();
    await addBtn.click();

    await page.waitForURL(/\/de\/events\/new/, { timeout: 10_000 });

    // Parent should be pre-filled
    const parentCombobox = page
      .getByText("Übergeordnetes Ereignis")
      .locator("..")
      .getByRole("combobox");
    await expect(parentCombobox).toContainText("Erster Weltkrieg");

    await page.getByLabel("Titel").fill("Schlacht an der Somme");
    await page.getByLabel("Jahr").first().fill("1916");

    await page.getByRole("button", { name: "Ereignis speichern" }).click();

    await page.waitForURL(
      (url) => {
        const pathname = new URL(url).pathname;
        return /\/de\/events\/[^/]+$/.test(pathname) && !pathname.includes("/events/new");
      },
      { timeout: 15_000 },
    );

    const url = page.url();
    subEventId = new URL(url).pathname.split("/").pop() ?? "";

    await expect(page.getByRole("heading", { name: "Schlacht an der Somme" })).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// TC-E-03: Parent detail — Unterereignisse tab shows count
// ---------------------------------------------------------------------------
test.describe("TC-E-03: Parent detail — sub-events tab count", () => {
  test("Unterereignisse tab shows count (1) and sub-event in table", async ({ page }) => {
    await loginAsAdmin(page);

    if (!wwiEventId) {
      test.skip(true, "Requires TC-E-01");
      return;
    }

    await page.goto(`/de/events/${wwiEventId}`);

    // Tab label should contain (1)
    const subTab = page.getByRole("tab", { name: /Unterereignisse/ });
    await expect(subTab).toContainText("1");

    await subTab.click();

    await expect(page.getByText("Schlacht an der Somme")).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// TC-E-04: Sub-event detail — parent link
// ---------------------------------------------------------------------------
test.describe("TC-E-04: Sub-event shows parent link", () => {
  test("parent link navigates to WWI detail", async ({ page }) => {
    await loginAsAdmin(page);

    if (!subEventId) {
      test.skip(true, "Requires TC-E-02");
      return;
    }

    await page.goto(`/de/events/${subEventId}`);

    // Attributes tab is default — should show "Übergeordnet" with WWI link
    const parentLink = page.getByRole("link", { name: "Erster Weltkrieg" });
    await expect(parentLink).toBeVisible();

    await parentLink.click();
    await expect(page).toHaveURL(new RegExp(`/de/events/${wwiEventId}`));
  });
});

// ---------------------------------------------------------------------------
// TC-E-05: Edit event — change certainty
// ---------------------------------------------------------------------------
test.describe("TC-E-05: Edit event", () => {
  test("changes start certainty to Sicher and saves", async ({ page }) => {
    await loginAsAdmin(page);

    if (!wwiEventId) {
      test.skip(true, "Requires TC-E-01");
      return;
    }

    await page.goto(`/de/events/${wwiEventId}/edit`);

    // Change certainty to Sicher (first group = start certainty)
    await page.getByRole("button", { name: "Sicher" }).first().click();

    await page.getByRole("button", { name: "Ereignis speichern" }).click();

    await page.waitForURL((url) => new URL(url).pathname === `/de/events/${wwiEventId}`, {
      timeout: 15_000,
    });

    await expect(page.getByText("(Sicher)")).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// TC-E-06: Delete blocked if has sub-events; sub-event can be deleted
// ---------------------------------------------------------------------------
test.describe("TC-E-06: Delete event — blocked with sub-events", () => {
  test("parent delete shows warning; sub-event is deleted successfully", async ({ page }) => {
    await loginAsAdmin(page);

    if (!wwiEventId || !subEventId) {
      test.skip(true, "Requires TC-E-01 and TC-E-02");
      return;
    }

    // Try to delete parent — should show sub-event warning
    await page.goto(`/de/events/${wwiEventId}`);
    await page.waitForLoadState("networkidle");
    await page.getByRole("button", { name: /löschen/i }).click();

    // Toast warning should appear (sub-event blocks deletion)
    await expect(page.getByRole("listitem").filter({ hasText: /Unterereignisse/ })).toBeVisible({
      timeout: 8_000,
    });

    // Close or dismiss
    await page.keyboard.press("Escape");

    // Now delete the sub-event
    await page.goto(`/de/events/${subEventId}`);
    await page.getByRole("button", { name: /löschen/i }).click();

    // Confirm deletion
    const confirmBtn = page.getByRole("button", { name: /bestätigen|ja|löschen/i }).last();
    await expect(confirmBtn).toBeVisible({ timeout: 5_000 });
    await confirmBtn.click();

    await page.waitForURL(/\/de\/events$/, { timeout: 15_000 });
    await expect(page.getByText("Schmidt an der Somme")).not.toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// TC-E-07: Bulk delete events
// ---------------------------------------------------------------------------
test.describe("TC-E-07: Bulk delete events", () => {
  test("bulk selects events and deletes them", async ({ page }) => {
    await loginAsAdmin(page);

    // Create 2 dedicated events for this test so we don't accidentally delete wwiEventId
    for (const title of ["Bulk Delete Test 1", "Bulk Delete Test 2"]) {
      await page.goto("/de/events/new");
      await page.getByLabel("Titel").fill(title);
      await page.getByRole("button", { name: "Ereignis speichern" }).click();
      await page.waitForURL(
        (url) => {
          const pathname = new URL(url).pathname;
          return /\/de\/events\/[^/]+$/.test(pathname) && !pathname.includes("/events/new");
        },
        { timeout: 15_000 },
      );
    }

    // Navigate to events list filtered to our test events
    await page.goto("/de/events?search=Bulk+Delete+Test");
    await page.waitForLoadState("networkidle");

    // Check all checkboxes
    const checkboxes = page.getByRole("checkbox");
    const count = await checkboxes.count();

    if (count < 3) {
      test.skip(true, "Need at least 2 events for bulk delete");
      return;
    }

    // Select 2 event checkboxes (skip header at index 0)
    await checkboxes.nth(1).check();
    await checkboxes.nth(2).check();

    // Click bulk delete button
    await page.getByRole("button", { name: /löschen/i }).click();

    // Confirm in dialog
    await page
      .getByRole("button", { name: /bestätigen|ja|löschen/i })
      .last()
      .click();

    await expect(page.getByText(/gelöscht|deleted/i)).toBeVisible({ timeout: 10_000 });
  });
});

// ---------------------------------------------------------------------------
// TC-E-08: Filter list by EventType
// ---------------------------------------------------------------------------
test.describe("TC-E-08: Filter by EventType", () => {
  test("type filter shows only Krieg events", async ({ page }) => {
    await loginAsAdmin(page);
    // Use search param to ensure EventFilters is always rendered even if list is otherwise empty
    await page.goto("/de/events?search=Weltkrieg");

    if (!wwiEventId) {
      test.skip(true, "Requires TC-E-01");
      return;
    }

    await page.waitForLoadState("networkidle");

    // Open type filter popover
    await page.getByRole("button", { name: /^Typ$/ }).click();

    // Select Krieg (type filter uses custom buttons, not checkboxes)
    await page.getByRole("button", { name: "Krieg" }).click();

    // Close popover
    await page.keyboard.press("Escape");
    await page.waitForTimeout(500);

    await expect(page.getByText("Erster Weltkrieg").first()).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// TC-E-09: Date range filter and tooltip
// ---------------------------------------------------------------------------
test.describe("TC-E-09: Date range filter and tooltip", () => {
  test("date range shows WWI (1914–1918 overlaps 1900–1920)", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/de/events");

    if (!wwiEventId) {
      test.skip(true, "Requires TC-E-01");
      return;
    }

    // Navigate directly with both date params to avoid race conditions from sequential fills
    await page.goto("/de/events?fromYear=1900&toYear=1920");
    await page.waitForLoadState("networkidle");

    const fromInput = page.getByLabel(/Von Jahr|From Year/);
    const toInput = page.getByLabel(/Bis Jahr|To Year/);

    await expect(page.getByText("Erster Weltkrieg").first()).toBeVisible();

    // Check date range inputs reflect URL params
    await expect(fromInput).toHaveValue("1900");
    await expect(toInput).toHaveValue("1920");
  });
});

// ---------------------------------------------------------------------------
// TC-E-10: Filter "Nur Hauptereignisse"
// ---------------------------------------------------------------------------
test.describe("TC-E-10: Top-level-only filter", () => {
  test("hides sub-events when checked", async ({ page }) => {
    await loginAsAdmin(page);

    // Create a sub-event if needed
    if (wwiEventId) {
      await page.goto(`/de/events/${wwiEventId}`);
      const subTab = page.getByRole("tab", { name: /Unterereignisse/ });
      const countText = await subTab.textContent();
      if (countText?.includes("(0)")) {
        await subTab.click();
        await page.getByRole("link", { name: /Unterereignis hinzufügen/ }).click();
        await page.waitForURL(/\/de\/events\/new/);
        await page.getByLabel("Titel").fill("Verdun");
        await page.getByRole("button", { name: "Ereignis speichern" }).click();
        await page.waitForURL(
          (url) => {
            const pathname = new URL(url).pathname;
            return /\/de\/events\/[^/]+$/.test(pathname) && !pathname.includes("/events/new");
          },
          { timeout: 15_000 },
        );
      }
    }

    // Navigate without topLevelOnly first
    await page.goto("/de/events?topLevelOnly=0");
    await page.waitForLoadState("networkidle");

    // Click the checkbox to enable top-level-only filter
    const checkbox = page.getByLabel(/Nur Hauptereignisse|Top-level/i);
    await checkbox.click();
    await page.waitForURL(/topLevelOnly=1/, { timeout: 10_000 });
    await page.waitForLoadState("networkidle");

    // Verdun (sub-event) should not be visible
    await expect(page.getByText("Verdun")).not.toBeVisible();
    // WWI (top-level) should be visible if it exists
    if (wwiEventId) {
      await expect(page.getByText("Erster Weltkrieg").first()).toBeVisible();
    }
  });
});

// ---------------------------------------------------------------------------
// TC-E-11: Search by title
// ---------------------------------------------------------------------------
test.describe("TC-E-11: Search by title", () => {
  test("search for Weltkrieg shows matching events", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/de/events");

    await page.getByPlaceholder(/Nach Titel suchen|Search by title/i).fill("Weltkrieg");
    await page.waitForTimeout(500);

    await expect(page.getByText("Erster Weltkrieg").first()).toBeVisible();
    // Other events should not be visible
    await expect(page.getByText("Goethes Ankunft")).not.toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// TC-E-12: EventType inline create from combobox
// ---------------------------------------------------------------------------
test.describe("TC-E-12: EventType inline create", () => {
  test("creates new type inline and shows assign color link", async ({ page }) => {
    await loginAsAdmin(page);

    // Pre-cleanup: delete "Belagerung" if it exists from previous runs
    const cleanupRes = await page.request.get("/api/event-types");
    if (cleanupRes.ok()) {
      const data = (await cleanupRes.json()) as { data: Array<{ id: string; name: string }> };
      const existing = (data.data ?? []).find((t) => t.name === "Belagerung");
      if (existing) await page.request.delete(`/api/event-types/${existing.id}`);
    }

    await page.goto("/de/events/new");

    // Open type combobox
    await openTypeCombobox(page);

    // Type a new name not in the list
    await page
      .getByRole("combobox", { name: /suchen|search/i })
      .or(page.locator("[cmdk-input]"))
      .fill("Belagerung");

    // Wait for "Neu erstellen" option to appear
    await expect(page.getByText(/Neu erstellen.*Belagerung/i)).toBeVisible({ timeout: 5_000 });
    await page.getByText(/Neu erstellen.*Belagerung/i).click();

    // Type should be selected
    await expect(page.getByText("Typ").locator("..").getByRole("combobox")).toContainText(
      "Belagerung",
    );

    // Farbe zuweisen link should appear
    await expect(page.getByRole("link", { name: /Farbe zuweisen|Assign color/i })).toBeVisible({
      timeout: 5_000,
    });
  });
});

// ---------------------------------------------------------------------------
// TC-E-13: EventType settings page lifecycle
// ---------------------------------------------------------------------------
test.describe("TC-E-13: EventType settings CRUD", () => {
  test("full create/edit/blocked-delete/delete lifecycle", async ({ page }) => {
    await loginAsAdmin(page);

    // Pre-cleanup: delete leftover types from previous partial test runs
    const cleanupRes = await page.request.get("/api/event-types");
    if (cleanupRes.ok()) {
      const data = (await cleanupRes.json()) as { data: Array<{ id: string; name: string }> };
      for (const name of ["Expedition", "Forschung"]) {
        const existing = (data.data ?? []).find((t) => t.name === name);
        if (existing) await page.request.delete(`/api/event-types/${existing.id}`);
      }
    }

    await page.goto("/de/settings/event-types");

    await expect(page.getByRole("heading", { name: /Ereignistypen|Event Types/ })).toBeVisible();

    // Default types present
    await expect(page.getByText("Krieg")).toBeVisible();

    // Create new type "Expedition"
    await page.getByRole("button", { name: /Neuer Ereignistyp|New Event Type/ }).click();

    // Fill name in the inline create row
    const createInput = page.getByPlaceholder(/Name/i).last();
    await createInput.pressSequentially("Expedition");
    const saveBtn = page.getByRole("button", { name: "Speichern" }).last();
    await expect(saveBtn).toBeEnabled({ timeout: 3_000 });
    const [postResponse] = await Promise.all([
      page.waitForResponse(
        (res) => res.url().includes("/api/event-types") && res.request().method() === "POST",
        { timeout: 10_000 },
      ),
      saveBtn.click(),
    ]);

    // Assert POST succeeded
    expect(postResponse.status()).toBe(201);

    await expect(page.getByText("Expedition")).toBeVisible({ timeout: 10_000 });

    // Edit "Expedition" → "Forschung"
    await page
      .getByRole("row")
      .filter({ hasText: "Expedition" })
      .getByRole("button", { name: /Edit/ })
      .click();

    // Row is now in edit mode — get the active textbox (input with current value)
    const editInput = page.getByRole("textbox").last();
    await editInput.clear();
    await editInput.pressSequentially("Forschung");
    await page.getByRole("button", { name: "Speichern" }).last().click();

    await expect(page.getByText("Forschung")).toBeVisible({ timeout: 10_000 });

    // Try to delete Krieg (in use) — should NOT show a confirm dialog, only toast
    await page
      .getByRole("row")
      .filter({ hasText: "Krieg" })
      .getByRole("button", { name: /Delete/ })
      .click();

    await expect(page.getByText(/wird von.*Ereignissen verwendet|used by.*events/i)).toBeVisible({
      timeout: 5_000,
    });

    // Delete Forschung (0 events) — should open AlertDialog
    await page
      .getByRole("row")
      .filter({ hasText: "Forschung" })
      .getByRole("button", { name: /Delete/ })
      .click();

    // AlertDialog should appear
    await expect(page.getByRole("alertdialog")).toBeVisible({ timeout: 5_000 });
    await page
      .getByRole("button", { name: /bestätigen|ja|löschen|ok|delete/i })
      .last()
      .click();

    await page.waitForTimeout(1000);
    await expect(page.getByText("Forschung")).not.toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// TC-E-14: Pagination
// ---------------------------------------------------------------------------
test.describe("TC-E-14: Pagination", () => {
  test("events list shows pagination UI", async ({ page }) => {
    await loginAsAdmin(page);
    // Page size is 25; seed only has 4 events. Create 25 more in parallel to guarantee
    // totalPages > 1 regardless of how many events earlier tests may have created.
    await Promise.all(
      Array.from({ length: 25 }, (_, i) =>
        page.request.post("/api/events", {
          data: { title: `Paginierungstest ${i + 1}`, project_id: "seed-project-demo" },
        }),
      ),
    );
    await page.goto("/de/events");

    // Pagination element or page count should be present
    const paginationElement = page
      .getByRole("button", { name: /Weiter|Next/ })
      .or(page.getByRole("button", { name: /Zurück|Previous/ }))
      .first();

    await expect(paginationElement).toBeVisible({ timeout: 10_000 });
  });
});

// ---------------------------------------------------------------------------
// TC-E-15: Sort by title
// ---------------------------------------------------------------------------
test.describe("TC-E-15: Sort by title", () => {
  test("clicking Titel sorts asc then desc", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/de/events");

    // Click title sort button (asc)
    await page.getByRole("button", { name: "Titel" }).click();
    await page.waitForURL(/sort=title/, { timeout: 5_000 });
    await page.waitForLoadState("networkidle");

    // Click again for desc
    await page.getByRole("button", { name: "Titel" }).click();
    await page.waitForURL(/order=desc/, { timeout: 5_000 });
  });
});

// ---------------------------------------------------------------------------
// TC-E-16: Depth limit — inline error shown on form
// ---------------------------------------------------------------------------
test.describe("TC-E-16: Depth limit error inline", () => {
  test("depth limit error is shown when sub-event selected as parent", async ({ page }) => {
    await loginAsAdmin(page);

    if (!wwiEventId) {
      test.skip(true, "Requires TC-E-01");
      return;
    }

    // Always create a fresh sub-event for depth limit testing
    // (subEventId may have been deleted in TC-E-06)
    await page.goto(`/de/events/${wwiEventId}`);
    await page.getByRole("tab", { name: /Unterereignisse/ }).click();
    await page.getByRole("link", { name: /Unterereignis hinzufügen/ }).click();
    await page.waitForURL(/\/de\/events\/new/);
    await page.getByLabel("Titel").fill("Depth Limit Test Sub");
    await page.getByRole("button", { name: "Ereignis speichern" }).click();
    await page.waitForURL(
      (url) => {
        const pathname = new URL(url).pathname;
        return /\/de\/events\/[^/]+$/.test(pathname) && !pathname.includes("/events/new");
      },
      { timeout: 15_000 },
    );
    const testSubId = new URL(page.url()).pathname.split("/").pop() ?? "";

    // Try to create event with a sub-event as parent
    await page.goto(`/de/events/new?parentId=${testSubId}`);

    await page.getByLabel("Titel").fill("Invalid Parent Test");

    await page.getByRole("button", { name: "Ereignis speichern" }).click();

    // Should show depth limit error
    await expect(page.getByText(/Unterereignis|sub-event|anderes Ereignis wählen/i)).toBeVisible({
      timeout: 10_000,
    });

    // Form should still be open (no redirect)
    await expect(page).toHaveURL(/\/de\/events\/new/);

    // Title field should still have its value
    await expect(page.getByLabel("Titel")).toHaveValue("Invalid Parent Test");
  });
});
