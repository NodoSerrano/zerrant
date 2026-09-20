import { describe, expect, it, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  profilesSelect: vi.fn(),
  profilesSelectEq: vi.fn(),
  profilesSelectSingle: vi.fn(),
  projectsInsert: vi.fn(),
  projectsInsertSelect: vi.fn(),
  projectsInsertPayload: null as unknown,
  projectsReadSelect: vi.fn(),
  projectsEq: vi.fn(),
  projectsMaybeSingle: vi.fn(),
  membersInsert: vi.fn(),
  membersSelect: vi.fn(),
  membersInsertPayload: null as unknown,
  membersUpdate: vi.fn(),
  membersUpdatePayload: null as unknown,
  membersUpdateEq: vi.fn(),
  membersUpdateSelect: vi.fn(),
  membersDelete: vi.fn(),
  membersDeleteEq: vi.fn(),
  membersDeleteSelect: vi.fn(),
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
              select: mocks.projectsInsertSelect,
            };
          }),
          select: mocks.projectsReadSelect.mockImplementation(() => ({
            eq: mocks.projectsEq.mockImplementation(() => ({
              maybeSingle: mocks.projectsMaybeSingle,
            })),
          })),
        };
      }
      if (table === "project_members") {
        return {
          insert: mocks.membersInsert.mockImplementation((payload: unknown) => {
            mocks.membersInsertPayload = payload;
            return {
              select: mocks.membersSelect,
            };
          }),
          update: mocks.membersUpdate.mockImplementation((payload: unknown) => {
            mocks.membersUpdatePayload = payload;
            const chain = {
              eq: mocks.membersUpdateEq.mockImplementation(() => chain),
              select: mocks.membersUpdateSelect,
            };
            return chain;
          }),
          delete: mocks.membersDelete.mockImplementation(() => {
            const chain = {
              eq: mocks.membersDeleteEq.mockImplementation(() => chain),
              select: mocks.membersDeleteSelect,
            };
            return chain;
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

import { approveProjectJoin, createProject, joinProject, rejectProjectJoin } from "./actions";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.projectsInsertPayload = null;
  mocks.membersInsertPayload = null;
  mocks.membersUpdatePayload = null;
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
    mocks.projectsInsertSelect.mockResolvedValue({ error: null, data: [{ id: "proj-1" }] });

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
    mocks.projectsInsertSelect.mockResolvedValue({ error: null, data: [{ id: "proj-1" }] });

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
    mocks.projectsInsertSelect.mockResolvedValue({ error: null, data: [{ id: "proj-1" }] });

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
    mocks.projectsInsertSelect.mockResolvedValue({ error: { message: "rls" }, data: null });

    const result = await createProject(null, makeFormData());

    expect(result).toEqual({ error: "No pudimos crear el proyecto. Probá de nuevo." });
  });

  it("treats a zero-row insert as failure", async () => {
    setupAuth();
    mocks.profilesSelectSingle.mockResolvedValue({ data: { tier: "standard" } });
    mocks.projectsInsertSelect.mockResolvedValue({ error: null, data: [] });

    const result = await createProject(null, makeFormData());

    expect(result).toEqual({ error: "No pudimos crear el proyecto." });
  });
});

function makeJoinForm(projectId = "proj-1") {
  const fd = new FormData();
  fd.set("projectId", projectId);
  return fd;
}

describe("joinProject", () => {
  it("inserts aprobado for an abierto project and revalidates the detail route", async () => {
    setupAuth("serrano-1");
    mocks.profilesSelectSingle.mockResolvedValue({ data: { tier: "standard" } });
    mocks.projectsMaybeSingle.mockResolvedValue({
      data: { id: "proj-1", ingreso: "abierto" },
      error: null,
    });
    mocks.membersSelect.mockResolvedValue({ error: null, data: [{ project_id: "proj-1" }] });

    const result = await joinProject(null, makeJoinForm());

    expect(result).toBeNull();
    expect(mocks.membersInsertPayload).toEqual({
      project_id: "proj-1",
      profile_id: "serrano-1",
      estado: "aprobado",
    });
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/nodo/projects/proj-1");
  });

  it("inserts pendiente for an aprobacion project", async () => {
    setupAuth("serrano-1");
    mocks.profilesSelectSingle.mockResolvedValue({ data: { tier: "standard" } });
    mocks.projectsMaybeSingle.mockResolvedValue({
      data: { id: "proj-2", ingreso: "aprobacion" },
      error: null,
    });
    mocks.membersSelect.mockResolvedValue({ error: null, data: [{ project_id: "proj-2" }] });

    const result = await joinProject(null, makeJoinForm("proj-2"));

    expect(result).toBeNull();
    expect(mocks.membersInsertPayload).toEqual({
      project_id: "proj-2",
      profile_id: "serrano-1",
      estado: "pendiente",
    });
  });

  it("maps 23505 on abierto to Ya sos parte de este proyecto", async () => {
    setupAuth("serrano-1");
    mocks.profilesSelectSingle.mockResolvedValue({ data: { tier: "standard" } });
    mocks.projectsMaybeSingle.mockResolvedValue({
      data: { id: "proj-1", ingreso: "abierto" },
      error: null,
    });
    mocks.membersSelect.mockResolvedValue({
      error: { code: "23505", message: "duplicate" },
      data: null,
    });

    const result = await joinProject(null, makeJoinForm());

    expect(result).toEqual({ error: "Ya sos parte de este proyecto." });
  });

  it("maps 23505 on aprobacion to Ya enviaste una solicitud", async () => {
    setupAuth("serrano-1");
    mocks.profilesSelectSingle.mockResolvedValue({ data: { tier: "standard" } });
    mocks.projectsMaybeSingle.mockResolvedValue({
      data: { id: "proj-2", ingreso: "aprobacion" },
      error: null,
    });
    mocks.membersSelect.mockResolvedValue({
      error: { code: "23505", message: "duplicate" },
      data: null,
    });

    const result = await joinProject(null, makeJoinForm("proj-2"));

    expect(result).toEqual({ error: "Ya enviaste una solicitud." });
  });

  it("treats a zero-row insert as failure", async () => {
    setupAuth("serrano-1");
    mocks.profilesSelectSingle.mockResolvedValue({ data: { tier: "standard" } });
    mocks.projectsMaybeSingle.mockResolvedValue({
      data: { id: "proj-1", ingreso: "abierto" },
      error: null,
    });
    mocks.membersSelect.mockResolvedValue({ error: null, data: [] });

    const result = await joinProject(null, makeJoinForm());

    expect(result).toEqual({ error: "No pudimos unirte al proyecto." });
  });

  it("blocks tourists before any insert", async () => {
    setupAuth("tourist-1");
    mocks.profilesSelectSingle.mockResolvedValue({ data: { tier: "tourist" } });

    const result = await joinProject(null, makeJoinForm());

    expect(result).toEqual({ error: "Solo los serranos pueden unirse a proyectos" });
    expect(mocks.membersInsert).not.toHaveBeenCalled();
  });

  it("returns unauthorized when there is no session", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null } });

    const result = await joinProject(null, makeJoinForm());

    expect(result).toEqual({ error: "No autorizado" });
    expect(mocks.membersInsert).not.toHaveBeenCalled();
  });
});

function makeQueueForm(projectId = "proj-1", profileId = "u2") {
  const fd = new FormData();
  fd.set("projectId", projectId);
  fd.set("profileId", profileId);
  return fd;
}

describe("approveProjectJoin", () => {
  it("updates only estado to aprobado for the matching pendiente row", async () => {
    setupAuth("admin-1");
    mocks.membersUpdateSelect.mockResolvedValue({
      error: null,
      data: [{ profile_id: "u2" }],
    });

    const result = await approveProjectJoin(null, makeQueueForm());

    expect(result).toBeNull();
    expect(mocks.membersUpdatePayload).toEqual({ estado: "aprobado" });
    expect(mocks.membersUpdateEq).toHaveBeenCalledWith("project_id", "proj-1");
    expect(mocks.membersUpdateEq).toHaveBeenCalledWith("profile_id", "u2");
    expect(mocks.membersUpdateEq).toHaveBeenCalledWith("estado", "pendiente");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/nodo/projects/proj-1/requests");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/nodo/projects/proj-1");
  });

  it("treats a zero-row update as failure, not success", async () => {
    setupAuth("admin-1");
    mocks.membersUpdateSelect.mockResolvedValue({ error: null, data: [] });

    const result = await approveProjectJoin(null, makeQueueForm());

    expect(result).toEqual({ error: "No pudimos aprobar esta solicitud." });
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });

  it("surfaces a Spanish error when the update fails", async () => {
    setupAuth("admin-1");
    mocks.membersUpdateSelect.mockResolvedValue({ error: { message: "rls" }, data: null });

    const result = await approveProjectJoin(null, makeQueueForm());

    expect(result).toEqual({ error: "No pudimos aprobar la solicitud. Probá de nuevo." });
  });

  it("returns unauthorized without a session", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null } });
    const result = await approveProjectJoin(null, makeQueueForm());
    expect(result).toEqual({ error: "No autorizado" });
    expect(mocks.membersUpdate).not.toHaveBeenCalled();
  });
});

describe("rejectProjectJoin", () => {
  it("deletes the matching pendiente row", async () => {
    setupAuth("admin-1");
    mocks.membersDeleteSelect.mockResolvedValue({
      error: null,
      data: [{ profile_id: "u2" }],
    });

    const result = await rejectProjectJoin(null, makeQueueForm());

    expect(result).toBeNull();
    expect(mocks.membersDeleteEq).toHaveBeenCalledWith("project_id", "proj-1");
    expect(mocks.membersDeleteEq).toHaveBeenCalledWith("profile_id", "u2");
    expect(mocks.membersDeleteEq).toHaveBeenCalledWith("estado", "pendiente");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/nodo/projects/proj-1/requests");
  });

  it("treats a zero-row delete as failure", async () => {
    setupAuth("admin-1");
    mocks.membersDeleteSelect.mockResolvedValue({ error: null, data: [] });

    const result = await rejectProjectJoin(null, makeQueueForm());

    expect(result).toEqual({ error: "No pudimos rechazar esta solicitud." });
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });

  it("surfaces a Spanish error when the delete fails", async () => {
    setupAuth("admin-1");
    mocks.membersDeleteSelect.mockResolvedValue({ error: { message: "rls" }, data: null });

    const result = await rejectProjectJoin(null, makeQueueForm());

    expect(result).toEqual({ error: "No pudimos rechazar la solicitud. Probá de nuevo." });
  });
});
