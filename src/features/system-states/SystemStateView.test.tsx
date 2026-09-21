import { fireEvent, render, screen } from "@testing-library/react";
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

describe("SystemStateView", () => {
  it("renders Pencil 7.6 404 key IA/copy with home CTA", () => {
    render(
      <SystemStateView
        dataPencilFrame="eZRDM"
        icon={Compass}
        iconTone="neutral"
        title="Perdiste el rumbo"
        subtitle="No encontramos esta página. Puede que ya no exista."
        action={{ type: "link", href: "/", label: "Ir al inicio" }}
      />,
    );

    expect(screen.getByRole("heading", { name: "Perdiste el rumbo" })).toBeInTheDocument();
    expect(
      screen.getByText("No encontramos esta página. Puede que ya no exista."),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Ir al inicio/i })).toHaveAttribute("href", "/");
    expect(document.querySelector("svg.lucide-compass")).toBeTruthy();
  });

  it("renders Pencil 7.5 offline key IA/copy with retry CTA", () => {
    render(
      <SystemStateView
        dataPencilFrame="LYkM4"
        icon={WifiOff}
        iconTone="warning"
        title="Sin conexión"
        subtitle="Revisá tu internet. Mientras tanto te mostramos lo último que guardamos en el dispositivo."
        action={{ type: "link", href: "/", label: "Reintentar", icon: RefreshCw }}
      />,
    );

    expect(screen.getByRole("heading", { name: "Sin conexión" })).toBeInTheDocument();
    expect(
      screen.getByText(
        /Revisá tu internet\. Mientras tanto te mostramos lo último que guardamos en el dispositivo\./,
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Reintentar/i })).toHaveAttribute("href", "/");
    expect(document.querySelector("svg.lucide-wifi-off")).toBeTruthy();
    expect(document.querySelector("svg.lucide-refresh-cw")).toBeTruthy();
  });

  it("supports recoverable error retry as a button (same 7.5 surface)", () => {
    const onRetry = vi.fn();
    render(
      <SystemStateView
        dataPencilFrame="LYkM4"
        icon={WifiOff}
        iconTone="warning"
        title="Sin conexión"
        subtitle="Revisá tu internet. Mientras tanto te mostramos lo último que guardamos en el dispositivo."
        action={{ type: "button", label: "Reintentar", onClick: onRetry, icon: RefreshCw }}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Reintentar/i }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
