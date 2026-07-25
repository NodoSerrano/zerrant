import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Input } from "./Input";

describe("Input", () => {
  it("renders with visible label", () => {
    render(<Input label="Email" />);
    const input = screen.getByLabelText("Email");
    expect(input).toBeInTheDocument();
    expect(input.tagName).toBe("INPUT");
  });

  it("renders input without a label element", () => {
    render(<Input placeholder="Search..." />);
    const input = screen.getByPlaceholderText("Search...");
    expect(input).toBeInTheDocument();
    expect(screen.queryByRole("label")).toBeNull();
  });

  it("shows error message when error prop is passed", () => {
    render(<Input error="This field is required" />);
    expect(screen.getByText("This field is required")).toBeInTheDocument();
  });

  it("accepts custom className", () => {
    render(<Input className="my-input" />);
    expect(screen.getByRole("textbox")).toHaveClass("my-input");
  });

  it("passes native HTML attributes to the input element", () => {
    render(<Input placeholder="Enter name" type="email" name="userEmail" />);
    const input = screen.getByRole("textbox");
    expect(input).toHaveAttribute("placeholder", "Enter name");
    expect(input).toHaveAttribute("type", "email");
    expect(input).toHaveAttribute("name", "userEmail");
  });

  it("shows error styling on input when error is present", () => {
    render(<Input error="Invalid" />);
    expect(screen.getByRole("textbox")).toHaveClass("border-coral");
  });

  it("has pill/surface field with 16px radius and 50px height", () => {
    render(<Input label="Email" />);
    const field = screen.getByLabelText("Email");
    expect(field).toHaveClass("rounded-2xl");
    expect(field).toHaveClass("h-[50px]");
    expect(field).toHaveClass("bg-surface");
    expect(field).toHaveClass("border-border");
  });

  it("marks required fields with an asterisk next to the label", () => {
    render(<Input label="Nombre" required />);
    const input = screen.getByLabelText("Nombre");
    expect(input).toBeRequired();
    const asterisk = screen.getByText("*");
    expect(asterisk).toHaveAttribute("aria-hidden", "true");
    expect(asterisk).toHaveClass("text-coral");
  });

  it("does not show an asterisk when the field is optional", () => {
    render(<Input label="Apodo (opcional)" />);
    expect(screen.queryByText("*")).toBeNull();
    expect(screen.getByLabelText("Apodo (opcional)")).not.toBeRequired();
  });

  it("has label with text-text-secondary", () => {
    render(<Input label="Email" />);
    const label = screen.getByText("Email");
    expect(label).toHaveClass("text-text-secondary");
  });
});
