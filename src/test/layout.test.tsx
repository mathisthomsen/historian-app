/**
 * Layout Pattern Tests — Layer 4
 * Spec: /docs/implementation/04-layouts/layout-spec.md
 *
 * Tests cover:
 * - DS-LAYOUT-01..10: AppShell landmark structure and CSS utility class usage
 * - DS-LAYOUT-11..20: Sidebar token classes, active indicator, collapsed state, ARIA
 * - DS-LAYOUT-21..27: TopBar token classes, landmark role, z-index, ARIA
 * - DS-LAYOUT-28..34: Breadcrumb structure, ARIA, mobile hiding
 * - DS-LAYOUT-35..44: Bottom Tab Bar structure, ARIA, desktop hiding, active state
 *
 * NOTE: jsdom does not compute CSS layout. Tests verify:
 *   - Correct semantic HTML structure (landmarks, roles)
 *   - Correct class names (as proxies for token usage — see test-strategy.md §9.2 exception:
 *     layout token classes ARE tested because they are the migration target of the inline style bug)
 *   - Correct ARIA attributes for accessibility
 */

import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AppShell } from "@/components/shell/app-shell";
import { BottomTabBar } from "@/components/shell/bottom-tab-bar";
import { Sidebar } from "@/components/shell/sidebar";
import { TopBar } from "@/components/shell/top-bar";
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
// Shared mocks — hoisted, so these run before any test or describe block
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
    useTranslations: () => (key: string) => {
      const map: Record<string, string> = {
        dashboard: "Dashboard",
        persons: "Personen",
        events: "Ereignisse",
        sources: "Quellen",
        relations: "Beziehungen",
        locations: "Orte",
        literature: "Literatur",
        settings: "Einstellungen",
        event_types: "Ereignistypen",
        relation_types: "Relationstypen",
        toggleSidebar: "Seitenleiste umschalten",
        toggleTheme: "Design wechseln",
        selectProject: "Projekt auswählen",
        userMenu: "Benutzermenü",
        bottomNav: "Untere Navigation",
      };
      return map[key] ?? key;
    },
  };
});

// ---------------------------------------------------------------------------
// DS-LAYOUT-01..07: AppShell
// ---------------------------------------------------------------------------

describe("AppShell — Design System", () => {
  describe("DS-LAYOUT-01: Landmark structure", () => {
    it("renders a <main> landmark element", () => {
      renderWithProviders(
        <AppShell>
          <div>content</div>
        </AppShell>,
      );
      const main = screen.getByRole("main");
      expect(main).toBeInTheDocument();
    });

    it("DS-LAYOUT-02: <main> has accessible name 'Main content'", () => {
      renderWithProviders(
        <AppShell>
          <div>content</div>
        </AppShell>,
      );
      const main = screen.getByRole("main");
      expect(main).toHaveAttribute("aria-label", "Main content");
    });

    it("DS-LAYOUT-03: <main> has topbar-inset class", () => {
      renderWithProviders(
        <AppShell>
          <div>content</div>
        </AppShell>,
      );
      const main = screen.getByRole("main");
      expect(main.className).toContain("topbar-inset");
    });

    it("DS-LAYOUT-04: <main> has sidebar-inset or sidebar-inset-collapsed class", () => {
      renderWithProviders(
        <AppShell>
          <div>content</div>
        </AppShell>,
      );
      const main = screen.getByRole("main");
      const hasSidebarClass =
        main.className.includes("sidebar-inset") ||
        main.className.includes("sidebar-inset-collapsed");
      expect(hasSidebarClass).toBe(true);
    });

    it("DS-LAYOUT-05: <main> has no inline paddingLeft style (no inline style bug)", () => {
      renderWithProviders(
        <AppShell>
          <div>content</div>
        </AppShell>,
      );
      const main = screen.getByRole("main");
      expect(main.style.paddingLeft).toBeFalsy();
    });

    it("DS-LAYOUT-06: renders children inside main", () => {
      renderWithProviders(
        <AppShell>
          <div data-testid="child-content">page content</div>
        </AppShell>,
      );
      const main = screen.getByRole("main");
      expect(main).toContainElement(screen.getByTestId("child-content"));
    });

    it("DS-LAYOUT-07: renders banner (TopBar) landmark", () => {
      renderWithProviders(
        <AppShell>
          <div>content</div>
        </AppShell>,
      );
      expect(screen.getByRole("banner")).toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// DS-LAYOUT-11..20: Sidebar
// ---------------------------------------------------------------------------

describe("Sidebar — Design System", () => {
  describe("DS-LAYOUT-11: Token classes", () => {
    it("uses bg-sidebar on the aside element (not bg-background)", () => {
      const { container } = renderWithProviders(<Sidebar isOpen={true} />);
      const aside = container.querySelector("aside");
      expect(aside).not.toBeNull();
      expect(aside!.className).toContain("bg-sidebar");
      expect(aside!.className).not.toContain("bg-background");
    });

    it("DS-LAYOUT-12: aside has border-r class", () => {
      const { container } = renderWithProviders(<Sidebar isOpen={true} />);
      const aside = container.querySelector("aside");
      expect(aside!.className).toContain("border-r");
    });
  });

  describe("DS-LAYOUT-13: Landmark and ARIA", () => {
    it("aside has aria-label for primary navigation", () => {
      const { container } = renderWithProviders(<Sidebar isOpen={true} />);
      const aside = container.querySelector("aside");
      const label = aside?.getAttribute("aria-label");
      expect(label).toBeTruthy();
    });

    it("DS-LAYOUT-14: nav links have aria-label attributes", () => {
      const { container } = renderWithProviders(<Sidebar isOpen={true} />);
      const links = container.querySelectorAll("a[aria-label]");
      // Should have at least 5 primary nav items + 2 settings items = 7 enabled links
      expect(links.length).toBeGreaterThanOrEqual(5);
    });

    it("DS-LAYOUT-15: icons have aria-hidden='true'", () => {
      const { container } = renderWithProviders(<Sidebar isOpen={true} />);
      const svgs = container.querySelectorAll("svg");
      for (const svg of svgs) {
        expect(svg.getAttribute("aria-hidden")).toBe("true");
      }
    });
  });

  describe("DS-LAYOUT-16: Active state", () => {
    it("active item has border-l-2 and border-primary classes", () => {
      // usePathname is mocked to /de/persons, so Persons link should be active
      const { container } = renderWithProviders(<Sidebar isOpen={true} />);
      const activeLink = container.querySelector("[aria-current='page']");
      expect(activeLink).not.toBeNull();
      expect(activeLink!.className).toContain("border-l-2");
      expect(activeLink!.className).toContain("border-primary");
    });

    it("DS-LAYOUT-16b: active item has aria-current='page'", () => {
      const { container } = renderWithProviders(<Sidebar isOpen={true} />);
      const activeLink = container.querySelector("[aria-current='page']");
      expect(activeLink).not.toBeNull();
    });
  });

  describe("DS-LAYOUT-17: Width classes", () => {
    it("has w-56 class when expanded", () => {
      const { container } = renderWithProviders(<Sidebar isOpen={true} />);
      const aside = container.querySelector("aside");
      expect(aside!.className).toContain("w-56");
    });

    it("DS-LAYOUT-18: has w-12 class when collapsed", () => {
      const { container } = renderWithProviders(<Sidebar isOpen={false} />);
      const aside = container.querySelector("aside");
      expect(aside!.className).toContain("w-12");
    });
  });

  describe("DS-LAYOUT-19: Label truncation removed", () => {
    it("nav labels do not have truncate class (bilingual-ready)", () => {
      const { container } = renderWithProviders(<Sidebar isOpen={true} />);
      // Check all span elements inside nav links
      const spans = container.querySelectorAll("nav a span");
      for (const span of spans) {
        expect(span.className).not.toContain("truncate");
      }
    });
  });

  describe("DS-LAYOUT-20: Collapsed state ARIA", () => {
    it("collapsed sidebar nav links still have aria-label", () => {
      const { container } = renderWithProviders(<Sidebar isOpen={false} />);
      const navLinks = container.querySelectorAll("nav a");
      for (const link of navLinks) {
        expect(link.getAttribute("aria-label")).toBeTruthy();
      }
    });
  });
});

// ---------------------------------------------------------------------------
// DS-LAYOUT-21..27: TopBar
// ---------------------------------------------------------------------------

describe("TopBar — Design System", () => {
  describe("DS-LAYOUT-21: Token classes", () => {
    it("uses bg-card on the header element (not bg-background)", () => {
      const { container } = renderWithProviders(<TopBar onToggleSidebar={vi.fn()} />);
      const header = container.querySelector("header");
      expect(header).not.toBeNull();
      expect(header!.className).toContain("bg-card");
      expect(header!.className).not.toContain("bg-background");
    });

    it("DS-LAYOUT-22: header has border-b class", () => {
      const { container } = renderWithProviders(<TopBar onToggleSidebar={vi.fn()} />);
      const header = container.querySelector("header");
      expect(header!.className).toContain("border-b");
    });

    it("DS-LAYOUT-23: header has h-14 class", () => {
      const { container } = renderWithProviders(<TopBar onToggleSidebar={vi.fn()} />);
      const header = container.querySelector("header");
      expect(header!.className).toContain("h-14");
    });

    it("DS-LAYOUT-24: header has z-50 class", () => {
      const { container } = renderWithProviders(<TopBar onToggleSidebar={vi.fn()} />);
      const header = container.querySelector("header");
      expect(header!.className).toContain("z-50");
    });
  });

  describe("DS-LAYOUT-25: Landmark role", () => {
    it("header renders as banner landmark", () => {
      renderWithProviders(<TopBar onToggleSidebar={vi.fn()} />);
      expect(screen.getByRole("banner")).toBeInTheDocument();
    });
  });

  describe("DS-LAYOUT-26: Sidebar toggle ARIA", () => {
    it("sidebar toggle button has aria-label", () => {
      renderWithProviders(<TopBar onToggleSidebar={vi.fn()} />);
      const toggleBtn = screen.getByTestId("sidebar-toggle");
      expect(toggleBtn).toHaveAttribute("aria-label");
    });
  });

  describe("DS-LAYOUT-27: Brand text", () => {
    it("renders brand name 'Evidoxa'", () => {
      renderWithProviders(<TopBar onToggleSidebar={vi.fn()} />);
      expect(screen.getByText("Evidoxa")).toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// DS-LAYOUT-28..34: Breadcrumb
// ---------------------------------------------------------------------------

describe("Breadcrumb — Design System", () => {
  function renderBreadcrumb() {
    return renderWithProviders(
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
  }

  it("DS-LAYOUT-28: renders a <nav> element with aria-label='Breadcrumb'", () => {
    renderBreadcrumb();
    const nav = screen.getByRole("navigation");
    expect(nav).toHaveAttribute("aria-label", "Breadcrumb");
  });

  it("DS-LAYOUT-29: renders an ordered list", () => {
    const { container } = renderBreadcrumb();
    expect(container.querySelector("ol")).not.toBeNull();
  });

  it("DS-LAYOUT-30: link segments are anchor elements", () => {
    const { container } = renderBreadcrumb();
    const link = container.querySelector("a");
    expect(link).not.toBeNull();
  });

  it("DS-LAYOUT-31: current page segment has aria-current='page'", () => {
    const { container } = renderBreadcrumb();
    const current = container.querySelector("[aria-current='page']");
    expect(current).not.toBeNull();
    expect(current?.textContent).toContain("Johann von Dalberg");
  });

  it("DS-LAYOUT-32: separator has aria-hidden='true'", () => {
    const { container } = renderBreadcrumb();
    // The separator li has role="presentation" and aria-hidden="true"
    const separator = container.querySelector("[role='presentation'][aria-hidden='true']");
    expect(separator).not.toBeNull();
  });

  it("DS-LAYOUT-33: current page element has font-medium and text-foreground", () => {
    const { container } = renderBreadcrumb();
    const current = container.querySelector("[aria-current='page']");
    expect(current!.className).toContain("font-medium");
    expect(current!.className).toContain("text-foreground");
  });

  it("DS-LAYOUT-34: link segment has text-muted-foreground class", () => {
    const { container } = renderBreadcrumb();
    const link = container.querySelector("a");
    expect(link!.className).toContain("text-muted-foreground");
  });
});

// ---------------------------------------------------------------------------
// DS-LAYOUT-35..44: Bottom Tab Bar
// ---------------------------------------------------------------------------

describe("BottomTabBar — Design System", () => {
  it("DS-LAYOUT-35: renders a <nav> with aria-label for bottom navigation", () => {
    const { container } = renderWithProviders(<BottomTabBar />);
    const nav = container.querySelector("nav");
    expect(nav).not.toBeNull();
    expect(nav!.getAttribute("aria-label")).toBeTruthy();
  });

  it("DS-LAYOUT-36: has lg:hidden class (desktop hidden)", () => {
    const { container } = renderWithProviders(<BottomTabBar />);
    const nav = container.querySelector("nav");
    expect(nav!.className).toContain("lg:hidden");
  });

  it("DS-LAYOUT-37: has bg-card class", () => {
    const { container } = renderWithProviders(<BottomTabBar />);
    const nav = container.querySelector("nav");
    expect(nav!.className).toContain("bg-card");
  });

  it("DS-LAYOUT-38: has border-t class", () => {
    const { container } = renderWithProviders(<BottomTabBar />);
    const nav = container.querySelector("nav");
    expect(nav!.className).toContain("border-t");
  });

  it("DS-LAYOUT-39: has h-16 class", () => {
    const { container } = renderWithProviders(<BottomTabBar />);
    const nav = container.querySelector("nav");
    expect(nav!.className).toContain("h-16");
  });

  it("DS-LAYOUT-40: renders exactly 5 nav items", () => {
    const { container } = renderWithProviders(<BottomTabBar />);
    const links = container.querySelectorAll("nav a");
    expect(links.length).toBe(5);
  });

  it("DS-LAYOUT-41: all nav items have aria-label", () => {
    const { container } = renderWithProviders(<BottomTabBar />);
    const links = container.querySelectorAll("nav a");
    for (const link of links) {
      expect(link.getAttribute("aria-label")).toBeTruthy();
    }
  });

  it("DS-LAYOUT-42: active item (persons path) has aria-current='page'", () => {
    // usePathname is mocked to /de/persons globally
    const { container } = renderWithProviders(<BottomTabBar />);
    const activeLink = container.querySelector("[aria-current='page']");
    expect(activeLink).not.toBeNull();
  });

  it("DS-LAYOUT-43: active item has text-primary class", () => {
    const { container } = renderWithProviders(<BottomTabBar />);
    const activeLink = container.querySelector("[aria-current='page']");
    expect(activeLink!.className).toContain("text-primary");
  });

  it("DS-LAYOUT-44: icons have aria-hidden='true'", () => {
    const { container } = renderWithProviders(<BottomTabBar />);
    const svgs = container.querySelectorAll("svg");
    for (const svg of svgs) {
      expect(svg.getAttribute("aria-hidden")).toBe("true");
    }
  });
});
