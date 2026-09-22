import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TierBadge } from "./TierBadge";

describe("TierBadge", () => {
  it('renders "Turista" label for tourist tier', () => {
    render(<TierBadge tier="tourist" />);
    expect(screen.getByText("Turista")).toBeInTheDocument();
  });

  it('renders "Scholar" label for scholar tier', () => {
    render(<TierBadge tier="scholar" />);
    expect(screen.getByText("Scholar")).toBeInTheDocument();
  });

  it('renders "Miembro" label for standard tier', () => {
    render(<TierBadge tier="standard" />);
    expect(screen.getByText("Miembro")).toBeInTheDocument();
  });

  it('renders "Founder" label for founder tier', () => {
    render(<TierBadge tier="founder" />);
    expect(screen.getByText("Founder")).toBeInTheDocument();
  });

  it("applies distinct styles per tier", () => {
    const { unmount } = render(<TierBadge tier="tourist" />);
    expect(screen.getByText("Turista")).toHaveClass("bg-surface-inset");
    expect(screen.getByText("Turista")).toHaveClass("text-text-muted");
    unmount();

    render(<TierBadge tier="scholar" />);
    expect(screen.getByText("Scholar")).toHaveClass("bg-blue-raw/20");
    expect(screen.getByText("Scholar")).toHaveClass("text-brand-blue");
    unmount();

    render(<TierBadge tier="standard" />);
    expect(screen.getByText("Miembro")).toHaveClass("bg-mint-raw/20");
    expect(screen.getByText("Miembro")).toHaveClass("text-brand-mint");
    unmount();

    render(<TierBadge tier="founder" />);
    expect(screen.getByText("Founder")).toHaveClass("bg-warm-yellow/20");
    expect(screen.getByText("Founder")).toHaveClass("text-warm-yellow");
  });

  it("accepts custom className", () => {
    render(<TierBadge tier="standard" className="my-badge" />);
    expect(screen.getByText("Miembro")).toHaveClass("my-badge");
  });

  it("has rounded-pill and Pencil padding", () => {
    render(<TierBadge tier="scholar" />);
    const badge = screen.getByText("Scholar");
    expect(badge).toHaveClass("rounded-pill");
    expect(badge).not.toHaveClass("rounded-md");
    expect(badge).toHaveClass("px-[11px]");
    expect(badge).toHaveClass("py-[5px]");
  });
});
