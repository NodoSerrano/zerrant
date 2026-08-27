import { describe, expect, it, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  profilesSelectEq: vi.fn(),
  profilesSingle: vi.fn(),
  skillsSelect: vi.fn(),
  rpc: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: mocks.getUser },
    from: vi.fn((table: string) => {
      if (table === "profiles") {
        return {
          select: vi.fn(() => ({
            eq: mocks.profilesSelectEq.mockImplementation(() => ({
              single: mocks.profilesSingle,
            })),
          })),
        };
      }
      if (table === "skills") {
        return { select: mocks.skillsSelect };
      }
      return {};
    }),
    rpc: mocks.rpc,
  }),
}));

vi.mock("next/cache", () => ({
  revalidatePath: (...args: unknown[]) => mocks.revalidatePath(...args),
}));

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

function serranoUser() {
  mocks.getUser.mockResolvedValue({ data: { user: { id: "u1" } } });
  mocks.profilesSingle.mockResolvedValue({ data: { tier: "standard" }, error: null });
  mocks.skillsSelect.mockResolvedValue({ data: CATALOG, error: null });
  mocks.rpc.mockResolvedValue({ data: { success: true }, error: null });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("saveProfileSkills", () => {
  it("returns No autorizado when there is no user", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null } });

    const result = await saveProfileSkills(null, formDataWith("Solidity"));

    expect(result).toEqual({ error: "No autorizado" });
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("returns No autorizado when the caller is a tourist", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: "u1" } } });
    mocks.profilesSingle.mockResolvedValue({ data: { tier: "tourist" }, error: null });

    const result = await saveProfileSkills(null, formDataWith("Solidity"));

    expect(result).toEqual({ error: "No autorizado" });
    expect(mocks.rpc).not.toHaveBeenCalled();
    expect(mocks.skillsSelect).not.toHaveBeenCalled();
  });

  it("returns No autorizado when the profile is missing", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: "u1" } } });
    mocks.profilesSingle.mockResolvedValue({ data: null, error: { message: "no row" } });

    const result = await saveProfileSkills(null, formDataWith("Solidity"));

    expect(result).toEqual({ error: "No autorizado" });
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("syncs skills via a single RPC with resolved catalog ids", async () => {
    serranoUser();

    try {
      await saveProfileSkills(null, formDataWith("Solidity", "Rust"));
    } catch {
      // redirect throws
    }

    expect(mocks.rpc).toHaveBeenCalledWith("sync_profile_skills", {
      p_skill_ids: ["s1", "s2"],
    });
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/profile");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/plantel");
  });

  it("dedupes case-insensitive names and ignores names missing from the catalog", async () => {
    serranoUser();

    try {
      await saveProfileSkills(null, formDataWith("solidity", "Solidity", "Rust", "Cobol"));
    } catch {
      // redirect throws
    }

    expect(mocks.rpc).toHaveBeenCalledWith("sync_profile_skills", {
      p_skill_ids: ["s1", "s2"],
    });
  });

  it("syncs an empty skill list when the form has no skills", async () => {
    serranoUser();

    try {
      await saveProfileSkills(null, formDataWith());
    } catch {
      // redirect throws
    }

    expect(mocks.rpc).toHaveBeenCalledWith("sync_profile_skills", {
      p_skill_ids: [],
    });
  });

  it("returns DB error when the catalog read fails", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: "u1" } } });
    mocks.profilesSingle.mockResolvedValue({ data: { tier: "standard" }, error: null });
    mocks.skillsSelect.mockResolvedValue({ data: null, error: { message: "boom" } });

    const result = await saveProfileSkills(null, formDataWith("Solidity"));

    expect(result).toEqual({ error: "No pudimos guardar tus habilidades. Probá de nuevo." });
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("returns DB error when the RPC fails", async () => {
    serranoUser();
    mocks.rpc.mockResolvedValue({ data: null, error: { message: "boom" } });

    const result = await saveProfileSkills(null, formDataWith("Solidity"));

    expect(result).toEqual({ error: "No pudimos guardar tus habilidades. Probá de nuevo." });
  });

  it("returns the RPC business error when the function rejects the caller", async () => {
    serranoUser();
    mocks.rpc.mockResolvedValue({ data: { error: "No autorizado" }, error: null });

    const result = await saveProfileSkills(null, formDataWith("Solidity"));

    expect(result).toEqual({ error: "No autorizado" });
  });
});
