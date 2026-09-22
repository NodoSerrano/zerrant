import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PendingMembershipCard } from "./PendingMembershipCard";

describe("PendingMembershipCard dark tokens (ZER-110)", () => {
  it("uses design tokens instead of light-only hex for status chrome", () => {
    const { container } = render(<PendingMembershipCard />);

    expect(screen.getByText("Solicitud en revisión")).toBeInTheDocument();

    const html = container.innerHTML;
    expect(html).not.toMatch(/bg-\[#|text-\[#|border-\[#/);
    expect(html).toMatch(/warm-yellow|warm-orange/);
    expect(html).toMatch(/text-text-secondary|text-secondary|text-text-primary/);
  });
});
