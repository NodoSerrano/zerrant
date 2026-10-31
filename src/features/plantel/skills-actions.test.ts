import { describe, expect, it, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  profilesSelectEq: vi.fn(),
  profilesSingle: vi.fn(),
  skillsSelect: vi.fn(),
  skillsEq: vi.fn(),
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
        return {
          select: mocks.skillsSelect.mockImplementation(() => ({ eq: mocks.skillsEq })),
        };
      }
      return {};
    }),
    rpc: mocks.rpc,
  }),
}));

vi.mock("next/cache", () => ({
  revalidatePath: (...args: unknown[]) => mocks.revalidatePath(...args),
}));

import { proposeSkill, reviewSkill, saveProfileSkills } from "./skills-actions";

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

function serranoUser(opts: { admin?: boolean } = {}) {
  mocks.getUser.mockResolvedValue({ data: { user: { id: "u1" } } });
  mocks.profilesSingle.mockResolvedValue({
    data: { tier: "standard", is_platform_admin: opts.admin ?? false },
    error: null,
  });
  mocks.skillsEq.mockResolvedValue({ data: CATALOG, error: null });
  mocks.rpc.mockResolvedValue({ data: { success: true }, error: null });
}

async function save(fd: FormData) {
  try {
    return await saveProfileSkills(null, fd);
  } catch {
    // redirect throws on success
    return undefined;
  }
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

  it("sends full skill ids, not the characters of the id string (ZER-216)", async () => {
    const solidity = "11111111-1111-4111-8111-111111111111";
    const rust = "22222222-2222-4222-8222-222222222222";
    serranoUser();
    mocks.skillsEq.mockResolvedValue({
      data: [
        { id: solidity, nombre: "Solidity" },
        { id: rust, nombre: "Rust" },
      ],
      error: null,
    });

    await save(formDataWith("Solidity", "Rust"));

    expect(mocks.rpc).toHaveBeenCalledWith("save_profile_skills", {
      p_skill_ids: [solidity, rust],
    });
  });

  it("saves the resolved approved catalog ids in a single RPC (ZER-216)", async () => {
    serranoUser();

    await save(formDataWith("Solidity", "Rust"));

    expect(mocks.skillsEq).toHaveBeenCalledWith("estado", "aprobada");
    expect(mocks.rpc).toHaveBeenCalledWith("save_profile_skills", { p_skill_ids: ["s1", "s2"] });
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/profile");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/profile/habilidades");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/plantel");
  });

  it("dedupes case-insensitive names and ignores names missing from the approved catalog", async () => {
    serranoUser();

    await save(formDataWith("solidity", " Solidity ", "Rust", "Cobol", "   "));

    expect(mocks.rpc).toHaveBeenCalledWith("save_profile_skills", { p_skill_ids: ["s1", "s2"] });
  });

  it("saves an empty list when the form has no skills", async () => {
    serranoUser();

    await save(formDataWith());

    expect(mocks.rpc).toHaveBeenCalledWith("save_profile_skills", { p_skill_ids: [] });
  });

  it("returns DB error when the catalog read fails", async () => {
    serranoUser();
    mocks.skillsEq.mockResolvedValue({ data: null, error: { message: "boom" } });

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

function proposal(nombre: string) {
  const fd = new FormData();
  fd.set("propuesta", nombre);
  return fd;
}

describe("proposeSkill (ZER-163)", () => {
  it("sends a new name for admin review", async () => {
    serranoUser();
    mocks.rpc.mockResolvedValue({
      data: { id: "n1", nombre: "Cerámica", estado: "pendiente", existing: false },
      error: null,
    });

    const result = await proposeSkill(null, proposal("  Cerámica "));

    expect(mocks.rpc).toHaveBeenCalledWith("propose_skill", { p_nombre: "Cerámica" });
    expect(result).toEqual({
      success: "Propusiste «Cerámica». Un admin la va a revisar.",
    });
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/profile/habilidades");
  });

  it("says when the skill already exists in the catalog", async () => {
    serranoUser();
    mocks.rpc.mockResolvedValue({
      data: { id: "s1", nombre: "Solidity", estado: "aprobada", existing: true },
      error: null,
    });

    const result = await proposeSkill(null, proposal("solidity"));

    expect(result).toEqual({
      success: "«Solidity» ya está en el catálogo: agregala desde las sugerencias.",
    });
  });

  it("says when the same skill is already waiting for review", async () => {
    serranoUser();
    mocks.rpc.mockResolvedValue({
      data: { id: "n1", nombre: "Cerámica", estado: "pendiente", existing: true },
      error: null,
    });

    const result = await proposeSkill(null, proposal("cerámica"));

    expect(result).toEqual({ success: "«Cerámica» ya está esperando la revisión de un admin." });
  });

  it("rejects an empty name without calling the database", async () => {
    serranoUser();

    const result = await proposeSkill(null, proposal("   "));

    expect(result).toEqual({ error: "Escribí el nombre de la habilidad" });
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("surfaces the database rejection", async () => {
    serranoUser();
    mocks.rpc.mockResolvedValue({
      data: {
        error: "La habilidad tiene que tener entre 1 y 40 caracteres",
        code: "invalid_nombre",
      },
      error: null,
    });

    const result = await proposeSkill(null, proposal("x".repeat(41)));

    expect(result).toEqual({ error: "La habilidad tiene que tener entre 1 y 40 caracteres" });
  });
});

function review(skillId: string, decision: string) {
  const fd = new FormData();
  fd.set("skillId", skillId);
  fd.set("decision", decision);
  return fd;
}

const SKILL_ID = "11111111-1111-4111-8111-111111111111";

describe("reviewSkill (ZER-163)", () => {
  it.each([
    ["aprobar", true, "Habilidad aprobada"],
    ["rechazar", false, "Propuesta rechazada"],
  ] as const)("lets an admin %s a proposal", async (decision, aprobar, message) => {
    serranoUser({ admin: true });

    const result = await reviewSkill(null, review(SKILL_ID, decision));

    expect(mocks.rpc).toHaveBeenCalledWith("review_skill", {
      p_skill_id: SKILL_ID,
      p_aprobar: aprobar,
    });
    expect(result).toEqual({ success: message });
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/admin/habilidades");
  });

  it("refuses non-admins without calling the database", async () => {
    serranoUser();

    const result = await reviewSkill(null, review(SKILL_ID, "aprobar"));

    expect(result).toEqual({ error: "Solo un admin puede revisar habilidades" });
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("rejects a malformed request", async () => {
    serranoUser({ admin: true });

    expect(await reviewSkill(null, review("nope", "aprobar"))).toEqual({
      error: "Pedido inválido",
    });
    expect(await reviewSkill(null, review(SKILL_ID, "tal-vez"))).toEqual({
      error: "Pedido inválido",
    });
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
});
