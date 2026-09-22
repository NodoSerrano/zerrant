import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PrimaryButton } from "@/components/PrimaryButton";

describe("PrimaryButton", () => {
  it("renders with children", () => {
    render(<PrimaryButton>Click me</PrimaryButton>);
    expect(screen.getByText("Click me")).toBeInTheDocument();
  });

  it("applies disabled state", () => {
    render(<PrimaryButton disabled>Click me</PrimaryButton>);
    expect(screen.getByText("Click me")).toBeDisabled();
  });

  it("uses shared brand gradient utility (mint→blue→violet ramp)", () => {
    render(<PrimaryButton>Gradient</PrimaryButton>);
    const btn = screen.getByRole("button");
    expect(btn.className).toContain("bg-gradient-brand");
    expect(btn.className).not.toContain("from-brand-green");
    expect(btn.className).not.toContain("to-brand-blue");
  });

  it("has outer shadow", () => {
    render(<PrimaryButton>Shadow</PrimaryButton>);
    const btn = screen.getByRole("button");
    expect(btn.className).toMatch(/shadow-\[0_4px_14px_rgba/);
  });

  it("has pill shape and on-primary text", () => {
    render(<PrimaryButton>Pill</PrimaryButton>);
    const btn = screen.getByRole("button");
    expect(btn).toHaveClass("rounded-pill");
    expect(btn).toHaveClass("text-on-primary");
  });

  it("has default height 54px", () => {
    render(<PrimaryButton>Height</PrimaryButton>);
    const btn = screen.getByRole("button");
    expect(btn).toHaveClass("h-[54px]");
  });
});
