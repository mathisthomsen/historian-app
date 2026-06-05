import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";

import { Textarea } from "@/components/ui/textarea";

describe("Textarea — element identity", () => {
  it("renders as a <textarea> element (AC-1)", () => {
    render(<Textarea />);
    expect(screen.getByRole("textbox")).toBeInstanceOf(HTMLTextAreaElement);
  });
});

describe("Textarea — base classes", () => {
  it("has border-input-border class (AC-2)", () => {
    render(<Textarea />);
    expect(screen.getByRole("textbox")).toHaveClass("border-input-border");
  });

  it("has min-h-[80px] class (AC-3)", () => {
    render(<Textarea />);
    expect(screen.getByRole("textbox")).toHaveClass("min-h-[80px]");
  });

  it("has resize-y class (AC-4)", () => {
    render(<Textarea />);
    expect(screen.getByRole("textbox")).toHaveClass("resize-y");
  });

  it("does NOT have resize class (AC-4)", () => {
    render(<Textarea />);
    // Tailwind's bare `resize` utility would set `resize: both`
    expect(screen.getByRole("textbox")).not.toHaveClass("resize");
  });

  it("does NOT have resize-x class (AC-4)", () => {
    render(<Textarea />);
    expect(screen.getByRole("textbox")).not.toHaveClass("resize-x");
  });

  it("has focus-visible:outline-none class (AC-6)", () => {
    render(<Textarea />);
    expect(screen.getByRole("textbox")).toHaveClass("focus-visible:outline-none");
  });

  it("has focus-visible:ring-1 class (AC-5)", () => {
    render(<Textarea />);
    expect(screen.getByRole("textbox")).toHaveClass("focus-visible:ring-1");
  });

  it("has focus-visible:ring-ring class (AC-5)", () => {
    render(<Textarea />);
    expect(screen.getByRole("textbox")).toHaveClass("focus-visible:ring-ring");
  });

  it("has w-full class (AC-12)", () => {
    render(<Textarea />);
    expect(screen.getByRole("textbox")).toHaveClass("w-full");
  });

  it("has rounded-md class (AC-13)", () => {
    render(<Textarea />);
    expect(screen.getByRole("textbox")).toHaveClass("rounded-md");
  });

  it("has bg-transparent class (AC-14)", () => {
    render(<Textarea />);
    expect(screen.getByRole("textbox")).toHaveClass("bg-transparent");
  });

  it("has transition-colors class (AC-15)", () => {
    render(<Textarea />);
    expect(screen.getByRole("textbox")).toHaveClass("transition-colors");
  });
});

describe("Textarea — disabled state (AC-7)", () => {
  it("applies disabled:cursor-not-allowed class", () => {
    render(<Textarea disabled />);
    expect(screen.getByRole("textbox")).toHaveClass("disabled:cursor-not-allowed");
  });

  it("applies disabled:opacity-50 class", () => {
    render(<Textarea disabled />);
    expect(screen.getByRole("textbox")).toHaveClass("disabled:opacity-50");
  });

  it("is not focusable when disabled", () => {
    render(<Textarea disabled />);
    const el = screen.getByRole("textbox");
    expect(el).toBeDisabled();
  });

  it("does not accept user input when disabled", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Textarea disabled onChange={onChange} />);
    await user.click(screen.getByRole("textbox"));
    await user.keyboard("hello");
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe("Textarea — className merging (AC-8)", () => {
  it("merges additional className onto the element", () => {
    render(<Textarea className="custom-class another-class" />);
    const el = screen.getByRole("textbox");
    expect(el).toHaveClass("custom-class");
    expect(el).toHaveClass("another-class");
  });

  it("retains base classes when className is provided", () => {
    render(<Textarea className="font-mono" />);
    const el = screen.getByRole("textbox");
    expect(el).toHaveClass("font-mono");
    expect(el).toHaveClass("border-input-border");
    expect(el).toHaveClass("resize-y");
  });
});

describe("Textarea — prop pass-through (AC-9)", () => {
  it("renders with placeholder text", () => {
    render(<Textarea placeholder="Add your notes here" />);
    expect(screen.getByPlaceholderText("Add your notes here")).toBeInTheDocument();
  });

  it("accepts rows prop", () => {
    render(<Textarea rows={6} />);
    expect(screen.getByRole("textbox")).toHaveAttribute("rows", "6");
  });

  it("accepts defaultValue", () => {
    render(<Textarea defaultValue="initial content" />);
    expect(screen.getByRole("textbox")).toHaveValue("initial content");
  });

  it("calls onChange handler", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Textarea onChange={onChange} />);
    await user.type(screen.getByRole("textbox"), "a");
    expect(onChange).toHaveBeenCalled();
  });

  it("accepts aria-describedby prop", () => {
    render(<Textarea aria-describedby="notes-error" />);
    expect(screen.getByRole("textbox")).toHaveAttribute("aria-describedby", "notes-error");
  });

  it("accepts aria-invalid prop", () => {
    render(<Textarea aria-invalid="true" />);
    expect(screen.getByRole("textbox")).toHaveAttribute("aria-invalid", "true");
  });

  it("accepts name prop", () => {
    render(<Textarea name="notes" />);
    expect(screen.getByRole("textbox")).toHaveAttribute("name", "notes");
  });

  it("accepts id prop", () => {
    render(<Textarea id="notes-input" />);
    expect(screen.getByRole("textbox")).toHaveAttribute("id", "notes-input");
  });
});

describe("Textarea — ref forwarding (AC-10)", () => {
  it("forwards ref to the underlying <textarea> DOM element", () => {
    const ref = createRef<HTMLTextAreaElement>();
    render(<Textarea ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLTextAreaElement);
  });
});
