import { describe, expect, it, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  profilesSelect: vi.fn(),
  profilesSelectEq: vi.fn(),
  profilesSelectSingle: vi.fn(),
  tasksInsert: vi.fn(),
  tasksUpdate: vi.fn(),
  tasksUpdateEq1: vi.fn(),
  tasksUpdateEq2: vi.fn(),
  tasksUpdateIn: vi.fn(),
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
      if (table === "tasks") {
        return {
          insert: mocks.tasksInsert,
          update: mocks.tasksUpdate.mockImplementation(() => ({
            eq: mocks.tasksUpdateEq1.mockImplementation(() => ({
              // El segundo `.eq()` es terminal para takeTask/markTaskDone/
              // verifyTask, pero `cancelTask` encadena un `.in()` después. El
              // resultado tiene que ser las dos cosas: awaitable y encadenable.
              eq: (...args: unknown[]) =>
                Object.assign(Promise.resolve(mocks.tasksUpdateEq2(...args)), {
                  in: mocks.tasksUpdateIn,
                }),
            })),
          })),
        };
      }
      return {};
    }),
  }),
}));

import { createTask, takeTask, markTaskDone, verifyTask, cancelTask, updateTask } from "./actions";

beforeEach(() => {
  vi.clearAllMocks();
});

function setupAuth(userId = "test-user-id") {
  mocks.getUser.mockResolvedValue({ data: { user: { id: userId } } });
}

describe("createTask", () => {
  it("creates a task and redirects on success", async () => {
    setupAuth();
    mocks.profilesSelectSingle.mockResolvedValue({ data: { tier: "standard" } });
    mocks.tasksInsert.mockResolvedValue({ error: null });

    const fd = new FormData();
    fd.set("titulo", "Fix the roof");
    fd.set("descripcion", "The roof needs urgent repair");
    fd.set("categoria", "mantenimiento");
    fd.set("urgencia", "alta");

    try {
      await createTask(null, fd);
    } catch {
      // redirect throws
    }

    expect(mocks.profilesSelect).toHaveBeenCalledWith("tier");
    expect(mocks.profilesSelectEq).toHaveBeenCalledWith("id", "test-user-id");
    expect(mocks.tasksInsert).toHaveBeenCalledWith({
      titulo: "Fix the roof",
      descripcion: "The roof needs urgent repair",
      categoria: "mantenimiento",
      urgencia: "alta",
      creado_por: "test-user-id",
    });
  });

  it("blocks tourist-tier users from creating tasks", async () => {
    setupAuth();
    mocks.profilesSelectSingle.mockResolvedValue({ data: { tier: "tourist" } });

    const result = await createTask(null, new FormData());

    expect(result).toEqual({ error: "Solo los serranos pueden crear tareas" });
    expect(mocks.tasksInsert).not.toHaveBeenCalled();
  });

  it("returns error when task insert fails", async () => {
    setupAuth();
    mocks.profilesSelectSingle.mockResolvedValue({ data: { tier: "standard" } });
    mocks.tasksInsert.mockResolvedValue({
      error: { message: "DB insert error" },
    });

    const result = await createTask(null, new FormData());

    expect(result).toEqual({ error: "DB insert error" });
  });
});

describe("takeTask", () => {
  const makeFormData = (taskId = "task-001") => {
    const fd = new FormData();
    fd.set("taskId", taskId);
    return fd;
  };

  it("takes an open task and redirects on success", async () => {
    setupAuth();
    mocks.profilesSelectSingle.mockResolvedValue({ data: { tier: "standard" } });
    mocks.tasksUpdateEq2.mockResolvedValue({ data: null, error: null });

    try {
      await takeTask(null, makeFormData());
    } catch {
      // redirect throws
    }

    expect(mocks.profilesSelect).toHaveBeenCalledWith("tier");
    expect(mocks.profilesSelectEq).toHaveBeenCalledWith("id", "test-user-id");
    expect(mocks.tasksUpdate).toHaveBeenCalledWith({
      estado: "tomada",
      tomada_por: "test-user-id",
    });
    expect(mocks.tasksUpdateEq1).toHaveBeenCalledWith("id", "task-001");
    expect(mocks.tasksUpdateEq2).toHaveBeenCalledWith("estado", "abierta");
  });

  it("blocks tourist-tier users from taking tasks", async () => {
    setupAuth();
    mocks.profilesSelectSingle.mockResolvedValue({ data: { tier: "tourist" } });

    const result = await takeTask(null, makeFormData());

    expect(result).toEqual({ error: "Solo los serranos pueden tomar tareas" });
    expect(mocks.tasksUpdate).not.toHaveBeenCalled();
  });

  it("returns error when task update fails", async () => {
    setupAuth();
    mocks.profilesSelectSingle.mockResolvedValue({ data: { tier: "standard" } });
    mocks.tasksUpdateEq2.mockResolvedValue({
      data: null,
      error: { message: "Task already taken" },
    });

    const result = await takeTask(null, makeFormData());

    expect(result).toEqual({ error: "Task already taken" });
  });
});

describe("markTaskDone", () => {
  const makeFormData = (taskId = "task-001") => {
    const fd = new FormData();
    fd.set("taskId", taskId);
    return fd;
  };

  it("marks task as done for the user who took it and redirects", async () => {
    setupAuth("taker-user-id");
    mocks.tasksUpdateEq2.mockResolvedValue({ data: null, error: null });

    try {
      await markTaskDone(null, makeFormData());
    } catch {
      // redirect throws
    }

    expect(mocks.tasksUpdate).toHaveBeenCalledWith({ estado: "hecha" });
    expect(mocks.tasksUpdateEq1).toHaveBeenCalledWith("id", "task-001");
    expect(mocks.tasksUpdateEq2).toHaveBeenCalledWith("tomada_por", "taker-user-id");
  });

  it("returns error when update fails", async () => {
    setupAuth();
    mocks.tasksUpdateEq2.mockResolvedValue({
      data: null,
      error: { message: "Task not found" },
    });

    const result = await markTaskDone(null, makeFormData());

    expect(result).toEqual({ error: "Task not found" });
  });
});

describe("verifyTask", () => {
  const makeFormData = (taskId = "task-001") => {
    const fd = new FormData();
    fd.set("taskId", taskId);
    return fd;
  };

  it("allows platform admin to verify a done task and redirects", async () => {
    setupAuth("admin-user-id");
    mocks.profilesSelectSingle.mockResolvedValue({ data: { is_platform_admin: true } });
    mocks.tasksUpdateEq2.mockResolvedValue({ data: null, error: null });

    try {
      await verifyTask(null, makeFormData());
    } catch {
      // redirect throws
    }

    expect(mocks.profilesSelect).toHaveBeenCalledWith("is_platform_admin");
    expect(mocks.profilesSelectEq).toHaveBeenCalledWith("id", "admin-user-id");
    expect(mocks.tasksUpdate).toHaveBeenCalledWith({ estado: "verificada" });
    expect(mocks.tasksUpdateEq1).toHaveBeenCalledWith("id", "task-001");
    expect(mocks.tasksUpdateEq2).toHaveBeenCalledWith("estado", "hecha");
  });

  it("blocks non-admin users from verifying tasks", async () => {
    setupAuth("regular-user-id");
    mocks.profilesSelectSingle.mockResolvedValue({ data: { is_platform_admin: false } });

    const result = await verifyTask(null, makeFormData());

    expect(result).toEqual({ error: "Solo un admin puede verificar tareas" });
    expect(mocks.tasksUpdate).not.toHaveBeenCalled();
  });
});

describe("cancelTask", () => {
  const makeFormData = (taskId = "task-001") => {
    const fd = new FormData();
    fd.set("taskId", taskId);
    return fd;
  };

  it("cancels the task and clears tomada_por", async () => {
    setupAuth("owner-user-id");
    mocks.tasksUpdateIn.mockResolvedValue({ data: null, error: null });

    try {
      await cancelTask(null, makeFormData());
    } catch {
      // redirect throws
    }

    // `tomada_por` se limpia: si la tarea estaba tomada, cancelarla tiene que
    // soltar a quien la tenía, no dejarlo colgado de una tarea muerta.
    expect(mocks.tasksUpdate).toHaveBeenCalledWith({
      estado: "cancelada",
      tomada_por: null,
    });
  });

  // Defensa en profundidad: la guarda del action evita el caso normal, y el
  // filtro del update la sostiene aunque alguien postee directo. La policy de
  // RLS por sí sola no alcanza — deja escribir también al `tomada_por`.
  it("scopes the update to the creator and to cancellable estados", async () => {
    setupAuth("owner-user-id");
    mocks.tasksUpdateIn.mockResolvedValue({ data: null, error: null });

    try {
      await cancelTask(null, makeFormData());
    } catch {
      // redirect throws
    }

    expect(mocks.tasksUpdateEq1).toHaveBeenCalledWith("id", "task-001");
    expect(mocks.tasksUpdateEq2).toHaveBeenCalledWith("creado_por", "owner-user-id");
    expect(mocks.tasksUpdateIn).toHaveBeenCalledWith("estado", ["abierta", "tomada"]);
  });

  it("rejects an unauthenticated user without touching the table", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null } });

    const result = await cancelTask(null, makeFormData());

    expect(result).toEqual({ error: "No autorizado" });
    expect(mocks.tasksUpdate).not.toHaveBeenCalled();
  });

  it("rejects a request without taskId without touching the table", async () => {
    setupAuth("owner-user-id");

    const result = await cancelTask(null, new FormData());

    expect(result).toEqual({ error: "No autorizado" });
    expect(mocks.tasksUpdate).not.toHaveBeenCalled();
  });

  it("does not leak the raw Postgres message when the update fails", async () => {
    setupAuth("owner-user-id");
    mocks.tasksUpdateIn.mockResolvedValue({
      data: null,
      error: { message: 'permission denied for column "estado"' },
    });

    const result = await cancelTask(null, makeFormData());

    expect(result).toEqual({ error: "No pudimos cancelar la tarea. Probá de nuevo." });
  });
});

describe("updateTask", () => {
  const makeFormData = (overrides: Record<string, string> = {}) => {
    const fd = new FormData();
    fd.set("taskId", "task-001");
    fd.set("titulo", "Reparar el caño del baño");
    fd.set("descripcion", "Pierde agua abajo de la pileta");
    fd.set("categoria", "reparacion");
    fd.set("urgencia", "alta");
    for (const [k, v] of Object.entries(overrides)) fd.set(k, v);
    return fd;
  };

  it("saves the edited fields", async () => {
    setupAuth("owner-user-id");
    mocks.tasksUpdateEq2.mockResolvedValue({ data: null, error: null });

    try {
      await updateTask(null, makeFormData());
    } catch {
      // redirect throws
    }

    expect(mocks.tasksUpdate).toHaveBeenCalledWith({
      titulo: "Reparar el caño del baño",
      descripcion: "Pierde agua abajo de la pileta",
      categoria: "reparacion",
      urgencia: "alta",
    });
  });

  // La policy de RLS deja escribir al `creado_por` **o** al `tomada_por`, y el
  // grant por columna incluye `titulo` y `descripcion`. Sin este filtro, quien
  // toma una tarea puede reescribirle el texto.
  it("scopes the update to the creator, not merely to the task id", async () => {
    setupAuth("owner-user-id");
    mocks.tasksUpdateEq2.mockResolvedValue({ data: null, error: null });

    try {
      await updateTask(null, makeFormData());
    } catch {
      // redirect throws
    }

    expect(mocks.tasksUpdateEq1).toHaveBeenCalledWith("id", "task-001");
    expect(mocks.tasksUpdateEq2).toHaveBeenCalledWith("creado_por", "owner-user-id");
  });

  it("trims the title before saving", async () => {
    setupAuth("owner-user-id");
    mocks.tasksUpdateEq2.mockResolvedValue({ data: null, error: null });

    try {
      await updateTask(null, makeFormData({ titulo: "   Cambiar la cerradura   " }));
    } catch {
      // redirect throws
    }

    expect(mocks.tasksUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ titulo: "Cambiar la cerradura" }),
    );
  });

  // `titulo` es NOT NULL pero acepta la cadena vacía: sin esta guarda, el
  // `required` del HTML es lo único que impide una tarea sin título.
  it("rejects a blank title without touching the table", async () => {
    setupAuth("owner-user-id");

    const result = await updateTask(null, makeFormData({ titulo: "   " }));

    expect(result).toEqual({ error: "El título no puede estar vacío" });
    expect(mocks.tasksUpdate).not.toHaveBeenCalled();
  });

  // La columna es nullable: "sin descripción" y "descripción vacía" tienen que
  // llegar iguales a la base, para que el detalle pueda distinguir un caso solo.
  it("stores an empty description as null", async () => {
    setupAuth("owner-user-id");
    mocks.tasksUpdateEq2.mockResolvedValue({ data: null, error: null });

    try {
      await updateTask(null, makeFormData({ descripcion: "   " }));
    } catch {
      // redirect throws
    }

    expect(mocks.tasksUpdate).toHaveBeenCalledWith(expect.objectContaining({ descripcion: null }));
  });

  it("rejects an unauthenticated user without touching the table", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null } });

    const result = await updateTask(null, makeFormData());

    expect(result).toEqual({ error: "No autorizado" });
    expect(mocks.tasksUpdate).not.toHaveBeenCalled();
  });

  it("does not leak the raw Postgres message when the update fails", async () => {
    setupAuth("owner-user-id");
    mocks.tasksUpdateEq2.mockResolvedValue({
      data: null,
      error: { message: 'null value in column "titulo" violates not-null' },
    });

    const result = await updateTask(null, makeFormData());

    expect(result).toEqual({ error: "No pudimos guardar los cambios. Probá de nuevo." });
  });
});
