/**
 * App Pages — Design System Composition Tests
 * Spec: /docs/implementation/05-pages/page-composition-spec.md §§3–9
 *
 * Tests are organized into two groups:
 *
 * Group A (component pattern tests): Verify that the design system building
 *   blocks (Breadcrumb, page-container) work correctly when composed.
 *   These pass immediately — they test the components, not page files.
 *
 * Group B (page file content tests): Verify that each actual page file
 *   contains the required design system patterns (page-container class,
 *   tracking-tight on h1, breadcrumb imports on detail/edit pages).
 *   These FAIL before implementation and PASS after.
 *
 * Why file-content tests? App pages are async Server Components with DB calls
 * and auth guards that cannot be rendered in jsdom. File-content checks are
 * the correct strategy for verifying design system adoption in Server Components.
 */

import { readFileSync } from "fs";
import { join } from "path";

import { describe, expect, it, vi } from "vitest";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { renderWithProviders } from "@/test/render";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  usePathname: () => "/de/persons",
  useParams: () => ({ locale: "de" }),
}));

vi.mock("next-intl", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    useLocale: () => "de",
    useTranslations: () => (key: string) => key,
  };
});

// ---------------------------------------------------------------------------
// Helper: read page file
// ---------------------------------------------------------------------------

const APP_PAGES_DIR = join(process.cwd(), "src/app/[locale]/(app)");
const AUTH_PAGES_DIR = join(process.cwd(), "src/app/[locale]/(auth)");

function readPage(relativePath: string): string {
  return readFileSync(join(APP_PAGES_DIR, relativePath), "utf-8");
}

// ---------------------------------------------------------------------------
// Group A — Component pattern tests (verify design system primitives)
// ---------------------------------------------------------------------------

describe("Design system component patterns (Group A)", () => {
  it("DS-PAGE-APP-01: Breadcrumb renders <nav aria-label='Breadcrumb'>", () => {
    const { container } = renderWithProviders(
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/de/persons">Personen</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator>/</BreadcrumbSeparator>
          <BreadcrumbItem>
            <BreadcrumbPage>Johann von Dalberg</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>,
    );
    const nav = container.querySelector("nav[aria-label='Breadcrumb']");
    expect(nav).not.toBeNull();
  });

  it("DS-PAGE-APP-02: BreadcrumbPage has aria-current='page'", () => {
    const { container } = renderWithProviders(
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage>Current Page</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>,
    );
    const current = container.querySelector("[aria-current='page']");
    expect(current).not.toBeNull();
    expect(current!.textContent).toBe("Current Page");
  });

  it("DS-PAGE-APP-03: BreadcrumbSeparator has aria-hidden='true' role='presentation'", () => {
    const { container } = renderWithProviders(
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/a">A</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator>/</BreadcrumbSeparator>
          <BreadcrumbItem>
            <BreadcrumbPage>B</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>,
    );
    const sep = container.querySelector("[role='presentation'][aria-hidden='true']");
    expect(sep).not.toBeNull();
  });

  it("DS-PAGE-APP-04: BreadcrumbLink has text-muted-foreground class", () => {
    const { container } = renderWithProviders(
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/de/persons">Personen</BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>,
    );
    const link = container.querySelector("a");
    expect(link!.className).toContain("text-muted-foreground");
  });

  it("DS-PAGE-APP-05: BreadcrumbPage has font-medium text-foreground classes", () => {
    const { container } = renderWithProviders(
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage>Detail Page</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>,
    );
    const current = container.querySelector("[aria-current='page']");
    expect(current!.className).toContain("font-medium");
    expect(current!.className).toContain("text-foreground");
  });

  it("DS-PAGE-APP-06: mobile-hidden breadcrumb wrapper uses hidden md:block", () => {
    const { container } = renderWithProviders(
      <div className="hidden md:block">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/de/persons">Personen</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator>/</BreadcrumbSeparator>
            <BreadcrumbItem>
              <BreadcrumbPage>Detail</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>,
    );
    const wrapper = container.querySelector(".hidden.md\\:block");
    expect(wrapper).not.toBeNull();
  });

  it("DS-PAGE-APP-07: page-container pattern renders children with correct classes", () => {
    const { container } = renderWithProviders(
      <div className="page-container mx-auto space-y-6">
        <h1 className="text-foreground text-2xl font-bold tracking-tight">Test</h1>
      </div>,
    );
    const wrapper = container.querySelector(".page-container");
    expect(wrapper).not.toBeNull();
    expect(wrapper!.className).toContain("mx-auto");
    expect(wrapper!.className).toContain("space-y-6");
  });

  it("DS-PAGE-APP-08: i18n key persons.title exists in both de and en", async () => {
    const de = await import("../../../messages/de.json");
    const en = await import("../../../messages/en.json");
    expect(de.default.persons.title).toBeTruthy();
    expect(en.default.persons.title).toBeTruthy();
  });

  it("DS-PAGE-APP-09: i18n key events.title exists in both de and en", async () => {
    const de = await import("../../../messages/de.json");
    const en = await import("../../../messages/en.json");
    expect(de.default.events.title).toBeTruthy();
    expect(en.default.events.title).toBeTruthy();
  });

  it("DS-PAGE-APP-10: i18n key sources.title exists in both de and en", async () => {
    const de = await import("../../../messages/de.json");
    const en = await import("../../../messages/en.json");
    expect(de.default.sources.title).toBeTruthy();
    expect(en.default.sources.title).toBeTruthy();
  });

  it("DS-PAGE-APP-11: i18n key relations.title exists in both de and en", async () => {
    const de = await import("../../../messages/de.json");
    const en = await import("../../../messages/en.json");
    expect(de.default.relations.title).toBeTruthy();
    expect(en.default.relations.title).toBeTruthy();
  });

  it("DS-PAGE-APP-12: i18n key relationTypes.title exists in both de and en", async () => {
    const de = await import("../../../messages/de.json");
    const en = await import("../../../messages/en.json");
    expect(de.default.relationTypes.title).toBeTruthy();
    expect(en.default.relationTypes.title).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// Group B — Page file content tests (verify actual page source files)
// ---------------------------------------------------------------------------

describe("Page file — page-container class (Group B)", () => {
  it("DS-PAGE-FILE-01: dashboard/page.tsx uses page-container class", () => {
    const src = readPage("dashboard/page.tsx");
    expect(src).toContain("page-container");
  });

  it("DS-PAGE-FILE-02: persons/page.tsx uses page-container class", () => {
    const src = readPage("persons/page.tsx");
    expect(src).toContain("page-container");
  });

  it("DS-PAGE-FILE-03: events/page.tsx uses page-container class", () => {
    const src = readPage("events/page.tsx");
    expect(src).toContain("page-container");
  });

  it("DS-PAGE-FILE-04: sources/page.tsx uses page-container class", () => {
    const src = readPage("sources/page.tsx");
    expect(src).toContain("page-container");
  });

  it("DS-PAGE-FILE-05: relations/page.tsx uses page-container class", () => {
    const src = readPage("relations/page.tsx");
    expect(src).toContain("page-container");
  });

  it("DS-PAGE-FILE-06: settings/event-types/page.tsx uses page-container class", () => {
    const src = readPage("settings/event-types/page.tsx");
    expect(src).toContain("page-container");
  });

  it("DS-PAGE-FILE-07: settings/relation-types/page.tsx uses page-container class", () => {
    const src = readPage("settings/relation-types/page.tsx");
    expect(src).toContain("page-container");
  });

  it("DS-PAGE-FILE-08: persons/new/page.tsx uses page-container class", () => {
    const src = readPage("persons/new/page.tsx");
    expect(src).toContain("page-container");
  });

  it("DS-PAGE-FILE-09: persons/[id]/page.tsx uses page-container class", () => {
    const src = readPage("persons/[id]/page.tsx");
    expect(src).toContain("page-container");
  });

  it("DS-PAGE-FILE-10: persons/[id]/edit/page.tsx uses page-container class", () => {
    const src = readPage("persons/[id]/edit/page.tsx");
    expect(src).toContain("page-container");
  });

  it("DS-PAGE-FILE-11: sources/new/page.tsx uses page-container class", () => {
    const src = readPage("sources/new/page.tsx");
    expect(src).toContain("page-container");
  });

  it("DS-PAGE-FILE-12: sources/[id]/page.tsx uses page-container class", () => {
    const src = readPage("sources/[id]/page.tsx");
    expect(src).toContain("page-container");
  });

  it("DS-PAGE-FILE-13: sources/[id]/edit/page.tsx uses page-container class", () => {
    const src = readPage("sources/[id]/edit/page.tsx");
    expect(src).toContain("page-container");
  });

  it("DS-PAGE-FILE-14: events/[id]/page.tsx uses page-container class", () => {
    const src = readPage("events/[id]/page.tsx");
    expect(src).toContain("page-container");
  });
});

describe("Page file — h1 heading classes (Group B)", () => {
  it("DS-PAGE-FILE-15: dashboard/page.tsx h1 has tracking-tight text-foreground", () => {
    const src = readPage("dashboard/page.tsx");
    expect(src).toContain("tracking-[-0.02em]");
  });

  it("DS-PAGE-FILE-16: persons/page.tsx h1 has tracking-tight text-foreground", () => {
    const src = readPage("persons/page.tsx");
    expect(src).toContain("tracking-[-0.02em]");
    expect(src).toContain("text-foreground");
  });

  it("DS-PAGE-FILE-17: events/page.tsx h1 has tracking-tight text-foreground", () => {
    const src = readPage("events/page.tsx");
    expect(src).toContain("tracking-[-0.02em]");
    expect(src).toContain("text-foreground");
  });

  it("DS-PAGE-FILE-18: sources/page.tsx h1 has tracking-tight text-foreground", () => {
    const src = readPage("sources/page.tsx");
    expect(src).toContain("tracking-[-0.02em]");
    expect(src).toContain("text-foreground");
  });

  it("DS-PAGE-FILE-19: relations/page.tsx h1 has tracking-tight text-foreground", () => {
    const src = readPage("relations/page.tsx");
    expect(src).toContain("tracking-[-0.02em]");
    expect(src).toContain("text-foreground");
  });

  it("DS-PAGE-FILE-20: persons/[id]/page.tsx h1 has tracking-tight text-foreground", () => {
    const src = readPage("persons/[id]/page.tsx");
    expect(src).toContain("tracking-[-0.02em]");
    expect(src).toContain("text-foreground");
  });

  it("DS-PAGE-FILE-21: persons/new/page.tsx h1 has tracking-tight", () => {
    const src = readPage("persons/new/page.tsx");
    expect(src).toContain("tracking-[-0.02em]");
  });

  it("DS-PAGE-FILE-22: persons/[id]/edit/page.tsx h1 has tracking-tight", () => {
    const src = readPage("persons/[id]/edit/page.tsx");
    expect(src).toContain("tracking-[-0.02em]");
  });

  it("DS-PAGE-FILE-23: sources/new/page.tsx h1 has tracking-tight", () => {
    const src = readPage("sources/new/page.tsx");
    expect(src).toContain("tracking-[-0.02em]");
  });

  it("DS-PAGE-FILE-24: sources/[id]/edit/page.tsx h1 has tracking-tight", () => {
    const src = readPage("sources/[id]/edit/page.tsx");
    expect(src).toContain("tracking-[-0.02em]");
  });
});

describe("Page file — breadcrumb on detail and edit pages (Group B)", () => {
  it("DS-PAGE-FILE-25: persons/[id]/page.tsx imports Breadcrumb components", () => {
    const src = readPage("persons/[id]/page.tsx");
    expect(src).toContain("Breadcrumb");
    expect(src).toContain("BreadcrumbLink");
    expect(src).toContain("BreadcrumbPage");
  });

  it("DS-PAGE-FILE-26: persons/[id]/page.tsx breadcrumb has hidden md:block wrapper", () => {
    const src = readPage("persons/[id]/page.tsx");
    expect(src).toContain("hidden md:block");
  });

  it("DS-PAGE-FILE-27: persons/[id]/edit/page.tsx imports Breadcrumb components", () => {
    const src = readPage("persons/[id]/edit/page.tsx");
    expect(src).toContain("Breadcrumb");
    expect(src).toContain("hidden md:block");
  });

  it("DS-PAGE-FILE-28: sources/[id]/page.tsx imports Breadcrumb components", () => {
    const src = readPage("sources/[id]/page.tsx");
    expect(src).toContain("Breadcrumb");
    expect(src).toContain("hidden md:block");
  });

  it("DS-PAGE-FILE-29: sources/[id]/edit/page.tsx imports Breadcrumb components", () => {
    const src = readPage("sources/[id]/edit/page.tsx");
    expect(src).toContain("Breadcrumb");
    expect(src).toContain("hidden md:block");
  });

  it("DS-PAGE-FILE-30: events/[id]/page.tsx imports Breadcrumb components", () => {
    const src = readPage("events/[id]/page.tsx");
    expect(src).toContain("Breadcrumb");
    expect(src).toContain("hidden md:block");
  });

  it("DS-PAGE-FILE-31: persons/new/page.tsx has breadcrumb pattern", () => {
    const src = readPage("persons/new/page.tsx");
    expect(src).toContain("Breadcrumb");
    expect(src).toContain("hidden md:block");
  });

  it("DS-PAGE-FILE-32: sources/new/page.tsx has breadcrumb pattern", () => {
    const src = readPage("sources/new/page.tsx");
    expect(src).toContain("Breadcrumb");
    expect(src).toContain("hidden md:block");
  });
});

describe("Auth layout — brand h1 (Group B)", () => {
  it("DS-PAGE-FILE-33: auth layout has h1 with Evidoxa brand name", () => {
    const src = readFileSync(join(AUTH_PAGES_DIR, "layout.tsx"), "utf-8");
    expect(src).toContain("<h1");
    expect(src).toContain("Evidoxa");
  });

  it("DS-PAGE-FILE-34: auth layout h1 has tracking-tight class", () => {
    const src = readFileSync(join(AUTH_PAGES_DIR, "layout.tsx"), "utf-8");
    expect(src).toContain("tracking-[-0.02em]");
  });
});
