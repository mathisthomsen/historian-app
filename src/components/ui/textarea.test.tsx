import { render, screen } from "@testing-library/react";
import { createRef } from "react";
import { describe, expect, it } from "vitest";

import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";

describe("Textarea", () => {
  it("renders a textarea and forwards props", () => {
    render(<Textarea aria-label="Notes" placeholder="Type here" defaultValue="hello" />);
    const el = screen.getByLabelText("Notes");
    expect(el.tagName).toBe("TEXTAREA");
    expect(el).toHaveAttribute("placeholder", "Type here");
    expect(el).toHaveValue("hello");
  });

  it("applies the shared default height", () => {
    render(<Textarea aria-label="Notes" />);
    expect(screen.getByLabelText("Notes").className).toContain("min-h-[80px]");
  });

  it("merges a caller override instead of forcing a forked class string", () => {
    render(<Textarea aria-label="Notes" className="min-h-[72px]" />);
    const cls = screen.getByLabelText("Notes").className;
    expect(cls).toContain("min-h-[72px]");
    // the rest of the shared styling survives the override
    expect(cls).toContain("rounded-md");
  });

  it("forwards a ref", () => {
    const ref = createRef<HTMLTextAreaElement>();
    render(<Textarea aria-label="Notes" ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLTextAreaElement);
  });
});

describe("NativeSelect", () => {
  it("renders a native select with its options", () => {
    render(
      <NativeSelect aria-label="Type">
        <option value="a">Alpha</option>
        <option value="b">Beta</option>
      </NativeSelect>,
    );
    const el = screen.getByLabelText("Type");
    expect(el.tagName).toBe("SELECT");
    expect(screen.getByRole("option", { name: "Alpha" })).toBeInTheDocument();
  });

  it("honours value and disabled", () => {
    render(
      <NativeSelect aria-label="Type" defaultValue="b" disabled>
        <option value="a">Alpha</option>
        <option value="b">Beta</option>
      </NativeSelect>,
    );
    const el = screen.getByLabelText("Type");
    expect(el).toHaveValue("b");
    expect(el).toBeDisabled();
  });

  it("merges caller classes", () => {
    render(<NativeSelect aria-label="Type" className="w-auto" />);
    const cls = screen.getByLabelText("Type").className;
    expect(cls).toContain("w-auto");
    expect(cls).toContain("border-input");
  });

  it("forwards a ref", () => {
    const ref = createRef<HTMLSelectElement>();
    render(<NativeSelect aria-label="Type" ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLSelectElement);
  });
});
