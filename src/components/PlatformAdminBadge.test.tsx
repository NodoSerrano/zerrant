import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PlatformAdminBadge } from "./PlatformAdminBadge";

describe("PlatformAdminBadge", () => {
  it('renders the "Admin" label', () => {
    render(<PlatformAdminBadge />);
    expect(screen.getByText("Admin")).toBeInTheDocument();
  });

  it("uses pill + brand-blue treatment distinct from tier badges", () => {
    render(<PlatformAdminBadge />);
    const badge = screen.getByText("Admin");
    expect(badge).toHaveClass("rounded-pill");
    expect(badge).toHaveClass("bg-blue-raw/20");
    expect(badge).toHaveClass("text-brand-blue");
    expect(badge).toHaveClass("font-display");
  });

  it("accepts custom className", () => {
    render(<PlatformAdminBadge className="my-admin" />);
    expect(screen.getByText("Admin")).toHaveClass("my-admin");
  });
});
