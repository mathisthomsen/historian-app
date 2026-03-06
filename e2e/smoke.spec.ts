import { expect, test } from "@playwright/test";

test.describe("TC-01: Root redirect", () => {
  test("/ redirects to /de", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/de/);
  });
});

test.describe("TC-02: German locale shell", () => {
  test("/de renders app shell with DE content", async ({ page }) => {
    await page.goto("/de");
    await expect(page.locator("header")).toBeVisible();
    await expect(page.getByText("Evidoxa")).toBeVisible();
    await expect(page.getByRole("navigation")).toBeVisible();
    await expect(page.getByText("Dashboard")).toBeVisible();
    await expect(page.getByText("Personen")).toBeVisible();
  });
});

test.describe("TC-03: English locale shell", () => {
  test("/en renders app shell with EN content", async ({ page }) => {
    await page.goto("/en");
    await expect(page.getByText("Persons")).toBeVisible();
    await expect(page.getByText("Events")).toBeVisible();
  });
});

test.describe("TC-04: Language switcher DE → EN", () => {
  test("clicking EN navigates to /en and changes text", async ({ page }) => {
    await page.goto("/de");
    await page.getByRole("button", { name: /^EN$/i }).first().click();
    await expect(page).toHaveURL(/\/en/);
    await expect(page.getByText("Persons")).toBeVisible();
  });

  test("switching to EN sets NEXT_LOCALE cookie", async ({ page, context }) => {
    await page.goto("/de");
    await page.getByRole("button", { name: /^EN$/i }).first().click();
    await page.waitForURL(/\/en/);

    const cookies = await context.cookies();
    const localeCookie = cookies.find((c) => c.name === "NEXT_LOCALE");
    expect(localeCookie?.value).toBe("en");
  });
});

test.describe("TC-05: Language switcher EN → DE", () => {
  test("clicking DE from EN navigates back to /de", async ({ page }) => {
    await page.goto("/en");
    await page.getByRole("button", { name: /^DE$/i }).first().click();
    await expect(page).toHaveURL(/\/de/);
    await expect(page.getByText("Personen")).toBeVisible();
  });
});

test.describe("TC-07: Component showcase", () => {
  test("/de/dev/showcase renders without errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });

    await page.goto("/de/dev/showcase");
    await expect(page.getByText("Komponentenübersicht")).toBeVisible();

    // Check all sections exist
    await expect(page.getByText("Schaltflächen")).toBeVisible();
    await expect(page.getByText("Eingabefelder")).toBeVisible();
    await expect(page.getByText("Abzeichen")).toBeVisible();
    await expect(page.getByText("Karten")).toBeVisible();
    await expect(page.getByText("Dialoge")).toBeVisible();
    await expect(page.getByText("Registerkarten")).toBeVisible();
    await expect(page.getByText("Tabellen")).toBeVisible();
    await expect(page.getByText("Skelette")).toBeVisible();

    // Table with 5 rows
    const rows = page.locator("table tbody tr");
    await expect(rows).toHaveCount(5);

    expect(errors.filter((e) => !e.includes("Warning"))).toHaveLength(0);
  });
});

test.describe("TC-08: Dialog", () => {
  test("dialog opens and closes in showcase", async ({ page }) => {
    await page.goto("/de/dev/showcase");
    await page.getByRole("button", { name: "Open Dialog" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByText("Dialog Title")).toBeVisible();

    await page.getByRole("button", { name: "Close" }).click();
    await expect(page.getByRole("dialog")).not.toBeVisible();
  });
});

test.describe("TC-09: Dark mode toggle", () => {
  test("theme toggle applies/removes dark class on html", async ({ page }) => {
    await page.goto("/de");

    const html = page.locator("html");
    const initialClass = await html.getAttribute("class");

    await page.getByTestId("theme-toggle").click();
    await page.waitForTimeout(100); // allow transition

    const afterClass = await html.getAttribute("class");
    expect(afterClass).not.toBe(initialClass);
  });
});

test.describe("TC-11: Sidebar collapse", () => {
  test("sidebar collapses on toggle button click", async ({ page }) => {
    await page.goto("/de");

    const sidebar = page.locator("aside");
    await expect(sidebar).toBeVisible();

    // Sidebar should be expanded (w-56)
    const initialWidth = await sidebar.evaluate((el) => el.getBoundingClientRect().width);
    expect(initialWidth).toBeGreaterThan(100);

    // Click hamburger
    await page.getByTestId("sidebar-toggle").click();
    await page.waitForTimeout(300); // wait for transition

    const collapsedWidth = await sidebar.evaluate((el) => el.getBoundingClientRect().width);
    expect(collapsedWidth).toBeLessThan(initialWidth);
  });
});

test.describe("TC-13: 404 page", () => {
  test("non-existent route shows 404 page", async ({ page }) => {
    await page.goto("/de/this-route-does-not-exist-xyz");
    await expect(page.getByText("404")).toBeVisible();
    await expect(page.getByText(/Seite nicht gefunden|nicht gefunden/i)).toBeVisible();
  });
});

test.describe("TC-14: Tabs", () => {
  test("tab switching shows correct content", async ({ page }) => {
    await page.goto("/de/dev/showcase");

    await expect(page.getByText("Content of tab one.")).toBeVisible();
    await expect(page.getByText("Content of tab two.")).not.toBeVisible();

    await page.getByRole("tab", { name: "Tab Two" }).click();
    await expect(page.getByText("Content of tab two.")).toBeVisible();
    await expect(page.getByText("Content of tab one.")).not.toBeVisible();
  });
});
