import { fireEvent, render, screen } from "@testing-library/react";
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

  it("ships matching sizes for sm and lg avatars", () => {
    const sm = render(<Avatar name="A" src="/photo.jpg" size="sm" />);
    expect(screen.getByRole("img", { name: "A" })).toHaveAttribute("width", "32");
    expect(screen.getByRole("img", { name: "A" })).toHaveAttribute("sizes", "32px");
    sm.unmount();

    render(<Avatar name="B" src="/photo.jpg" size="lg" />);
    expect(screen.getByRole("img", { name: "B" })).toHaveAttribute("width", "80");
    expect(screen.getByRole("img", { name: "B" })).toHaveAttribute("sizes", "80px");
  });

  it("allows decorative empty alt when the name is already adjacent text", () => {
    render(<Avatar name="Juan Pérez" src="/photo.jpg" alt="" />);
    const img = document.querySelector("img");
    expect(img).toBeTruthy();
    expect(img).toHaveAttribute("alt", "");
    // Empty alt must not surface as a named image role for AT.
    expect(screen.queryByRole("img", { name: "Juan Pérez" })).toBeNull();
  });

  it("keeps initials fallback decorative when alt is empty (null/unservable src)", () => {
    const { container } = render(
      <a href="/plantel/p1">
        <Avatar name="Ana García" src={null} alt="" />
        Ana García
      </a>,
    );
    const fallback = container.querySelector("[aria-hidden='true']") as HTMLElement;
    expect(fallback).toBeTruthy();
    expect(fallback.textContent).toBe("AG");
    expect(screen.getByRole("link", { name: /^Ana García$/i })).toBeInTheDocument();
  });

  it("keeps initials fallback decorative after image error when alt is empty", () => {
    const { container } = render(
      <a href="/plantel/p1">
        <Avatar name="Ana García" src="/photo.jpg" alt="" />
        Ana García
      </a>,
    );
    const img = container.querySelector("img");
    expect(img).toBeTruthy();
    fireEvent.error(img!);
    const fallback = container.querySelector("[aria-hidden='true']") as HTMLElement;
    expect(fallback).toBeTruthy();
    expect(fallback.textContent).toBe("AG");
    expect(screen.getByRole("link", { name: /^Ana García$/i })).toBeInTheDocument();
  });

  it("keeps default initials visible to AT when alt is not decorative", () => {
    render(<Avatar name="Ana García" />);
    expect(screen.getByText("AG")).toBeInTheDocument();
    expect(document.querySelector("[aria-hidden='true']")).toBeNull();
  });
});
