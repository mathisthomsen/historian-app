import { readFile } from "node:fs/promises";

import {
  type APIRequestContext,
  type BrowserContext,
  type Download,
  type Page,
  expect,
  test,
} from "@playwright/test";

import {
  resetRateLimits,
  countTestEntityActivity,
  createTestUser,
  deleteTestProjects,
  deleteTestUser,
} from "./helpers/db";

/**
 * Project export, end to end (#139, plan T6; spec docs/specs/pre-alpha-project-export).
 *
 * Method: two real users, each signed in through the real login form in their
 * own browser context, against a production build and a real Postgres. This is
 * the only layer that can observe the premises the unit tests mock away:
 *
 *   P1  membership is the only read grant, and the route enforces it — a unit
 *       test with a mocked membership cannot observe a missing `where`.
 *   P3  a read through `prisma` returns soft-deleted rows.
 *   P4  every exported value survives `JSON.stringify` and a real `JSON.parse`.
 *   P7  `REPEATABLE READ` works on the real connection the app uses.
 *   P11 each user gets their own, distinct project. Asserted first: if both
 *       users shared a project (or had none), the cross-tenant test would pass
 *       without testing anything.
 *
 * A's data is written through A's own session (the app's API with A's cookies),
 * so every row carries real ownership, activity rows and soft-delete behaviour.
 * The export is then fetched two ways: the dashboard button (what a researcher
 * does) and `context.request` with that context's cookies (header and
 * cross-tenant assertions).
 *
 * Rate limit: the route allows 5 exports per user per 10 minutes. Each user
 * makes well under that over the whole file, so the limit is never what a test
 * is observing.
 */

const SPECIAL = `Müller & Söhne <b>"x"</b> 'y'`;
const PASSWORD = "ValidP@ss1";

const uid = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
const emailA = `e2e-export-a-${uid}@test.local`;
const emailB = `e2e-export-b-${uid}@test.local`;

const TABLE_KEYS = [
  "persons",
  "person_names",
  "events",
  "event_types",
  "sources",
  "locations",
  "literature",
  "relation_types",
  "relations",
  "relation_evidence",
  "property_evidence",
  "entity_activity",
] as const;

type Row = Record<string, unknown>;
interface ExportFile {
  format: string;
  format_version: number;
  exported_at: string;
  app_version: string;
  schema_migration: string | null;
  project: Row;
  tables: Record<(typeof TABLE_KEYS)[number], Row[]>;
  counts: Record<(typeof TABLE_KEYS)[number], number>;
}

let contextA: BrowserContext;
let contextB: BrowserContext;
let pageA: Page;
let pageB: Page;

let projectA = "";
let projectB = "";
// Everything A owns, by id. Cross-tenant assertions search B's responses for
// each of these.
const idsA: Record<string, string> = {};
let personBId = "";

test.describe.configure({ mode: "serial" });

test.beforeEach(async () => {
  await resetRateLimits();
});

/** Sign in through the real form. */
async function login(page: Page, email: string): Promise<void> {
  await page.goto("/de/auth/login");
  await page.getByLabel("E-Mail").fill(email);
  await page.getByLabel("Passwort", { exact: true }).fill(PASSWORD);
  await page.getByRole("button", { name: "Anmelden" }).click();
  await page.waitForURL(/\/de\/dashboard/, { timeout: 15_000 });
}

/** The project id the dashboard's export link points at (what the session carries). */
async function dashboardProjectId(page: Page, locale: "de" | "en"): Promise<string> {
  await page.goto(`/${locale}/dashboard`);
  const name = locale === "de" ? "Projekt exportieren" : "Export project";
  const href = await page.getByRole("link", { name }).getAttribute("href");
  const match = /^\/api\/projects\/([^/]+)\/export$/.exec(href ?? "");
  expect(match, `export link href was ${String(href)}`).not.toBeNull();
  return match![1]!;
}

/** POST through a user's own session and return the created row's id. */
async function create(
  request: APIRequestContext,
  path: string,
  data: Record<string, unknown>,
): Promise<string> {
  const res = await request.post(path, { data });
  expect(res.status(), `POST ${path}: ${await res.text()}`).toBe(201);
  const body = (await res.json()) as { id: string };
  expect(body.id).toBeTruthy();
  return body.id;
}

/** Click the dashboard's export link and return the parsed file and the raw text. */
async function downloadViaButton(
  page: Page,
  locale: "de" | "en",
): Promise<{ download: Download; text: string; file: ExportFile }> {
  await page.goto(`/${locale}/dashboard`);
  const name = locale === "de" ? "Projekt exportieren" : "Export project";
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("link", { name }).click();
  const download = await downloadPromise;
  expect(await download.failure()).toBeNull();
  const path = await download.path();
  const text = await readFile(path, "utf8");
  return { download, text, file: JSON.parse(text) as ExportFile };
}

function byId(rows: Row[], id: string): Row {
  const row = rows.find((r) => r["id"] === id);
  expect(row, `no row with id ${id}`).toBeDefined();
  return row!;
}

test.beforeAll(async ({ browser }) => {
  const baseURL = test.info().project.use.baseURL ?? "http://localhost:3000";
  await resetRateLimits();
  await createTestUser(emailA, PASSWORD);
  await createTestUser(emailB, PASSWORD);

  contextA = await browser.newContext({ baseURL });
  contextB = await browser.newContext({ baseURL });
  pageA = await contextA.newPage();
  pageB = await contextB.newPage();

  await login(pageA, emailA);
  await login(pageB, emailB);
  projectA = await dashboardProjectId(pageA, "de");
  projectB = await dashboardProjectId(pageB, "de");
  idsA["project"] = projectA;

  // --- A's data, written through A's session -------------------------------
  const a = contextA.request;

  // A person with a partial date (year only; death: year and month) and certainty.
  idsA["person"] = await create(a, "/api/persons", {
    project_id: projectA,
    first_name: "Anna",
    last_name: SPECIAL,
    birth_year: 1848,
    birth_date_certainty: "POSSIBLE",
    death_year: 1901,
    death_month: 5,
    death_date_certainty: "PROBABLE",
    names: [{ name: SPECIAL, language: "de", is_primary: true }],
  });

  // A second person, soft-deleted after a relation points at it.
  idsA["deletedPerson"] = await create(a, "/api/persons", {
    project_id: projectA,
    first_name: "Berta",
    last_name: "Gelöscht",
  });

  idsA["event"] = await create(a, "/api/events", {
    project_id: projectA,
    title: `Briefwechsel ${SPECIAL}`,
    start_year: 1850,
    start_month: 3,
    start_date_certainty: "PROBABLE",
  });

  idsA["source"] = await create(a, "/api/sources", {
    project_id: projectA,
    title: `Nachlass ${SPECIAL}`,
    type: "letter",
    reliability: "HIGH",
  });

  idsA["relationType"] = await create(a, "/api/relation-types", {
    project_id: projectA,
    name: `Korrespondenzpartner ${uid}`,
    inverse_name: `Korrespondenzpartner ${uid}`,
    valid_from_types: ["PERSON"],
    valid_to_types: ["PERSON"],
  });

  idsA["relation"] = await create(a, "/api/relations", {
    project_id: projectA,
    from_type: "PERSON",
    from_id: idsA["person"],
    to_type: "PERSON",
    to_id: idsA["deletedPerson"],
    relation_type_id: idsA["relationType"],
    certainty: "PROBABLE",
  });

  idsA["relationEvidence"] = await create(a, `/api/relations/${idsA["relation"]}/evidence`, {
    source_id: idsA["source"],
    quote: SPECIAL,
    page_reference: "S. 12",
    confidence: "PROBABLE",
  });

  idsA["propertyEvidence"] = await create(a, "/api/property-evidence", {
    project_id: projectA,
    entity_type: "PERSON",
    entity_id: idsA["person"],
    property: "birth_year",
    source_id: idsA["source"],
    quote: SPECIAL,
    confidence: "POSSIBLE",
  });

  const del = await a.delete(`/api/persons/${idsA["deletedPerson"]}`);
  expect(del.status(), await del.text()).toBe(200);

  // B gets one person of their own, so "B's export holds none of A's ids" is
  // not satisfied by an export that is simply empty.
  personBId = await create(contextB.request, "/api/persons", {
    project_id: projectB,
    first_name: "Bruno",
    last_name: "Eigener",
  });
});

test.afterAll(async () => {
  await contextA?.close();
  await contextB?.close();
  // Projects first: deleting a user removes only the membership (#165 review).
  await deleteTestProjects([projectA, projectB]);
  await deleteTestUser(emailA);
  await deleteTestUser(emailB);
});

test.describe("Project export", () => {
  test("two users have two distinct, non-null projects (P11)", () => {
    expect(projectA).toBeTruthy();
    expect(projectB).toBeTruthy();
    expect(projectA).not.toBe(projectB);
  });

  test("A downloads the export from the dashboard in German", async () => {
    const { download, text, file } = await downloadViaButton(pageA, "de");

    expect(download.suggestedFilename()).toMatch(
      /^evidoxa-export-[a-z0-9-]+-\d{4}-\d{2}-\d{2}\.json$/,
    );

    // Top-level shape, spec §2.
    expect(Object.keys(file).sort()).toEqual(
      [
        "app_version",
        "counts",
        "exported_at",
        "format",
        "format_version",
        "project",
        "schema_migration",
        "tables",
      ].sort(),
    );
    expect(file.format).toBe("evidoxa-project-export");
    expect(file.format_version).toBe(1);
    expect(new Date(file.exported_at).toISOString()).toBe(file.exported_at);
    expect(typeof file.app_version).toBe("string");
    expect(file.project["id"]).toBe(projectA);
    expect(Object.keys(file.tables).sort()).toEqual([...TABLE_KEYS].sort());
    expect(Object.keys(file.counts).sort()).toEqual([...TABLE_KEYS].sort());

    // `counts` is a check on completeness: it must equal what the file holds.
    for (const key of TABLE_KEYS) {
      expect(Array.isArray(file.tables[key]), key).toBe(true);
      expect(file.counts[key], key).toBe(file.tables[key].length);
    }

    // Partial date and certainty exactly as stored (P4: structured, not strings).
    const person = byId(file.tables.persons, idsA["person"]!);
    expect(person).toMatchObject({
      project_id: projectA,
      birth_year: 1848,
      birth_month: null,
      birth_day: null,
      birth_date_certainty: "POSSIBLE",
      death_year: 1901,
      death_month: 5,
      death_day: null,
      death_date_certainty: "PROBABLE",
      deleted_at: null,
    });

    // A soft-deleted row is present, with `deleted_at` set (P3, spec X2).
    const deleted = byId(file.tables.persons, idsA["deletedPerson"]!);
    expect(typeof deleted["deleted_at"]).toBe("string");
    expect(Number.isNaN(Date.parse(deleted["deleted_at"] as string))).toBe(false);
    expect(file.tables.persons).toHaveLength(2);

    // The rest of what A wrote.
    expect(file.tables.person_names).toHaveLength(1);
    expect(file.tables.person_names[0]).toMatchObject({
      person_id: idsA["person"],
      name: SPECIAL,
      language: "de",
    });
    expect(byId(file.tables.events, idsA["event"]!)).toMatchObject({
      start_year: 1850,
      start_month: 3,
      start_day: null,
      start_date_certainty: "PROBABLE",
    });
    expect(byId(file.tables.sources, idsA["source"]!)).toMatchObject({ type: "letter" });
    expect(byId(file.tables.relation_types, idsA["relationType"]!)).toMatchObject({
      valid_from_types: ["PERSON"],
      valid_to_types: ["PERSON"],
    });
    expect(byId(file.tables.relations, idsA["relation"]!)).toMatchObject({
      from_id: idsA["person"],
      to_id: idsA["deletedPerson"],
      relation_type_id: idsA["relationType"],
      certainty: "PROBABLE",
    });

    // Evidence, relation-level and property-level.
    expect(byId(file.tables.relation_evidence, idsA["relationEvidence"]!)).toMatchObject({
      relation_id: idsA["relation"],
      source_id: idsA["source"],
      page_reference: "S. 12",
      quote: SPECIAL,
      confidence: "PROBABLE",
    });
    expect(byId(file.tables.property_evidence, idsA["propertyEvidence"]!)).toMatchObject({
      entity_id: idsA["person"],
      property: "birth_year",
      source_id: idsA["source"],
      quote: SPECIAL,
      confidence: "POSSIBLE",
    });

    // Activity snapshots stay embedded JSON, not strings.
    const snapshots = file.tables.entity_activity
      .map((r) => r["new_value"])
      .filter((v) => v !== null && v !== undefined);
    expect(snapshots.length).toBeGreaterThan(0);
    for (const snapshot of snapshots) expect(typeof snapshot).toBe("object");

    // Text is exactly as typed: no HTML entities anywhere, in the raw file.
    expect(file.tables.persons.map((p) => p["last_name"])).toContain(SPECIAL);
    expect(file.tables.events.map((e) => e["title"])).toContain(`Briefwechsel ${SPECIAL}`);
    expect(file.tables.sources.map((s) => s["title"])).toContain(`Nachlass ${SPECIAL}`);
    expect(text).toContain("Müller & Söhne <b>");
    expect(text).not.toMatch(/&(amp|lt|gt|quot|#\d+|#x[0-9a-f]+|apos);/i);
  });

  test("A downloads the same project in English", async () => {
    const { download, file } = await downloadViaButton(pageA, "en");
    expect(download.suggestedFilename()).toMatch(
      /^evidoxa-export-[a-z0-9-]+-\d{4}-\d{2}-\d{2}\.json$/,
    );
    expect(file.project["id"]).toBe(projectA);
    expect(byId(file.tables.persons, idsA["deletedPerson"]!)["deleted_at"]).not.toBeNull();
    expect(file.tables.persons.map((p) => p["last_name"])).toContain(SPECIAL);
    for (const key of TABLE_KEYS) expect(file.counts[key], key).toBe(file.tables[key].length);
  });

  test("response headers are exactly the contract", async () => {
    // Asked for identity encoding: the claim under test is the route's own
    // `Content-Length`, which a compressing proxy would legitimately replace.
    const res = await contextA.request.get(`/api/projects/${projectA}/export`, {
      headers: { "Accept-Encoding": "identity" },
    });
    expect(res.status()).toBe(200);
    const headers = res.headers();
    expect(headers["content-type"]).toBe("application/json; charset=utf-8");
    expect(headers["content-disposition"]).toMatch(
      /^attachment; filename="evidoxa-export-[a-z0-9-]+-\d{4}-\d{2}-\d{2}\.json"$/,
    );
    expect(headers["cache-control"]).toBe("no-store");
    const body = await res.body();
    expect(headers["content-length"]).toBe(String(body.byteLength));
    expect(JSON.parse(body.toString("utf8")).project.id).toBe(projectA);
  });

  test("B cannot read A's export: a uniform 404 that leaks no id (P1)", async () => {
    const asB = contextB.request;
    const refused = await asB.get(`/api/projects/${projectA}/export`);
    expect(refused.status()).toBe(404);
    const refusedBody = await refused.body();
    const refusedText = refusedBody.toString("utf8");
    for (const [name, id] of Object.entries(idsA)) {
      expect(refusedText.includes(id), `404 body leaks A's ${name} id`).toBe(false);
    }

    // The same bytes as for a project that does not exist: the 404 does not
    // confirm A's project is there.
    const randomId = `c${Array.from({ length: 24 }, () =>
      Math.floor(Math.random() * 36).toString(36),
    ).join("")}`;
    const missing = await asB.get(`/api/projects/${randomId}/export`);
    expect(missing.status()).toBe(404);
    expect(refusedBody.equals(await missing.body())).toBe(true);
    expect(refused.headers()["content-type"]).toBe(missing.headers()["content-type"]);

    // B's own export is theirs, and holds nothing of A's.
    const own = await asB.get(`/api/projects/${projectB}/export`);
    expect(own.status()).toBe(200);
    const ownText = await own.text();
    const ownFile = JSON.parse(ownText) as ExportFile;
    expect(ownFile.project["id"]).toBe(projectB);
    expect(ownFile.tables.persons.map((p) => p["id"])).toEqual([personBId]);
    for (const [name, id] of Object.entries(idsA)) {
      expect(ownText.includes(id), `B's export leaks A's ${name} id`).toBe(false);
    }
    expect(ownText).not.toContain("Müller");
    expect(ownText).not.toContain("Gelöscht");
    for (const key of TABLE_KEYS) expect(ownFile.counts[key], key).toBe(ownFile.tables[key].length);
  });

  test("an anonymous request gets 401", async ({ request }) => {
    const res = await request.get(`/api/projects/${projectA}/export`);
    expect(res.status()).toBe(401);
    const text = await res.text();
    for (const [name, id] of Object.entries(idsA)) {
      expect(text.includes(id), `401 body leaks A's ${name} id`).toBe(false);
    }
  });

  test("exporting writes no activity", async () => {
    const before = await countTestEntityActivity(projectA);
    expect(before).toBeGreaterThan(0);

    const res = await contextA.request.get(`/api/projects/${projectA}/export`);
    expect(res.status()).toBe(200);
    const file = (await res.json()) as ExportFile;

    // Measured from Postgres, not from the route under test, and the export's
    // own count agrees with the database.
    expect(await countTestEntityActivity(projectA)).toBe(before);
    expect(file.counts.entity_activity).toBe(before);
  });
});
