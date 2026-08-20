import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  profilesSelect: vi.fn(),
  profilesEq: vi.fn(),
  profilesSingle: vi.fn(),
  profileSkillsSelect: vi.fn(),
  profileSkillsEq: vi.fn(),
  skillsSelect: vi.fn(),
  skillsOrder: vi.fn(),
  redirect: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: mocks.getUser },
    from: vi.fn((table: string) => {
      if (table === "profiles") {
        return {
          select: mocks.profilesSelect.mockImplementation(() => ({
            eq: mocks.profilesEq.mockImplementation(() => ({ single: mocks.profilesSingle })),
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
      if (table === "skills") {
        return {
          select: mocks.skillsSelect.mockImplementation(() => ({
            order: mocks.skillsOrder,
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

vi.mock("@/features/plantel/EditSkills", () => ({
  EditSkills: ({ initialSkills, catalog }: { initialSkills: string[]; catalog: string[] }) => (
    <div data-testid="edit-skills">
      {initialSkills.map((skill) => (
        <span key={skill} data-testid="initial-skill">
          {skill}
        </span>
      ))}
      {catalog.map((skill) => (
        <span key={skill} data-testid="catalog-skill">
          {skill}
        </span>
      ))}
    </div>
  ),
}));

import HabilidadesPage from "./page";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
  mocks.profilesSingle.mockResolvedValue({ data: { tier: "standard" }, error: null });
  mocks.profileSkillsEq.mockResolvedValue({
    data: [{ skills: { nombre: "Solidity" } }, { skills: null }],
  });
  mocks.skillsOrder.mockResolvedValue({ data: [{ nombre: "Rust" }, { nombre: "Solidity" }] });
});

describe("HabilidadesPage", () => {
  it("redirects an unauthenticated user to /auth/login", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null } });
    await expect(HabilidadesPage()).rejects.toThrow("NEXT_REDIRECT:/auth/login");
    expect(mocks.redirect).toHaveBeenCalledWith("/auth/login");
  });

  it("redirects a tourist to /profile", async () => {
    mocks.profilesSingle.mockResolvedValue({ data: { tier: "tourist" }, error: null });
    await expect(HabilidadesPage()).rejects.toThrow("NEXT_REDIRECT:/profile");
    expect(mocks.redirect).toHaveBeenCalledWith("/profile");
  });

  it("redirects to /onboarding/step1 when the profile does not exist", async () => {
    mocks.profilesSingle.mockResolvedValue({ data: null, error: { message: "no row" } });
    await expect(HabilidadesPage()).rejects.toThrow("NEXT_REDIRECT:/onboarding/step1");
    expect(mocks.redirect).toHaveBeenCalledWith("/onboarding/step1");
  });

  it("loads the current skills and the catalog and passes them to EditSkills", async () => {
    const element = await HabilidadesPage();
    render(element);

    expect(mocks.profileSkillsSelect).toHaveBeenCalledWith("skills(nombre)");
    expect(mocks.profileSkillsEq).toHaveBeenCalledWith("profile_id", "user-1");
    expect(mocks.skillsOrder).toHaveBeenCalledWith("nombre");

    const initial = screen.getAllByTestId("initial-skill").map((el) => el.textContent);
    const catalog = screen.getAllByTestId("catalog-skill").map((el) => el.textContent);

    expect(initial).toEqual(["Solidity"]);
    expect(catalog).toEqual(["Rust", "Solidity"]);
  });
});
