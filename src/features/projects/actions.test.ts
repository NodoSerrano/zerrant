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
  projectsUpdate: vi.fn(),
  projectsUpdatePayload: null as unknown,
  projectsUpdateEq: vi.fn(),
  projectsUpdateSelect: vi.fn(),
  projectsUpdateIs: vi.fn(),
  projectsUpdateNot: vi.fn(),
  projectsDelete: vi.fn(),
  membersInsert: vi.fn(),
  membersSelect: vi.fn(),
  membersInsertPayload: null as unknown,
  membersUpdate: vi.fn(),
  membersUpdatePayload: null as unknown,
  membersUpdateEq: vi.fn(),
  membersUpdateIn: vi.fn(),
  membersUpdateNot: vi.fn(),
  membersUpdateSelect: vi.fn(),
  membersDelete: vi.fn(),
  membersDeleteEq: vi.fn(),
  membersDeleteSelect: vi.fn(),
  membersMaybeSingle: vi.fn(),
  membersReadSelect: vi.fn(),
  membersReadEq: vi.fn(),
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
          update: mocks.projectsUpdate.mockImplementation((payload: unknown) => {
            mocks.projectsUpdatePayload = payload;
            return {
              eq: mocks.projectsUpdateEq.mockImplementation(() => ({
                select: mocks.projectsUpdateSelect,
                is: mocks.projectsUpdateIs.mockImplementation(() => ({
                  select: mocks.projectsUpdateSelect,
                })),
                not: mocks.projectsUpdateNot.mockImplementation(() => ({
                  select: mocks.projectsUpdateSelect,
                })),
              })),
            };
          }),
          delete: mocks.projectsDelete,
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
          select: mocks.membersReadSelect.mockImplementation(() => {
            const chain = {
              eq: mocks.membersReadEq.mockImplementation(() => chain),
              maybeSingle: mocks.membersMaybeSingle,
            };
            return chain;
          }),
          update: mocks.membersUpdate.mockImplementation((payload: unknown) => {
            mocks.membersUpdatePayload = payload;
            const chain = {
              eq: mocks.membersUpdateEq.mockImplementation(() => chain),
              in: mocks.membersUpdateIn.mockImplementation(() => chain),
              not: mocks.membersUpdateNot.mockImplementation(() => chain),
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

import {
  approveProjectJoin,
  archiveProject,
  unarchiveProject,
  demoteProjectMember,
  dismissProjectJoinNotice,
  leaveProject,
  createProject,
  joinProject,
  promoteProjectMember,
  rejectProjectJoin,
  updateProject,
} from "./actions";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.projectsInsertPayload = null;
  mocks.projectsUpdatePayload = null;
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
      "NEXT_REDIRECT:/nodo/projects?ok=proyecto-creado",
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

  it("does not create a project as Terminado (ZER-201)", async () => {
    setupAuth();
    mocks.profilesSelectSingle.mockResolvedValue({ data: { tier: "standard" } });

    const result = await createProject(null, makeFormData({ estado: "terminado" }));

    expect(result).toEqual({ error: "Revisá los datos del proyecto." });
    expect(mocks.projectsInsert).not.toHaveBeenCalled();
  });

  it("does not create a project as Pausado (ZER-201)", async () => {
    setupAuth();
    mocks.profilesSelectSingle.mockResolvedValue({ data: { tier: "standard" } });

    const result = await createProject(null, makeFormData({ estado: "pausado" }));

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

function makeUpdateForm(overrides: Record<string, string> = {}) {
  const fd = makeFormData({
    nombre: "Huerta comun",
    descripcion: "Lote 3 ampliado",
    estado: "en_curso",
    ingreso: "abierto",
    ...overrides,
  });
  fd.set("projectId", overrides.projectId ?? "proj-1");
  return fd;
}

describe("updateProject", () => {
  it("updates description and existing metadata and returns to the detail view", async () => {
    setupAuth("serrano-1");
    mocks.projectsUpdateSelect.mockResolvedValue({ error: null, data: [{ id: "proj-1" }] });

    await expect(updateProject(null, makeUpdateForm())).rejects.toThrow(
      "NEXT_REDIRECT:/nodo/projects/proj-1?ok=proyecto-actualizado",
    );

    expect(mocks.projectsUpdatePayload).toEqual({
      nombre: "Huerta comun",
      descripcion: "Lote 3 ampliado",
      estado: "en_curso",
      ingreso: "abierto",
    });
    expect(mocks.projectsUpdatePayload).not.toHaveProperty("creado_por");
    expect(mocks.projectsUpdateEq).toHaveBeenCalledWith("id", "proj-1");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/nodo/projects/proj-1");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/nodo/projects");
  });

  it("rejects a non-admin update when RLS returns zero rows", async () => {
    setupAuth("miembro-2");
    mocks.projectsUpdateSelect.mockResolvedValue({ error: null, data: [] });

    const result = await updateProject(null, makeUpdateForm());

    expect(result).toEqual({ error: "No pudimos guardar los cambios." });
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it("rejects a blank nombre without writing", async () => {
    setupAuth();
    const result = await updateProject(null, makeUpdateForm({ nombre: "   " }));
    expect(result).toEqual({ error: "El nombre no puede estar vacío" });
    expect(mocks.projectsUpdate).not.toHaveBeenCalled();
  });

  it("rejects an invalid estado without writing", async () => {
    setupAuth();
    const result = await updateProject(null, makeUpdateForm({ estado: "archivado" }));
    expect(result).toEqual({ error: "Revisá los datos del proyecto." });
    expect(mocks.projectsUpdate).not.toHaveBeenCalled();
  });

  it("returns unauthorized when there is no session", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null } });
    const result = await updateProject(null, makeUpdateForm());
    expect(result).toEqual({ error: "No autorizado" });
    expect(mocks.projectsUpdate).not.toHaveBeenCalled();
  });
});

describe("archiveProject", () => {
  function makeArchiveForm(projectId = "proj-1") {
    const fd = new FormData();
    fd.set("projectId", projectId);
    return fd;
  }

  it("stamps archivado_en, pauses the project, and leaves members and join requests on the row (ZER-201)", async () => {
    setupAuth("serrano-1");
    mocks.projectsUpdateSelect.mockResolvedValue({ error: null, data: [{ id: "proj-1" }] });

    await expect(archiveProject(null, makeArchiveForm())).rejects.toThrow(
      "NEXT_REDIRECT:/nodo/projects/proj-1?ok=proyecto-archivado",
    );

    expect(mocks.projectsUpdatePayload).toEqual({
      archivado_en: expect.any(String),
      estado: "pausado",
    });
    const { archivado_en } = mocks.projectsUpdatePayload as { archivado_en: string };
    expect(Number.isNaN(Date.parse(archivado_en))).toBe(false);
    expect(mocks.projectsUpdateEq).toHaveBeenCalledWith("id", "proj-1");
    expect(mocks.projectsDelete).not.toHaveBeenCalled();
    expect(mocks.membersDelete).not.toHaveBeenCalled();
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/nodo/projects/proj-1");
  });

  it("only archives a project that is not archived yet (keeps the first date)", async () => {
    setupAuth("serrano-1");
    mocks.projectsUpdateSelect.mockResolvedValue({ error: null, data: [{ id: "proj-1" }] });

    await expect(archiveProject(null, makeArchiveForm())).rejects.toThrow("NEXT_REDIRECT");

    expect(mocks.projectsUpdateIs).toHaveBeenCalledWith("archivado_en", null);
  });

  it("rejects a non-admin archive when RLS returns zero rows", async () => {
    setupAuth("miembro-2");
    mocks.projectsUpdateSelect.mockResolvedValue({ error: null, data: [] });

    const result = await archiveProject(null, makeArchiveForm());

    expect(result).toEqual({ error: "No pudimos archivar el proyecto." });
    expect(mocks.projectsDelete).not.toHaveBeenCalled();
    expect(mocks.membersDelete).not.toHaveBeenCalled();
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it("returns unauthorized when there is no session", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null } });
    const result = await archiveProject(null, makeArchiveForm());
    expect(result).toEqual({ error: "No autorizado" });
    expect(mocks.projectsUpdate).not.toHaveBeenCalled();
  });
});

function makeJoinForm(projectId = "proj-1") {
  const fd = new FormData();
  fd.set("projectId", projectId);
  return fd;
}

describe("unarchiveProject (ZER-201)", () => {
  function makeForm(projectId = "proj-1") {
    const fd = new FormData();
    fd.set("projectId", projectId);
    return fd;
  }

  it("clears archivado_en and leaves estado as it is", async () => {
    setupAuth("serrano-1");
    mocks.projectsUpdateSelect.mockResolvedValue({ error: null, data: [{ id: "proj-1" }] });

    await expect(unarchiveProject(null, makeForm())).rejects.toThrow(
      "NEXT_REDIRECT:/nodo/projects/proj-1?ok=proyecto-desarchivado",
    );

    expect(mocks.projectsUpdatePayload).toEqual({ archivado_en: null });
    expect(mocks.projectsUpdateEq).toHaveBeenCalledWith("id", "proj-1");
    expect(mocks.projectsUpdateNot).toHaveBeenCalledWith("archivado_en", "is", null);
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/nodo/projects");
  });

  it("rejects when RLS returns zero rows (not an admin, or not archived)", async () => {
    setupAuth("miembro-2");
    mocks.projectsUpdateSelect.mockResolvedValue({ error: null, data: [] });

    const result = await unarchiveProject(null, makeForm());

    expect(result).toEqual({ error: "No pudimos desarchivar el proyecto." });
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it("returns unauthorized when there is no session", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null } });
    const result = await unarchiveProject(null, makeForm());
    expect(result).toEqual({ error: "No autorizado" });
    expect(mocks.projectsUpdate).not.toHaveBeenCalled();
  });
});

describe("joinProject", () => {
  it("inserts aprobado for an abierto project and revalidates the detail route", async () => {
    setupAuth("serrano-1");
    mocks.profilesSelectSingle.mockResolvedValue({ data: { tier: "standard" } });
    mocks.projectsMaybeSingle.mockResolvedValue({
      data: { id: "proj-1", ingreso: "abierto" },
      error: null,
    });
    mocks.membersMaybeSingle.mockResolvedValue({ data: null, error: null });
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

  it("refuses a cerrado project before inserting anything (ZER-151)", async () => {
    setupAuth("serrano-1");
    mocks.profilesSelectSingle.mockResolvedValue({ data: { tier: "standard" } });
    mocks.projectsMaybeSingle.mockResolvedValue({
      data: { id: "proj-1", ingreso: "cerrado" },
      error: null,
    });

    const result = await joinProject(null, makeJoinForm());

    expect(result).toEqual({ error: "Este proyecto no está sumando gente por ahora." });
    expect(mocks.membersInsert).not.toHaveBeenCalled();
  });

  it("inserts pendiente for an aprobacion project", async () => {
    setupAuth("serrano-1");
    mocks.profilesSelectSingle.mockResolvedValue({ data: { tier: "standard" } });
    mocks.projectsMaybeSingle.mockResolvedValue({
      data: { id: "proj-2", ingreso: "aprobacion" },
      error: null,
    });
    mocks.membersMaybeSingle.mockResolvedValue({ data: null, error: null });
    mocks.membersSelect.mockResolvedValue({ error: null, data: [{ project_id: "proj-2" }] });

    const result = await joinProject(null, makeJoinForm("proj-2"));

    expect(result).toBeNull();
    expect(mocks.membersInsertPayload).toEqual({
      project_id: "proj-2",
      profile_id: "serrano-1",
      estado: "pendiente",
    });
  });

  it("reopens a rechazado row to pendiente instead of inserting", async () => {
    setupAuth("serrano-1");
    mocks.profilesSelectSingle.mockResolvedValue({ data: { tier: "standard" } });
    mocks.projectsMaybeSingle.mockResolvedValue({
      data: { id: "proj-2", ingreso: "aprobacion" },
      error: null,
    });
    mocks.membersMaybeSingle.mockResolvedValue({
      data: { estado: "rechazado", project_id: "proj-2", profile_id: "serrano-1" },
      error: null,
    });
    mocks.membersUpdateSelect.mockResolvedValue({
      error: null,
      data: [{ project_id: "proj-2" }],
    });

    const result = await joinProject(null, makeJoinForm("proj-2"));

    expect(result).toBeNull();
    expect(mocks.membersInsert).not.toHaveBeenCalled();
    expect(mocks.membersUpdatePayload).toEqual({
      estado: "pendiente",
      motivo_rechazo: null,
      decidido_en: null,
      decidido_por: null,
      aviso_visto_en: null,
    });
    expect(mocks.membersUpdateEq).toHaveBeenCalledWith("project_id", "proj-2");
    expect(mocks.membersUpdateEq).toHaveBeenCalledWith("profile_id", "serrano-1");
    expect(mocks.membersUpdateEq).toHaveBeenCalledWith("estado", "rechazado");
  });

  it("returns already member when existing row is aprobado", async () => {
    setupAuth("serrano-1");
    mocks.profilesSelectSingle.mockResolvedValue({ data: { tier: "standard" } });
    mocks.projectsMaybeSingle.mockResolvedValue({
      data: { id: "proj-1", ingreso: "abierto" },
      error: null,
    });
    mocks.membersMaybeSingle.mockResolvedValue({
      data: { estado: "aprobado", project_id: "proj-1", profile_id: "serrano-1" },
      error: null,
    });

    const result = await joinProject(null, makeJoinForm());

    expect(result).toEqual({ error: "Ya sos parte de este proyecto." });
    expect(mocks.membersInsert).not.toHaveBeenCalled();
  });

  it("returns already requested when existing row is pendiente", async () => {
    setupAuth("serrano-1");
    mocks.profilesSelectSingle.mockResolvedValue({ data: { tier: "standard" } });
    mocks.projectsMaybeSingle.mockResolvedValue({
      data: { id: "proj-2", ingreso: "aprobacion" },
      error: null,
    });
    mocks.membersMaybeSingle.mockResolvedValue({
      data: { estado: "pendiente", project_id: "proj-2", profile_id: "serrano-1" },
      error: null,
    });

    const result = await joinProject(null, makeJoinForm("proj-2"));

    expect(result).toEqual({ error: "Ya enviaste una solicitud." });
    expect(mocks.membersInsert).not.toHaveBeenCalled();
  });

  it("maps 23505 on abierto to Ya sos parte de este proyecto", async () => {
    setupAuth("serrano-1");
    mocks.profilesSelectSingle.mockResolvedValue({ data: { tier: "standard" } });
    mocks.projectsMaybeSingle.mockResolvedValue({
      data: { id: "proj-1", ingreso: "abierto" },
      error: null,
    });
    mocks.membersMaybeSingle.mockResolvedValue({ data: null, error: null });
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
    mocks.membersMaybeSingle.mockResolvedValue({ data: null, error: null });
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
    mocks.membersMaybeSingle.mockResolvedValue({ data: null, error: null });
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
  it("updates estado to aprobado with decision metadata for the matching pendiente row", async () => {
    setupAuth("admin-1");
    mocks.membersUpdateSelect.mockResolvedValue({
      error: null,
      data: [{ profile_id: "u2" }],
    });

    const result = await approveProjectJoin(null, makeQueueForm());

    expect(result).toBeNull();
    expect(mocks.membersUpdatePayload).toMatchObject({
      estado: "aprobado",
      motivo_rechazo: null,
      decidido_por: "admin-1",
      aviso_visto_en: null,
    });
    expect(typeof (mocks.membersUpdatePayload as { decidido_en?: string }).decidido_en).toBe(
      "string",
    );
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

function makeRejectForm(projectId = "proj-1", profileId = "u2", motivo = "El cupo ya está lleno") {
  const fd = makeQueueForm(projectId, profileId);
  fd.set("motivo", motivo);
  return fd;
}

describe("rejectProjectJoin", () => {
  it("requires a non-empty rejection reason", async () => {
    setupAuth("admin-1");
    const result = await rejectProjectJoin(null, makeRejectForm("proj-1", "u2", "   "));

    expect(result).toEqual({ error: "Escribí el motivo del rechazo" });
    expect(mocks.membersUpdate).not.toHaveBeenCalled();
    expect(mocks.membersDelete).not.toHaveBeenCalled();
  });

  it("rejects motivo longer than 500 characters", async () => {
    setupAuth("admin-1");
    const long = "x".repeat(501);
    const result = await rejectProjectJoin(null, makeRejectForm("proj-1", "u2", long));

    expect(result).toEqual({ error: "Escribí un motivo más corto (máx. 500)." });
    expect(mocks.membersUpdate).not.toHaveBeenCalled();
  });

  it("updates the matching pendiente row to rechazado with motivo and decision", async () => {
    setupAuth("admin-1");
    mocks.membersUpdateSelect.mockResolvedValue({
      error: null,
      data: [{ profile_id: "u2" }],
    });

    const result = await rejectProjectJoin(null, makeRejectForm());

    expect(result).toBeNull();
    expect(mocks.membersDelete).not.toHaveBeenCalled();
    expect(mocks.membersUpdatePayload).toMatchObject({
      estado: "rechazado",
      motivo_rechazo: "El cupo ya está lleno",
      decidido_por: "admin-1",
      aviso_visto_en: null,
    });
    expect(typeof (mocks.membersUpdatePayload as { decidido_en?: string }).decidido_en).toBe(
      "string",
    );
    expect(mocks.membersUpdateEq).toHaveBeenCalledWith("project_id", "proj-1");
    expect(mocks.membersUpdateEq).toHaveBeenCalledWith("profile_id", "u2");
    expect(mocks.membersUpdateEq).toHaveBeenCalledWith("estado", "pendiente");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/nodo/projects/proj-1/requests");
  });

  it("treats a zero-row update as failure", async () => {
    setupAuth("admin-1");
    mocks.membersUpdateSelect.mockResolvedValue({ error: null, data: [] });

    const result = await rejectProjectJoin(null, makeRejectForm());

    expect(result).toEqual({ error: "No pudimos rechazar esta solicitud." });
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });

  it("surfaces a Spanish error when the update fails", async () => {
    setupAuth("admin-1");
    mocks.membersUpdateSelect.mockResolvedValue({ error: { message: "rls" }, data: null });

    const result = await rejectProjectJoin(null, makeRejectForm());

    expect(result).toEqual({ error: "No pudimos rechazar la solicitud. Probá de nuevo." });
  });
});

describe("dismissProjectJoinNotice", () => {
  it("sets aviso_visto_en on the viewer's own decided row", async () => {
    setupAuth("serrano-1");
    mocks.membersUpdateSelect.mockResolvedValue({
      error: null,
      data: [{ project_id: "proj-1" }],
    });

    const fd = new FormData();
    fd.set("projectId", "proj-1");
    const result = await dismissProjectJoinNotice(null, fd);

    expect(result).toBeNull();
    expect(mocks.membersUpdatePayload).toEqual({
      aviso_visto_en: expect.any(String),
    });
    expect(mocks.membersUpdateEq).toHaveBeenCalledWith("project_id", "proj-1");
    expect(mocks.membersUpdateEq).toHaveBeenCalledWith("profile_id", "serrano-1");
    expect(mocks.membersUpdateIn).toHaveBeenCalledWith("estado", ["aprobado", "rechazado"]);
    expect(mocks.membersUpdateNot).toHaveBeenCalledWith("decidido_en", "is", null);
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/");
  });

  it("treats a zero-row dismiss as failure", async () => {
    setupAuth("serrano-1");
    mocks.membersUpdateSelect.mockResolvedValue({ error: null, data: [] });

    const fd = new FormData();
    fd.set("projectId", "proj-1");
    const result = await dismissProjectJoinNotice(null, fd);

    expect(result).toEqual({ error: "No pudimos cerrar el aviso." });
  });
});

function makePromoteForm(projectId = "proj-1", profileId = "member-2") {
  const fd = new FormData();
  fd.set("projectId", projectId);
  fd.set("profileId", profileId);
  return fd;
}

describe("promoteProjectMember", () => {
  it("updates rol to admin only for aprobado miembro and revalidates detail + queue", async () => {
    setupAuth("admin-1");
    mocks.membersUpdateSelect.mockResolvedValue({
      error: null,
      data: [{ project_id: "proj-1", profile_id: "member-2", rol: "admin" }],
    });

    const result = await promoteProjectMember(null, makePromoteForm());

    expect(result).toBeNull();
    expect(mocks.membersUpdatePayload).toEqual({ rol: "admin" });
    expect(mocks.membersUpdateEq).toHaveBeenCalledWith("project_id", "proj-1");
    expect(mocks.membersUpdateEq).toHaveBeenCalledWith("profile_id", "member-2");
    expect(mocks.membersUpdateEq).toHaveBeenCalledWith("estado", "aprobado");
    expect(mocks.membersUpdateEq).toHaveBeenCalledWith("rol", "miembro");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/nodo/projects/proj-1");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/nodo/projects/proj-1/requests");
  });

  it("treats a zero-row update as failure, not success", async () => {
    setupAuth("admin-1");
    mocks.membersUpdateSelect.mockResolvedValue({ error: null, data: [] });

    const result = await promoteProjectMember(null, makePromoteForm());

    expect(result).toEqual({ error: "No pudimos designar admin." });
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });

  it("surfaces a Spanish error when the update fails", async () => {
    setupAuth("admin-1");
    mocks.membersUpdateSelect.mockResolvedValue({ error: { message: "rls" }, data: null });

    const result = await promoteProjectMember(null, makePromoteForm());

    expect(result).toEqual({ error: "No pudimos designar admin. Probá de nuevo." });
  });

  it("returns unauthorized when there is no session", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null } });

    const result = await promoteProjectMember(null, makePromoteForm());

    expect(result).toEqual({ error: "No autorizado" });
    expect(mocks.membersUpdate).not.toHaveBeenCalled();
  });

  it("rejects missing projectId or profileId without writing", async () => {
    setupAuth("admin-1");

    const empty = new FormData();
    expect(await promoteProjectMember(null, empty)).toEqual({
      error: "Revisá el miembro e intentá de nuevo.",
    });
    expect(mocks.membersUpdate).not.toHaveBeenCalled();
  });
});

describe("demoteProjectMember (ZER-199)", () => {
  it("turns an aprobado admin back into miembro and revalidates the project", async () => {
    setupAuth("admin-1");
    mocks.membersUpdateSelect.mockResolvedValue({
      error: null,
      data: [{ project_id: "proj-1", profile_id: "member-2", rol: "miembro" }],
    });

    const result = await demoteProjectMember(null, makePromoteForm());

    expect(result).toBeNull();
    expect(mocks.membersUpdatePayload).toEqual({ rol: "miembro" });
    expect(mocks.membersUpdateEq).toHaveBeenCalledWith("project_id", "proj-1");
    expect(mocks.membersUpdateEq).toHaveBeenCalledWith("profile_id", "member-2");
    expect(mocks.membersUpdateEq).toHaveBeenCalledWith("estado", "aprobado");
    expect(mocks.membersUpdateEq).toHaveBeenCalledWith("rol", "admin");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/nodo/projects/proj-1");
  });

  it("explains that a project needs at least one admin", async () => {
    setupAuth("admin-1");
    mocks.membersUpdateSelect.mockResolvedValue({
      error: { code: "P0001", message: "last_project_admin" },
      data: null,
    });

    const result = await demoteProjectMember(null, makePromoteForm());

    expect(result).toEqual({
      error: "El proyecto necesita al menos un admin. Designá a otra persona antes.",
    });
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });

  it("treats a zero-row update as failure (not an admin, or no permission)", async () => {
    setupAuth("admin-1");
    mocks.membersUpdateSelect.mockResolvedValue({ error: null, data: [] });

    const result = await demoteProjectMember(null, makePromoteForm());

    expect(result).toEqual({ error: "No pudimos quitar el rol de admin." });
  });

  it("surfaces a Spanish error when the update fails", async () => {
    setupAuth("admin-1");
    mocks.membersUpdateSelect.mockResolvedValue({ error: { message: "rls" }, data: null });

    const result = await demoteProjectMember(null, makePromoteForm());

    expect(result).toEqual({ error: "No pudimos quitar el rol de admin. Probá de nuevo." });
  });

  it("returns unauthorized without a session and rejects a malformed form", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null } });
    expect(await demoteProjectMember(null, makePromoteForm())).toEqual({ error: "No autorizado" });

    setupAuth("admin-1");
    expect(await demoteProjectMember(null, new FormData())).toEqual({
      error: "Revisá el miembro e intentá de nuevo.",
    });
    expect(mocks.membersUpdate).not.toHaveBeenCalled();
  });
});

function makeLeaveForm(projectId = "proj-1") {
  const fd = new FormData();
  fd.set("projectId", projectId);
  return fd;
}

describe("leaveProject (ZER-200)", () => {
  it("deletes only the viewer's approved membership and goes back to the list", async () => {
    setupAuth("member-2");
    mocks.membersDeleteSelect.mockResolvedValue({
      error: null,
      data: [{ project_id: "proj-1" }],
    });

    await expect(leaveProject(null, makeLeaveForm())).rejects.toThrow(
      "NEXT_REDIRECT:/nodo/projects?ok=proyecto-abandonado",
    );
    expect(mocks.membersDeleteEq).toHaveBeenCalledWith("project_id", "proj-1");
    expect(mocks.membersDeleteEq).toHaveBeenCalledWith("profile_id", "member-2");
    expect(mocks.membersDeleteEq).toHaveBeenCalledWith("estado", "aprobado");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/nodo/projects/proj-1");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/nodo/projects");
  });

  it("tells the last admin to name another one first", async () => {
    setupAuth("admin-1");
    mocks.membersDeleteSelect.mockResolvedValue({
      error: { code: "P0001", message: "last_project_admin" },
      data: null,
    });

    const result = await leaveProject(null, makeLeaveForm());

    expect(result).toEqual({
      error: "Sos el único admin. Designá a otra persona como admin antes de salir.",
    });
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it("treats a zero-row delete as failure (not a member)", async () => {
    setupAuth("member-2");
    mocks.membersDeleteSelect.mockResolvedValue({ error: null, data: [] });

    expect(await leaveProject(null, makeLeaveForm())).toEqual({
      error: "No pudimos sacarte del proyecto.",
    });
  });

  it("surfaces a Spanish error when the delete fails", async () => {
    setupAuth("member-2");
    mocks.membersDeleteSelect.mockResolvedValue({ error: { message: "rls" }, data: null });

    expect(await leaveProject(null, makeLeaveForm())).toEqual({
      error: "No pudimos sacarte del proyecto. Probá de nuevo.",
    });
  });

  it("returns unauthorized without a session and rejects a missing project", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null } });
    expect(await leaveProject(null, makeLeaveForm())).toEqual({ error: "No autorizado" });

    setupAuth("member-2");
    expect(await leaveProject(null, new FormData())).toEqual({
      error: "Revisá el proyecto e intentá de nuevo.",
    });
    expect(mocks.membersDelete).not.toHaveBeenCalled();
  });
});
