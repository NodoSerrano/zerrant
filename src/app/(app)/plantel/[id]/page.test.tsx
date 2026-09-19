import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  profilesSelect: vi.fn(),
  profilesEq: vi.fn(),
  profileMaybeSingle: vi.fn(),
  profileRolesSelect: vi.fn(),
  profileRolesEqProfile: vi.fn(),
  profileRolesEqConfirmado: vi.fn(),
  profileSkillsSelect: vi.fn(),
  profileSkillsEq: vi.fn(),
  viewerProfilesSelect: vi.fn(),
  viewerProfilesEq: vi.fn(),
  viewerProfilesSingle: vi.fn(),
  redirect: vi.fn(),
  notFound: vi.fn(),
  from: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: mocks.getUser },
    from: mocks.from.mockImplementation((table: string) => {
      if (table === "profiles_with_rate") {
        return {
          select: mocks.profilesSelect.mockImplementation(() => ({
            eq: mocks.profilesEq.mockImplementation(() => ({
              maybeSingle: mocks.profileMaybeSingle,
            })),
          })),
        };
      }
      if (table === "profiles") {
        return {
          select: mocks.viewerProfilesSelect.mockImplementation(() => ({
            eq: mocks.viewerProfilesEq.mockImplementation(() => ({
              single: mocks.viewerProfilesSingle,
            })),
          })),
        };
      }
      if (table === "profile_roles") {
        return {
          select: mocks.profileRolesSelect.mockImplementation(() => ({
            eq: mocks.profileRolesEqProfile.mockImplementation(() => ({
              eq: mocks.profileRolesEqConfirmado,
            })),
          })),
        };
      }
      if (table === "profile_skills") {
        return {
          select: mocks.profileSkillsSelect.mockImplementation(() => ({
            eq: mocks.profileSkillsEq,
          })),
        };
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
  notFound: () => {
    mocks.notFound();
    throw new Error("NEXT_NOT_FOUND");
  },
}));

vi.mock("@/features/plantel/MemberDetail", () => ({
  MemberDetail: ({ member }: { member: { id: string; name: string } }) => (
    <div data-testid="member-detail">{member.name}</div>
  ),
}));

import PlantelMemberPage from "./page";

const serranoRow = {
  id: "p1",
  nombre: "Nóbel",
  apellido: "Dam",
  apodo: null,
  nombre_visible: "nombre_apellido",
  avatar_url: null,
  tier: "standard",
  disponibilidad: "disponible",
  bio: "Construyo infraestructura.",
  contacto_telegram: "@nobel",
  tarifa_hora: 40,
  visibilidad_tarifa: "privada",
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getUser.mockResolvedValue({ data: { user: { id: "viewer-1" } } });
  mocks.profileMaybeSingle.mockResolvedValue({ data: serranoRow });
  mocks.profileRolesEqConfirmado.mockResolvedValue({ data: [{ roles: { nombre: "Infra" } }] });
  mocks.profileSkillsEq.mockResolvedValue({ data: [{ skills: { nombre: "Solidity" } }] });
  mocks.viewerProfilesSingle.mockResolvedValue({
    data: { id: "viewer-1", is_platform_admin: false, tier: "standard" },
  });
});

describe("PlantelMemberPage", () => {
  it("redirects an unauthenticated user to /auth/login", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null } });
    await expect(PlantelMemberPage({ params: Promise.resolve({ id: "p1" }) })).rejects.toThrow(
      "NEXT_REDIRECT:/auth/login",
    );
    expect(mocks.redirect).toHaveBeenCalledWith("/auth/login");
  });

  it("redirects a tourist profile to /plantel", async () => {
    mocks.profileMaybeSingle.mockResolvedValue({ data: { ...serranoRow, tier: "tourist" } });
    await expect(PlantelMemberPage({ params: Promise.resolve({ id: "p1" }) })).rejects.toThrow(
      "NEXT_REDIRECT:/plantel",
    );
    expect(mocks.redirect).toHaveBeenCalledWith("/plantel");
  });

  it("calls notFound for a missing row", async () => {
    mocks.profileMaybeSingle.mockResolvedValue({ data: null });
    await expect(PlantelMemberPage({ params: Promise.resolve({ id: "missing" }) })).rejects.toThrow(
      "NEXT_NOT_FOUND",
    );
    expect(mocks.notFound).toHaveBeenCalled();
  });

  it("reads detail from profiles_with_rate and renders MemberDetail", async () => {
    const element = await PlantelMemberPage({ params: Promise.resolve({ id: "p1" }) });
    render(element);

    expect(mocks.from).toHaveBeenCalledWith("profiles_with_rate");
    const selected = mocks.profilesSelect.mock.calls[0][0] as string;
    expect(selected).toContain("bio");
    expect(selected).toContain("contacto_telegram");
    expect(selected).toContain("tarifa_hora");
    expect(selected).toContain("visibilidad_tarifa");

    expect(screen.getByTestId("member-detail")).toBeInTheDocument();
  });

  it("fetches confirmed roles and skills for the profile", async () => {
    await PlantelMemberPage({ params: Promise.resolve({ id: "p1" }) });
    expect(mocks.profileRolesSelect).toHaveBeenCalledWith("roles(nombre)");
    expect(mocks.profileRolesEqProfile).toHaveBeenCalledWith("profile_id", "p1");
    expect(mocks.profileRolesEqConfirmado).toHaveBeenCalledWith("confirmado", true);
    expect(mocks.profileSkillsSelect).toHaveBeenCalledWith("skills(nombre)");
    expect(mocks.profileSkillsEq).toHaveBeenCalledWith("profile_id", "p1");
  });

  it("resolves the viewer profile for admin/tarifa visibility", async () => {
    await PlantelMemberPage({ params: Promise.resolve({ id: "p1" }) });
    expect(mocks.viewerProfilesSelect).toHaveBeenCalledWith("id, is_platform_admin, tier");
    expect(mocks.viewerProfilesEq).toHaveBeenCalledWith("id", "viewer-1");
  });
});
