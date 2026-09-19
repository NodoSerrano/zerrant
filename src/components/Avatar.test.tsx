import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Avatar } from "./Avatar";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("Avatar", () => {
  it("renders initials when no src is provided", () => {
    render(<Avatar name="Juan Pérez" />);
    expect(screen.getByText("JP")).toBeInTheDocument();
    expect(screen.queryByRole("img")).toBeNull();
  });

  it("renders initials from first 2 words", () => {
    render(<Avatar name="María José García López" />);
    expect(screen.getByText("MJ")).toBeInTheDocument();
  });

  it("renders an img element with alt text when src is provided", () => {
    render(<Avatar name="Juan Pérez" src="/photo.jpg" />);
    const img = screen.getByRole("img", { name: "Juan Pérez" });
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("src");
  });

  it("renders the image when src is a servable remote avatar URL", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://abc.supabase.co");
    render(
      <Avatar
        name="Juan Pérez"
        src="https://abc.supabase.co/storage/v1/object/public/avatars/u/a.jpg"
      />,
    );

    expect(screen.getByRole("img", { name: "Juan Pérez" })).toBeInTheDocument();
    expect(screen.queryByText("JP")).toBeNull();
  });

  it("renders initials when src host is outside remotePatterns", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://abc.supabase.co");
    render(
      <Avatar
        name="Juan Pérez"
        src="https://other.supabase.co/storage/v1/object/public/avatars/u/a.jpg"
      />,
    );

    expect(screen.getByText("JP")).toBeInTheDocument();
    expect(screen.queryByRole("img")).toBeNull();
  });

  it("degrades to initials when the image request fails after render", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://abc.supabase.co");
    render(
      <Avatar
        name="Juan Pérez"
        src="https://abc.supabase.co/storage/v1/object/public/avatars/u/a.jpg"
      />,
    );

    const img = screen.getByRole("img", { name: "Juan Pérez" });
    fireEvent.error(img);

    expect(screen.getByText("JP")).toBeInTheDocument();
    expect(screen.queryByRole("img")).toBeNull();
  });

  it('applies sm size class when size="sm"', () => {
    render(<Avatar name="Juan Pérez" size="sm" />);
    expect(screen.getByText("JP")).toHaveClass("size-8");
  });

  it('applies md size class when size="md"', () => {
    render(<Avatar name="Juan Pérez" size="md" />);
    expect(screen.getByText("JP")).toHaveClass("size-12");
  });

  it('applies lg size class when size="lg"', () => {
    render(<Avatar name="Juan Pérez" size="lg" />);
    expect(screen.getByText("JP")).toHaveClass("size-20");
  });

  it("accepts custom className", () => {
    render(<Avatar name="Juan Pérez" className="my-avatar" />);
    expect(screen.getByText("JP")).toHaveClass("my-avatar");
  });

  it("applies custom className to img when src is provided", () => {
    render(<Avatar name="Juan Pérez" src="/photo.jpg" className="my-avatar" />);
    expect(screen.getByRole("img")).toHaveClass("my-avatar");
  });

  it("uses gradient brand-mint to brand-blue on fallback (not solid bg-primary)", () => {
    render(<Avatar name="Juan Pérez" />);
    const el = screen.getByText("JP");
    expect(el.className).toContain("from-brand-mint");
    expect(el.className).toContain("to-brand-blue");
    expect(el.className).toContain("bg-linear-to-br");
    expect(el).not.toHaveClass("bg-primary");
  });

  it("has font-bold and text-on-primary on fallback", () => {
    render(<Avatar name="Juan Pérez" />);
    const el = screen.getByText("JP");
    expect(el).toHaveClass("font-bold");
    expect(el).toHaveClass("text-on-primary");
  });

  it("uses proportional text sizes per size", () => {
    const r1 = render(<Avatar name="A" size="sm" />);
    expect(screen.getByText("A")).toHaveClass("text-sm");
    r1.unmount();

    const r2 = render(<Avatar name="A" size="md" />);
    expect(screen.getByText("A")).toHaveClass("text-lg");
    r2.unmount();

    const r3 = render(<Avatar name="A" size="lg" />);
    expect(screen.getByText("A")).toHaveClass("text-xl");
    r3.unmount();
  });
});
