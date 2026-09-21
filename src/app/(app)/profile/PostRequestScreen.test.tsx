import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PostRequestScreen } from "./PostRequestScreen";

vi.mock("next/link", () => ({
  default: ({
    href,
    className,
    children,
  }: {
    href: string;
    className?: string;
    children: React.ReactNode;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

vi.mock("@/features/auth/actions", () => ({
  signOut: vi.fn(),
}));

describe("PostRequestScreen dark tokens (ZER-103)", () => {
  it("uses design tokens instead of light-only hex for status chrome", () => {
    const { container } = render(<PostRequestScreen />);

    expect(screen.getByText("Tu cuenta está en revisión")).toBeInTheDocument();

    const html = container.innerHTML;
    expect(html).not.toMatch(/bg-\[#|text-\[#|border-\[#/);
    expect(html).toMatch(/warm-yellow|warm-orange/);
    expect(html).toMatch(/surface-inset|text-muted|text-text-muted/);
  });
});
