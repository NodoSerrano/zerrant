import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Chip } from "./Chip";

describe("Chip", () => {
  it("renders the label text", () => {
    render(<Chip label="React" />);
    expect(screen.getByText("React")).toBeInTheDocument();
  });

  it("renders with default variant classes", () => {
    render(<Chip label="Default" />);
    const chip = screen.getByText("Default");
    expect(chip).toHaveClass("bg-surface-inset");
    expect(chip).toHaveClass("text-text-secondary");
  });

  it("renders mint variant with correct classes", () => {
    render(<Chip label="Mint" variant="mint" />);
    const chip = screen.getByText("Mint");
    expect(chip).toHaveClass("bg-mint-raw/20");
    expect(chip).toHaveClass("text-on-mint-tint");
  });

  it("renders blue variant with correct classes", () => {
    render(<Chip label="Blue" variant="blue" />);
    const chip = screen.getByText("Blue");
    expect(chip).toHaveClass("bg-blue-raw/20");
    expect(chip).toHaveClass("text-on-blue-tint");
  });

  it("renders violet variant with correct classes", () => {
    render(<Chip label="Violet" variant="violet" />);
    const chip = screen.getByText("Violet");
    expect(chip).toHaveClass("bg-violet-raw/20");
    expect(chip).toHaveClass("text-on-violet-tint");
  });

  it("accepts custom className", () => {
    render(<Chip label="Custom" className="my-chip" />);
    expect(screen.getByText("Custom")).toHaveClass("my-chip");
  });

  it("has border-border and Pencil padding", () => {
    render(<Chip label="Tag" />);
    const chip = screen.getByText("Tag");
    expect(chip).toHaveClass("border-border");
    expect(chip).toHaveClass("px-[13px]");
    expect(chip).toHaveClass("py-[7px]");
  });

  it("colored variants also have border and new padding", () => {
    render(<Chip label="Mint" variant="mint" />);
    const chip = screen.getByText("Mint");
    expect(chip).toHaveClass("border-border");
    expect(chip).toHaveClass("px-[13px]");
    expect(chip).toHaveClass("py-[7px]");
  });
});
