import { describe, expect, it, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  profilesSelect: vi.fn(),
  profilesSelectEq: vi.fn(),
  profilesSelectSingle: vi.fn(),
  projectsInsert: vi.fn(),
  projectsSelect: vi.fn(),
  projectsInsertPayload: null as unknown,
  revalidatePath: vi.fn(),
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: mocks.getUser },
    from: vi.fn((table: string) => {
      if (table === "profiles") {
        return {
          select: mocks.profilesSelect.mockImplementation(() => ({
            eq: mocks.profilesSelectEq.mockImplementation(() => ({
              single: mocks.profilesSelectSingle,
            })),
          })),
        };
      }
      if (table === "projects") {
        return {
          insert: mocks.projectsInsert.mockImplementation((payload: unknown) => {
            mocks.projectsInsertPayload = payload;
            return {
              select: mocks.projectsSelect,
            };
          }),
        };
      }
      return {};
    }),
  }),
}));

vi.mock("next/cache", () => ({
  revalidatePath: (...args: unknown[]) => mocks.revalidatePath(...args),
}));

vi.mock("next/navigation", () => ({
  redirect: (url: string) => mocks.redirect(url),
}));

import { createProject } from "./actions";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.projectsInsertPayload = null;
});

function setupAuth(userId = "serrano-1") {
  mocks.getUser.mockResolvedValue({ data: { user: { id: userId } } });
}

function makeFormData(overrides: Record<string, string> = {}) {
  const fd = new FormData();
  fd.set("nombre", "Huerta comun");
  fd.set("descripcion", "Lote 3 del predio");
  fd.set("estado", "idea");
  fd.set("ingreso", "aprobacion");
  for (const [k, v] of Object.entries(overrides)) {
    fd.set(k, v);
  }
  return fd;
}

describe("createProject", () => {
  it("inserts the project with creado_por and redirects to the list on success", async () => {
    setupAuth("serrano-1");
    mocks.profilesSelectSingle.mockResolvedValue({ data: { tier: "standard" } });
    mocks.projectsSelect.mockResolvedValue({ error: null, data: [{ id: "proj-1" }] });

    await expect(createProject(null, makeFormData())).rejects.toThrow(
      "NEXT_REDIRECT:/nodo/projects",
    );

    expect(mocks.projectsInsertPayload).toEqual({
      nombre: "Huerta comun",
      descripcion: "Lote 3 del predio",
      estado: "idea",
      ingreso: "aprobacion",
      creado_por: "serrano-1",
    });
    // Creator admin seating is the AFTER INSERT trigger from ZER-78 — not a second client write.
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/nodo/projects");
  });

  it("trims nombre and descripcion before writing", async () => {
    setupAuth();
    mocks.profilesSelectSingle.mockResolvedValue({ data: { tier: "standard" } });
    mocks.projectsSelect.mockResolvedValue({ error: null, data: [{ id: "proj-1" }] });

    await expect(
      createProject(
        null,
        makeFormData({
          nombre: "  Huerta comun  ",
          descripcion: "  Lote 3  ",
        }),
      ),
    ).rejects.toThrow("NEXT_REDIRECT");

    expect(mocks.projectsInsertPayload).toEqual(
      expect.objectContaining({
        nombre: "Huerta comun",
        descripcion: "Lote 3",
      }),
    );
  });

  it("stores blank descripcion as null", async () => {
    setupAuth();
    mocks.profilesSelectSingle.mockResolvedValue({ data: { tier: "standard" } });
    mocks.projectsSelect.mockResolvedValue({ error: null, data: [{ id: "proj-1" }] });

    await expect(createProject(null, makeFormData({ descripcion: "   " }))).rejects.toThrow(
      "NEXT_REDIRECT",
    );

    expect(mocks.projectsInsertPayload).toEqual(expect.objectContaining({ descripcion: null }));
  });

  it("rejects a blank nombre without writing", async () => {
    setupAuth();
    mocks.profilesSelectSingle.mockResolvedValue({ data: { tier: "standard" } });

    const result = await createProject(null, makeFormData({ nombre: "   " }));

    expect(result).toEqual({ error: "El nombre no puede estar vacío" });
    expect(mocks.projectsInsert).not.toHaveBeenCalled();
  });

  it("rejects an invalid estado without casting", async () => {
    setupAuth();
    mocks.profilesSelectSingle.mockResolvedValue({ data: { tier: "standard" } });

    const result = await createProject(null, makeFormData({ estado: "activo" }));

    expect(result).toEqual({ error: "Revisá los datos del proyecto." });
    expect(mocks.projectsInsert).not.toHaveBeenCalled();
  });

  it("rejects an invalid ingreso without casting", async () => {
    setupAuth();
    mocks.profilesSelectSingle.mockResolvedValue({ data: { tier: "standard" } });

    const result = await createProject(null, makeFormData({ ingreso: "libre" }));

    expect(result).toEqual({ error: "Revisá los datos del proyecto." });
    expect(mocks.projectsInsert).not.toHaveBeenCalled();
  });

  it("blocks tourists before any insert", async () => {
    setupAuth("tourist-1");
    mocks.profilesSelectSingle.mockResolvedValue({ data: { tier: "tourist" } });

    const result = await createProject(null, makeFormData());

    expect(result).toEqual({ error: "Solo los serranos pueden crear proyectos" });
    expect(mocks.projectsInsert).not.toHaveBeenCalled();
  });

  it("returns unauthorized when there is no session", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null } });

    const result = await createProject(null, makeFormData());

    expect(result).toEqual({ error: "No autorizado" });
    expect(mocks.projectsInsert).not.toHaveBeenCalled();
  });

  it("surfaces a Spanish error when the insert fails", async () => {
    setupAuth();
    mocks.profilesSelectSingle.mockResolvedValue({ data: { tier: "standard" } });
    mocks.projectsSelect.mockResolvedValue({ error: { message: "rls" }, data: null });

    const result = await createProject(null, makeFormData());

    expect(result).toEqual({ error: "No pudimos crear el proyecto. Probá de nuevo." });
  });

  it("treats a zero-row insert as failure", async () => {
    setupAuth();
    mocks.profilesSelectSingle.mockResolvedValue({ data: { tier: "standard" } });
    mocks.projectsSelect.mockResolvedValue({ error: null, data: [] });

    const result = await createProject(null, makeFormData());

    expect(result).toEqual({ error: "No pudimos crear el proyecto." });
  });
});
