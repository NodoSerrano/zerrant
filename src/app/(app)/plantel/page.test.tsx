import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  profilesSelect: vi.fn(),
  profilesNeq: vi.fn(),
  profilesOrder: vi.fn(),
  profileRolesSelect: vi.fn(),
  profileRolesEq: vi.fn(),
  profileSkillsSelect: vi.fn(),
  redirect: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: mocks.getUser },
    from: vi.fn((table: string) => {
      if (table === "profiles") {
        return {
          select: mocks.profilesSelect.mockImplementation(() => ({
            neq: mocks.profilesNeq.mockImplementation(() => ({
              order: mocks.profilesOrder,
            })),
          })),
        };
      }
      if (table === "profile_roles") {
        return {
          select: mocks.profileRolesSelect.mockImplementation(() => ({
            eq: mocks.profileRolesEq,
          })),
        };
      }
      if (table === "profile_skills") {
        return { select: mocks.profileSkillsSelect };
      }
      return {};
    }),
  }),
}));

vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    mocks.redirect(url);
    throw new Error(`NEXT_REDIRECT:${url}`);
  },
}));

vi.mock("@/features/plantel/PlantelList", () => ({
  PlantelList: ({ members }: { members: { id: string; name: string }[] }) => (
    <div data-testid="plantel-list">
      {members.map((member) => (
        <span key={member.id}>{member.name}</span>
      ))}
    </div>
  ),
}));

import PlantelPage from "./page";

const serranoProfiles = [
  {
    id: "p1",
    nombre: "Nóbel",
    apellido: "Dam",
    apodo: null,
    nombre_visible: "nombre_apellido",
    avatar_url: null,
    tier: "standard",
    disponibilidad: "disponible",
  },
];

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
  mocks.profilesOrder.mockResolvedValue({ data: serranoProfiles });
  mocks.profileRolesEq.mockResolvedValue({ data: [] });
  mocks.profileSkillsSelect.mockResolvedValue({ data: [] });
});

describe("PlantelPage", () => {
  it("redirects an unauthenticated user to /auth/login", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null } });
    await expect(PlantelPage()).rejects.toThrow("NEXT_REDIRECT:/auth/login");
    expect(mocks.redirect).toHaveBeenCalledWith("/auth/login");
  });

  it("selects only the list columns (never tarifa_hora) and filters out tourists", async () => {
    const element = await PlantelPage();
    render(element);

    const selected = mocks.profilesSelect.mock.calls[0][0] as string;
    expect(selected).toContain("nombre_visible");
    expect(selected).toContain("avatar_url");
    expect(selected).toContain("tier");
    expect(selected).toContain("disponibilidad");
    expect(selected).not.toContain("tarifa_hora");
    expect(selected).not.toContain("visibilidad_tarifa");

    expect(mocks.profilesNeq).toHaveBeenCalledWith("tier", "tourist");
  });

  it("renders the serrano members passed to PlantelList", async () => {
    const element = await PlantelPage();
    render(element);

    expect(screen.getByText("Nóbel Dam")).toBeInTheDocument();
  });

  it("fetches role and skill assignments for the plantel", async () => {
    await PlantelPage();
    expect(mocks.profileRolesSelect).toHaveBeenCalledWith("profile_id, roles(nombre)");
    expect(mocks.profileRolesEq).toHaveBeenCalledWith("confirmado", true);
    expect(mocks.profileSkillsSelect).toHaveBeenCalledWith("profile_id, skills(nombre)");
  });
});
