import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TabBarClient } from "./TabBarClient";

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(),
}));

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

import { usePathname } from "next/navigation";

describe("TabBarClient", () => {
  it("marks inicio active on /", () => {
    (usePathname as ReturnType<typeof vi.fn>).mockReturnValue("/");
    render(<TabBarClient />);
    expect(screen.getByRole("link", { name: /INICIO/i })).toHaveClass("bg-primary");
    const actives = screen.getAllByRole("link").filter((el) => el.className.includes("bg-primary"));
    expect(actives).toHaveLength(1);
  });

  it("marks plantel active when pathname starts with /plantel", () => {
    (usePathname as ReturnType<typeof vi.fn>).mockReturnValue("/plantel");
    render(<TabBarClient />);
    expect(screen.getByRole("link", { name: /PLANTEL/i })).toHaveClass("bg-primary");
  });

  it.each(["/nodo/projects", "/nodo/tasks", "/nodo/projects/proj-1", "/nodo/tasks/task-1"])(
    "marks Actividad active on %s (ZER-206)",
    (pathname) => {
      (usePathname as ReturnType<typeof vi.fn>).mockReturnValue(pathname);
      render(<TabBarClient showActividad />);
      expect(screen.getByRole("link", { name: /ACTIVIDAD/i })).toHaveClass("bg-primary");
      expect(screen.getByRole("link", { name: /INICIO/i })).not.toHaveClass("bg-primary");
    },
  );

  it("does not mark Actividad on a /nodo path that is not a hub", () => {
    (usePathname as ReturnType<typeof vi.fn>).mockReturnValue("/nodo/other");
    render(<TabBarClient showActividad />);
    expect(screen.getByRole("link", { name: /ACTIVIDAD/i })).not.toHaveClass("bg-primary");
    expect(screen.getByRole("link", { name: /INICIO/i })).toHaveClass("bg-primary");
  });

  it("does not show Actividad to tourists", () => {
    (usePathname as ReturnType<typeof vi.fn>).mockReturnValue("/");
    render(<TabBarClient showActividad={false} />);
    expect(screen.queryByRole("link", { name: /ACTIVIDAD/i })).not.toBeInTheDocument();
  });

  it("marks agenda active when pathname starts with /agenda", () => {
    (usePathname as ReturnType<typeof vi.fn>).mockReturnValue("/agenda");
    render(<TabBarClient />);
    expect(screen.getByRole("link", { name: /AGENDA/i })).toHaveClass("bg-primary");
  });

  it.each(["/admin/membresias", "/admin/roles"])(
    "marks perfil, not inicio, on %s (the admin panel opens from Perfil)",
    (pathname) => {
      (usePathname as ReturnType<typeof vi.fn>).mockReturnValue(pathname);
      render(<TabBarClient />);
      expect(screen.getByRole("link", { name: /PERFIL/i })).toHaveClass("bg-primary");
      expect(screen.getByRole("link", { name: /INICIO/i })).not.toHaveClass("bg-primary");
    },
  );

  it("marks perfil active for /profile and /onboarding", () => {
    (usePathname as ReturnType<typeof vi.fn>).mockReturnValue("/profile");
    const { unmount } = render(<TabBarClient />);
    expect(screen.getByRole("link", { name: /PERFIL/i })).toHaveClass("bg-primary");
    unmount();

    (usePathname as ReturnType<typeof vi.fn>).mockReturnValue("/onboarding/step1");
    render(<TabBarClient />);
    expect(screen.getByRole("link", { name: /PERFIL/i })).toHaveClass("bg-primary");
  });
});
