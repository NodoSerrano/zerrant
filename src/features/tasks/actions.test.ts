import { describe, expect, it, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  profilesSelect: vi.fn(),
  profilesSelectEq: vi.fn(),
  profilesSelectSingle: vi.fn(),
  tasksInsert: vi.fn(),
  tasksUpdate: vi.fn(),
  // Every link of the PostgREST builder chain gets recorded in order, so the
  // tests can assert on the filters without being tied to how many there are
  // or how they nest. The previous mock was a fixed two-`.eq()` chain and
  // couldn't handle the `.in()` or `.select()` the actions need.
  chainCalls: [] as unknown[][],
  updateResult: { data: null, error: null } as { data: unknown; error: unknown },
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
        const chain: Record<string, unknown> = {
          then: (cb: (v: unknown) => unknown) => Promise.resolve(mocks.updateResult).then(cb),
        };
        for (const method of ["eq", "in", "select"]) {
          chain[method] = (...args: unknown[]) => {
            mocks.chainCalls.push([method, ...args]);
            return chain;
          };
        }
        return {
          insert: mocks.tasksInsert,
          update: mocks.tasksUpdate.mockImplementation(() => chain),
        };
      }
      return {};
    }),
  }),
}));

import { createTask, takeTask, markTaskDone, verifyTask, cancelTask, updateTask } from "./actions";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.chainCalls.length = 0;
  mocks.updateResult = { data: null, error: null };
});

/** A returned row = the update matched. Empty = the filters found nothing. */
function updateMatched(rows = [{ id: "task-001" }]) {
  mocks.updateResult = { data: rows, error: null };
}

function updateMatchedNothing() {
  mocks.updateResult = { data: [], error: null };
}

function updateFailed(message: string) {
  mocks.updateResult = { data: null, error: { message } };
}

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
    updateMatched();

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
    expect(mocks.chainCalls).toContainEqual(["eq", "id", "task-001"]);
    expect(mocks.chainCalls).toContainEqual(["eq", "estado", "abierta"]);
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
    updateFailed("Task already taken");

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
    updateMatched();

    try {
      await markTaskDone(null, makeFormData());
    } catch {
      // redirect throws
    }

    expect(mocks.tasksUpdate).toHaveBeenCalledWith({ estado: "hecha" });
    expect(mocks.chainCalls).toContainEqual(["eq", "id", "task-001"]);
    expect(mocks.chainCalls).toContainEqual(["eq", "tomada_por", "taker-user-id"]);
  });

  it("returns error when update fails", async () => {
    setupAuth();
    updateFailed("Task not found");

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
    updateMatched();

    try {
      await verifyTask(null, makeFormData());
    } catch {
      // redirect throws
    }

    expect(mocks.profilesSelect).toHaveBeenCalledWith("is_platform_admin");
    expect(mocks.profilesSelectEq).toHaveBeenCalledWith("id", "admin-user-id");
    expect(mocks.tasksUpdate).toHaveBeenCalledWith({ estado: "verificada" });
    expect(mocks.chainCalls).toContainEqual(["eq", "id", "task-001"]);
    expect(mocks.chainCalls).toContainEqual(["eq", "estado", "hecha"]);
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

  // Defense in depth: the action's guard prevents the normal case, and the
  // update filter holds even if someone posts directly. The RLS policy alone
  // isn't enough — it also lets `tomada_por` write.
  it("scopes the update to the creator and to cancellable estados", async () => {
    setupAuth("owner-user-id");
    updateMatched();

    try {
      await cancelTask(null, makeFormData());
    } catch {
      // redirect throws
    }

    expect(mocks.chainCalls).toContainEqual(["eq", "id", "task-001"]);
    expect(mocks.chainCalls).toContainEqual(["eq", "creado_por", "owner-user-id"]);
    expect(mocks.chainCalls).toContainEqual(["in", "estado", ["abierta", "tomada"]]);
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
    updateFailed('permission denied for column "estado"');

    const result = await cancelTask(null, makeFormData());

    expect(result).toEqual({ error: "No pudimos cancelar la tarea. Probá de nuevo." });
  });

  // PostgREST doesn't consider an UPDATE that matches no rows an error: it
  // returns `error: null`. Without checking the affected rows, the action
  // redirects as if it worked and the user believes they cancelled a live task.
  it("reports a rejection when the filters match no row", async () => {
    setupAuth("owner-user-id");
    updateMatchedNothing();

    const result = await cancelTask(null, makeFormData());

    expect(result).toEqual({ error: "No pudimos cancelar esta tarea." });
  });

  it("keeps tomada_por so a cancelled task still records who held it", async () => {
    setupAuth("owner-user-id");
    updateMatched();

    try {
      await cancelTask(null, makeFormData());
    } catch {
      // redirect throws
    }

    expect(mocks.tasksUpdate).toHaveBeenCalledWith({ estado: "cancelada" });
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
    updateMatched();

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

  // The RLS policy lets `creado_por` **or** `tomada_por` write, and the
  // column grant includes `titulo` and `descripcion`. Without this filter,
  // whoever takes a task can rewrite its text.
  it("scopes the update to the creator, not merely to the task id", async () => {
    setupAuth("owner-user-id");
    updateMatched();

    try {
      await updateTask(null, makeFormData());
    } catch {
      // redirect throws
    }

    expect(mocks.chainCalls).toContainEqual(["eq", "id", "task-001"]);
    expect(mocks.chainCalls).toContainEqual(["eq", "creado_por", "owner-user-id"]);
  });

  it("trims the title before saving", async () => {
    setupAuth("owner-user-id");
    updateMatched();

    try {
      await updateTask(null, makeFormData({ titulo: "   Cambiar la cerradura   " }));
    } catch {
      // redirect throws
    }

    expect(mocks.tasksUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ titulo: "Cambiar la cerradura" }),
    );
  });

  // `titulo` is NOT NULL but accepts the empty string: without this guard, the
  // HTML `required` is the only thing preventing a title-less task.
  it("rejects a blank title without touching the table", async () => {
    setupAuth("owner-user-id");

    const result = await updateTask(null, makeFormData({ titulo: "   " }));

    expect(result).toEqual({ error: "El título no puede estar vacío" });
    expect(mocks.tasksUpdate).not.toHaveBeenCalled();
  });

  // The column is nullable: "no description" and "empty description" must
  // reach the database the same way, so the detail only has one case to tell apart.
  it("stores an empty description as null", async () => {
    setupAuth("owner-user-id");
    updateMatched();

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
    updateFailed('null value in column "titulo" violates not-null');

    const result = await updateTask(null, makeFormData());

    expect(result).toEqual({ error: "No pudimos guardar los cambios. Probá de nuevo." });
  });

  it("reports a rejection when the filters match no row", async () => {
    setupAuth("owner-user-id");
    updateMatchedNothing();

    const result = await updateTask(null, makeFormData());

    expect(result).toEqual({ error: "No pudimos guardar los cambios." });
  });

  // Editing only makes sense while nobody has committed to the task. Once
  // taken, changing its scope changes the taker's work without warning; and a
  // hecha or verificada task isn't rewritten, because that breaks the record.
  it("only edits a task that is still abierta", async () => {
    setupAuth("owner-user-id");
    updateMatched();

    try {
      await updateTask(null, makeFormData());
    } catch {
      // redirect throws
    }

    expect(mocks.chainCalls).toContainEqual(["eq", "estado", "abierta"]);
  });

  it.each([
    ["categoria", "teletransportacion"],
    ["urgencia", "critica"],
  ])("rejects an out-of-range %s instead of casting it blindly", async (field, value) => {
    setupAuth("owner-user-id");

    const result = await updateTask(null, makeFormData({ [field]: value }));

    expect(result).toEqual({ error: "Revisá los datos de la tarea." });
    expect(mocks.tasksUpdate).not.toHaveBeenCalled();
  });

  // A partial POST shouldn't wipe the description that was already there.
  it("leaves descripcion untouched when the field is absent from the submission", async () => {
    setupAuth("owner-user-id");
    updateMatched();
    const fd = makeFormData();
    fd.delete("descripcion");

    try {
      await updateTask(null, fd);
    } catch {
      // redirect throws
    }

    expect(mocks.tasksUpdate).toHaveBeenCalledWith(
      expect.not.objectContaining({ descripcion: expect.anything() }),
    );
  });
});
