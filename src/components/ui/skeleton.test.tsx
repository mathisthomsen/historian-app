import { render } from "@testing-library/react";
import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PageSkeleton, Skeleton } from "./skeleton";

describe("Skeleton", () => {
  it("renders with animate-pulse class", () => {
    const { container } = render(<Skeleton />);
    expect(container.firstChild).toHaveClass("animate-pulse");
  });

  it("accepts additional className", () => {
    const { container } = render(<Skeleton className="h-4 w-full" />);
    expect(container.firstChild).toHaveClass("h-4", "w-full");
  });
});

describe("PageSkeleton", () => {
  it("renders list variant by default", () => {
    render(<PageSkeleton />);
    expect(screen.getByTestId("skeleton-list")).toBeInTheDocument();
  });

  it("renders detail variant", () => {
    render(<PageSkeleton variant="detail" />);
    expect(screen.getByTestId("skeleton-detail")).toBeInTheDocument();
  });

  it("renders card-grid variant", () => {
    render(<PageSkeleton variant="card-grid" />);
    expect(screen.getByTestId("skeleton-card-grid")).toBeInTheDocument();
  });
});
