import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Avatar } from "./Avatar";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("Avatar a11y + sizing (ZER-104)", () => {
  it("ships fixed pixel dimensions and sizes for md avatars (no LCP bomb layout)", () => {
    render(<Avatar name="Juan Pérez" src="/photo.jpg" size="md" />);
    const img = screen.getByRole("img", { name: "Juan Pérez" });
    expect(img).toHaveAttribute("width", "48");
    expect(img).toHaveAttribute("height", "48");
    expect(img).toHaveAttribute("sizes", "48px");
  });

  it("allows decorative empty alt when the name is already adjacent text", () => {
    render(<Avatar name="Juan Pérez" src="/photo.jpg" alt="" />);
    const img = document.querySelector("img");
    expect(img).toBeTruthy();
    expect(img).toHaveAttribute("alt", "");
    // Empty alt must not surface as a named image role for AT.
    expect(screen.queryByRole("img", { name: "Juan Pérez" })).toBeNull();
  });
});
