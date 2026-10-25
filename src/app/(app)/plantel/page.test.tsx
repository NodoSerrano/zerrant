import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  profilesSelect: vi.fn(),
  profilesNeq: vi.fn(),
  profilesOrder: vi.fn(),
  viewerTierEq: vi.fn(),
  viewerTierMaybeSingle: vi.fn(),
  profileRolesSelect: vi.fn(),
  profileRolesEq: vi.fn(),
  profileSkillsSelect: vi.fn(),
  rolesSelect: vi.fn(),
  rolesOrder: vi.fn(),
  skillsSelect: vi.fn(),
  skillsOrder: vi.fn(),
  skillsEq: vi.fn(),
  redirect: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: mocks.getUser },
    from: vi.fn((table: string) => {
      if (table === "profiles") {
        return {
          select: mocks.profilesSelect.mockImplementation((columns: string) => {
            if (columns === "tier") {
              return {
                eq: mocks.viewerTierEq.mockImplementation(() => ({
                  maybeSingle: mocks.viewerTierMaybeSingle,
                })),
              };
            }
            return {
              neq: mocks.profilesNeq.mockImplementation(() => ({
                order: mocks.profilesOrder,
              })),
            };
          }),
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
      if (table === "roles") {
        return {
          select: mocks.rolesSelect.mockImplementation(() => ({
            order: mocks.rolesOrder,
          })),
        };
      }
      if (table === "skills") {
        return {
          select: mocks.skillsSelect.mockImplementation(() => ({
            eq: mocks.skillsEq.mockImplementation(() => ({ order: mocks.skillsOrder })),
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
}));

vi.mock("@/features/membership/ser-serrano-cta-server", () => ({
  resolveSerSerranoCtaVisibility: vi.fn().mockResolvedValue(false),
}));

vi.mock("@/features/plantel/PlantelList", () => ({
  PlantelList: ({
    members,
    roleOptions,
    skillOptions,
  }: {
    members: { id: string; name: string }[];
    roleOptions?: string[];
    skillOptions?: string[];
  }) => (
    <div data-testid="plantel-list">
      {members.map((member) => (
        <span key={member.id}>{member.name}</span>
      ))}
      <span data-testid="role-options">{(roleOptions ?? []).join(",")}</span>
      <span data-testid="skill-options">{(skillOptions ?? []).join(",")}</span>
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
  },
];

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
  mocks.profilesOrder.mockResolvedValue({ data: serranoProfiles });
  mocks.viewerTierMaybeSingle.mockResolvedValue({ data: { tier: "standard" }, error: null });
  mocks.profileRolesEq.mockResolvedValue({ data: [] });
  mocks.profileSkillsSelect.mockResolvedValue({ data: [] });
  mocks.rolesOrder.mockResolvedValue({ data: [{ nombre: "Infra" }, { nombre: "Charlas" }] });
  mocks.skillsOrder.mockResolvedValue({ data: [{ nombre: "Solidity" }] });
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
    expect(selected).not.toContain("disponibilidad");
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

  it("passes role and skill catalogs to PlantelList", async () => {
    const element = await PlantelPage();
    render(element);

    expect(mocks.rolesSelect).toHaveBeenCalledWith("nombre");
    expect(mocks.skillsSelect).toHaveBeenCalledWith("nombre");
    // Pending proposals (ZER-163) never show up as filter options.
    expect(mocks.skillsEq).toHaveBeenCalledWith("estado", "aprobada");
    expect(screen.getByTestId("role-options")).toHaveTextContent("Infra,Charlas");
    expect(screen.getByTestId("skill-options")).toHaveTextContent("Solidity");
  });

  it("shows Ser Serrano CTA when visibility resolver says so (ZER-171)", async () => {
    const { resolveSerSerranoCtaVisibility } =
      await import("@/features/membership/ser-serrano-cta-server");
    mocks.viewerTierMaybeSingle.mockResolvedValueOnce({ data: { tier: "tourist" }, error: null });
    (resolveSerSerranoCtaVisibility as ReturnType<typeof vi.fn>).mockResolvedValueOnce(true);

    const element = await PlantelPage();
    render(element);

    const link = screen.getByRole("link", { name: "Ver beneficios" });
    const list = screen.getByTestId("plantel-list");
    expect(link).toHaveAttribute("href", "/ser-serrano");
    expect(list.parentElement).toHaveClass("gap-4");
    expect(list.parentElement).toContainElement(link);
    expect(resolveSerSerranoCtaVisibility).toHaveBeenCalledWith(
      "user-1",
      expect.objectContaining({ tier: "tourist" }),
    );
  });

  it("hides Ser Serrano CTA by default for members (ZER-171)", async () => {
    const { resolveSerSerranoCtaVisibility } =
      await import("@/features/membership/ser-serrano-cta-server");
    const element = await PlantelPage();
    const { container } = render(element);
    expect(screen.queryByRole("link", { name: "Ver beneficios" })).not.toBeInTheDocument();
    expect(container.querySelector(".gap-4")).not.toBeInTheDocument();
    expect(resolveSerSerranoCtaVisibility).toHaveBeenCalledWith(
      "user-1",
      expect.objectContaining({ tier: "standard" }),
    );
  });
});
