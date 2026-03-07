import { screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "@/test/render";

import { VerifyEmailCard } from "./VerifyEmailCard";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("next-intl", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    useTranslations: () => (key: string) => key,
  };
});

describe("VerifyEmailCard", () => {
  it("renders error state immediately when token is null (no fetch call)", () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    renderWithProviders(<VerifyEmailCard token={null} />);

    // Should show error state with tokenInvalid message (appears in heading + body)
    expect(screen.getAllByText("errors.tokenInvalid").length).toBeGreaterThan(0);
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it("shows pending then success when fetch returns 200", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce({ ok: true, status: 200 } as Response),
    );

    renderWithProviders(<VerifyEmailCard token="valid-token" />);

    // Initially shows pending (verifying)
    expect(screen.getByText("verify.verifying")).toBeDefined();

    await waitFor(() => {
      expect(screen.getByText("verify.success")).toBeDefined();
    });

    vi.unstubAllGlobals();
  });

  it("shows pending then error when fetch returns 400", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ error: "auth.errors.tokenInvalid" }),
      } as Response),
    );

    renderWithProviders(<VerifyEmailCard token="bad-token" />);

    // Initially pending
    expect(screen.getByText("verify.verifying")).toBeDefined();

    await waitFor(() => {
      expect(screen.getAllByText("errors.tokenInvalid")).toBeDefined();
    });

    vi.unstubAllGlobals();
  });
});
