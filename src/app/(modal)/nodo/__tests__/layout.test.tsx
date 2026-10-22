import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  profileMaybeSingle: vi.fn(),
  canApply: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: mocks.getUser },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({ maybeSingle: mocks.profileMaybeSingle })),
      })),
    })),
  }),
}));

vi.mock("@/features/membership/ser-serrano-cta-server", () => ({
  resolveSerSerranoCtaVisibility: mocks.canApply,
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

import { SER_SERRANO_CTA_HREF } from "@/features/membership/ser-serrano-cta";
import NodoLayout from "../layout";

async function renderLayout() {
  const ui = await NodoLayout({ children: <p>contenido del nodo</p> });
  return render(ui);
}

function viewer(profile: { tier: string; is_platform_admin?: boolean } | null) {
  mocks.getUser.mockResolvedValue({ data: { user: { id: "u1" } } });
  mocks.profileMaybeSingle.mockResolvedValue({ data: profile, error: null });
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.canApply.mockResolvedValue(true);
});

describe("Nodo layout (ZER-204)", () => {
  it("shows projects and tasks to members", async () => {
    viewer({ tier: "standard" });
    await renderLayout();

    expect(screen.getByText("contenido del nodo")).toBeInTheDocument();
  });

  it("explains to a tourist that it is only for Serranos, instead of a 404", async () => {
    viewer({ tier: "tourist" });
    await renderLayout();

    expect(screen.queryByText("contenido del nodo")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Esto es solo para Serranos" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Quiero ser Serrano" })).toHaveAttribute(
      "href",
      SER_SERRANO_CTA_HREF,
    );
    expect(screen.getByRole("link", { name: "Volver al inicio" })).toHaveAttribute("href", "/");
  });

  it("tells a tourist whose request is in progress to wait, without asking again", async () => {
    viewer({ tier: "tourist" });
    mocks.canApply.mockResolvedValue(false);
    await renderLayout();

    expect(screen.getByText(/Tu solicitud para ser Serrano está en curso/)).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Quiero ser Serrano" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ver mi solicitud" })).toHaveAttribute(
      "href",
      "/profile",
    );
  });

  it("lets a platform admin through even with the tourist tier", async () => {
    viewer({ tier: "tourist", is_platform_admin: true });
    await renderLayout();

    expect(screen.getByText("contenido del nodo")).toBeInTheDocument();
  });

  it("leaves signed-out visitors to the pages (the proxy sends them to login)", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null } });
    await renderLayout();

    expect(screen.getByText("contenido del nodo")).toBeInTheDocument();
    expect(mocks.profileMaybeSingle).not.toHaveBeenCalled();
  });
});
