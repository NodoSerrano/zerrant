import { render, screen } from "@testing-library/react";
import { Compass, RefreshCw, WifiOff } from "lucide-react";
import { describe, expect, it, vi } from "vitest";
import { SystemStateView } from "./SystemStateView";

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

describe("SystemStateView a11y (ZER-104)", () => {
  it("exposes primary CTA as a named link with focus-visible ring classes", () => {
    render(
      <SystemStateView
        dataPencilFrame="eZRDM"
        icon={Compass}
        iconTone="neutral"
        title="Perdiste el rumbo"
        subtitle="No encontramos esta página."
        action={{ type: "link", href: "/", label: "Ir al inicio" }}
      />,
    );

    const cta = screen.getByRole("link", { name: /^Ir al inicio$/i });
    expect(cta).toHaveAttribute("href", "/");
    expect(cta.className).toMatch(/focus-visible:ring-2/);
    expect(cta.className).toMatch(/focus-visible:ring-primary\/40/);
  });

  it("exposes recoverable retry as a named button with the same focus ring", () => {
    render(
      <SystemStateView
        dataPencilFrame="LYkM4"
        icon={WifiOff}
        iconTone="warning"
        title="Sin conexión"
        subtitle="Revisá tu internet."
        action={{ type: "button", label: "Reintentar", onClick: () => {}, icon: RefreshCw }}
      />,
    );

    const cta = screen.getByRole("button", { name: /^Reintentar$/i });
    expect(cta.className).toMatch(/focus-visible:ring-2/);
  });
});
