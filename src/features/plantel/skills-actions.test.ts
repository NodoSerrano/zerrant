import { describe, expect, it, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  skillsSelect: vi.fn(),
  profileSkillsSelectEq: vi.fn(),
  deleteIn: vi.fn(),
  upsert: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: mocks.getUser },
    from: vi.fn((table: string) => {
      if (table === "skills") {
        return { select: mocks.skillsSelect };
      }
      return {
        select: vi.fn(() => ({ eq: mocks.profileSkillsSelectEq })),
        delete: vi.fn(() => ({
          eq: vi.fn(() => ({ in: mocks.deleteIn })),
        })),
        upsert: mocks.upsert,
      };
    }),
  }),
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { saveProfileSkills } from "./skills-actions";

const CATALOG = [
  { id: "s1", nombre: "Solidity" },
  { id: "s2", nombre: "Rust" },
  { id: "s3", nombre: "DevOps" },
];

function formDataWith(...names: string[]): FormData {
  const fd = new FormData();
  for (const name of names) fd.append("skill", name);
  return fd;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("saveProfileSkills", () => {
  it("returns No autorizado when there is no user", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null } });

    const result = await saveProfileSkills(null, formDataWith("Solidity"));

    expect(result).toEqual({ error: "No autorizado" });
    expect(mocks.skillsSelect).not.toHaveBeenCalled();
  });

  it("deletes removed skills and inserts added ones", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: "u1" } } });
    mocks.skillsSelect.mockResolvedValue({ data: CATALOG, error: null });
    mocks.profileSkillsSelectEq.mockResolvedValue({
      data: [{ skill_id: "s1" }, { skill_id: "s3" }],
      error: null,
    });
    mocks.deleteIn.mockResolvedValue({ error: null });
    mocks.upsert.mockResolvedValue({ error: null });

    try {
      await saveProfileSkills(null, formDataWith("Solidity", "Rust"));
    } catch {
      // redirect throws
    }

    expect(mocks.deleteIn).toHaveBeenCalledWith("skill_id", ["s3"]);
    expect(mocks.upsert).toHaveBeenCalledWith([{ profile_id: "u1", skill_id: "s2" }], {
      onConflict: "profile_id,skill_id",
      ignoreDuplicates: true,
    });
  });

  it("dedupes case-insensitive names and ignores names missing from the catalog", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: "u1" } } });
    mocks.skillsSelect.mockResolvedValue({ data: CATALOG, error: null });
    mocks.profileSkillsSelectEq.mockResolvedValue({ data: [], error: null });
    mocks.upsert.mockResolvedValue({ error: null });

    try {
      await saveProfileSkills(null, formDataWith("solidity", "Solidity", "Rust", "Cobol"));
    } catch {
      // redirect throws
    }

    expect(mocks.upsert).toHaveBeenCalledWith(
      [
        { profile_id: "u1", skill_id: "s1" },
        { profile_id: "u1", skill_id: "s2" },
      ],
      { onConflict: "profile_id,skill_id", ignoreDuplicates: true },
    );
  });

  it("skips DB writes when nothing changed", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: "u1" } } });
    mocks.skillsSelect.mockResolvedValue({ data: CATALOG, error: null });
    mocks.profileSkillsSelectEq.mockResolvedValue({ data: [{ skill_id: "s1" }], error: null });

    try {
      await saveProfileSkills(null, formDataWith("Solidity"));
    } catch {
      // redirect throws
    }

    expect(mocks.deleteIn).not.toHaveBeenCalled();
    expect(mocks.upsert).not.toHaveBeenCalled();
  });

  it("returns DB error when the catalog read fails", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: "u1" } } });
    mocks.skillsSelect.mockResolvedValue({ data: null, error: { message: "boom" } });

    const result = await saveProfileSkills(null, formDataWith("Solidity"));

    expect(result).toEqual({ error: "No pudimos guardar tus habilidades. Probá de nuevo." });
    expect(mocks.upsert).not.toHaveBeenCalled();
  });

  it("returns DB error and stops before insert when delete fails", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: "u1" } } });
    mocks.skillsSelect.mockResolvedValue({ data: CATALOG, error: null });
    mocks.profileSkillsSelectEq.mockResolvedValue({ data: [{ skill_id: "s1" }], error: null });
    mocks.deleteIn.mockResolvedValue({ error: { message: "boom" } });

    const result = await saveProfileSkills(null, formDataWith());

    expect(result).toEqual({ error: "No pudimos guardar tus habilidades. Probá de nuevo." });
    expect(mocks.upsert).not.toHaveBeenCalled();
  });

  it("returns DB error when insert fails", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: "u1" } } });
    mocks.skillsSelect.mockResolvedValue({ data: CATALOG, error: null });
    mocks.profileSkillsSelectEq.mockResolvedValue({ data: [], error: null });
    mocks.upsert.mockResolvedValue({ error: { message: "boom" } });

    const result = await saveProfileSkills(null, formDataWith("Solidity"));

    expect(result).toEqual({ error: "No pudimos guardar tus habilidades. Probá de nuevo." });
  });
});
