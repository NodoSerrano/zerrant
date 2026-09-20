import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  profilesSelect: vi.fn(),
  profilesSelectEq: vi.fn(),
  profilesSelectSingle: vi.fn(),
  eventsInsert: vi.fn(),
  eventsSelect: vi.fn(),
  eventsUpdate: vi.fn(),
  eventsUpdateEq: vi.fn(),
  eventsUpdateSelect: vi.fn(),
  eventsUpdatePayload: null as unknown,
  eventsDelete: vi.fn(),
  eventsDeleteEq: vi.fn(),
  eventsDeleteSelect: vi.fn(),
  eventsInsertPayload: null as unknown,
  attendanceUpsert: vi.fn(),
  attendanceSelect: vi.fn(),
  attendanceUpsertPayload: null as unknown,
  attendanceUpsertOptions: null as unknown,
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
      if (table === "events") {
        return {
          insert: mocks.eventsInsert.mockImplementation((payload: unknown) => {
            mocks.eventsInsertPayload = payload;
            return {
              select: mocks.eventsSelect,
            };
          }),
          update: mocks.eventsUpdate.mockImplementation((payload: unknown) => {
            mocks.eventsUpdatePayload = payload;
            return {
              eq: mocks.eventsUpdateEq.mockImplementation(() => ({
                select: mocks.eventsUpdateSelect,
              })),
            };
          }),
          delete: mocks.eventsDelete.mockImplementation(() => ({
            eq: mocks.eventsDeleteEq.mockImplementation(() => ({
              select: mocks.eventsDeleteSelect,
            })),
          })),
        };
      }
      if (table === "event_attendance") {
        return {
          upsert: mocks.attendanceUpsert.mockImplementation(
            (payload: unknown, options: unknown) => {
              mocks.attendanceUpsertPayload = payload;
              mocks.attendanceUpsertOptions = options;
              return {
                select: mocks.attendanceSelect,
              };
            },
          ),
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

import { createEvent, updateEvent, deleteEvent, setRsvp } from "./actions";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.eventsInsertPayload = null;
  mocks.eventsUpdatePayload = null;
  mocks.attendanceUpsertPayload = null;
  mocks.attendanceUpsertOptions = null;
});

function setupAuth(userId = "serrano-1") {
  mocks.getUser.mockResolvedValue({ data: { user: { id: userId } } });
}

function makeFormData(overrides: Record<string, string> = {}) {
  const fd = new FormData();
  fd.set("titulo", "Asamblea de nodo");
  fd.set("descripcion", "Revisión de pendientes");
  fd.set("lugar", "Salón");
  fd.set("fecha", "2026-09-20");
  fd.set("inicio", "19:00");
  fd.set("fin", "21:00");
  for (const [k, v] of Object.entries(overrides)) {
    fd.set(k, v);
  }
  return fd;
}

describe("createEvent", () => {
  it("writes creado_por and ART-stable inicio/fin timestamps", async () => {
    setupAuth("serrano-1");
    mocks.profilesSelectSingle.mockResolvedValue({ data: { tier: "standard" } });
    mocks.eventsSelect.mockResolvedValue({ error: null, data: [{ id: "evt-1" }] });

    await expect(createEvent(null, makeFormData())).rejects.toThrow(
      "NEXT_REDIRECT:/agenda?dia=2026-09-20",
    );

    expect(mocks.eventsInsertPayload).toEqual({
      titulo: "Asamblea de nodo",
      descripcion: "Revisión de pendientes",
      lugar: "Salón",
      inicio: "2026-09-20T22:00:00.000Z",
      fin: "2026-09-21T00:00:00.000Z",
      creado_por: "serrano-1",
    });
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/agenda");
  });

  it("rejects fin before inicio without calling insert", async () => {
    setupAuth();
    mocks.profilesSelectSingle.mockResolvedValue({ data: { tier: "standard" } });

    const result = await createEvent(null, makeFormData({ inicio: "21:00", fin: "19:00" }));

    expect(result).toEqual({ error: "La hora de fin no puede ser anterior al inicio." });
    expect(mocks.eventsInsert).not.toHaveBeenCalled();
  });

  it("rejects a blank titulo without writing", async () => {
    setupAuth();
    mocks.profilesSelectSingle.mockResolvedValue({ data: { tier: "standard" } });

    const result = await createEvent(null, makeFormData({ titulo: "   " }));

    expect(result).toEqual({ error: "El título no puede estar vacío." });
    expect(mocks.eventsInsert).not.toHaveBeenCalled();
  });

  it("rejects a missing inicio without writing", async () => {
    setupAuth();
    mocks.profilesSelectSingle.mockResolvedValue({ data: { tier: "standard" } });
    const fd = makeFormData();
    fd.delete("inicio");

    const result = await createEvent(null, fd);

    expect(result).toEqual({ error: "Indicá el inicio del evento." });
    expect(mocks.eventsInsert).not.toHaveBeenCalled();
  });

  it("rejects a missing fecha without writing", async () => {
    setupAuth();
    mocks.profilesSelectSingle.mockResolvedValue({ data: { tier: "standard" } });
    const fd = makeFormData();
    fd.delete("fecha");

    const result = await createEvent(null, fd);

    expect(result).toEqual({ error: "Indicá la fecha del evento." });
    expect(mocks.eventsInsert).not.toHaveBeenCalled();
  });

  it("returns unauthorized when there is no session", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null } });

    const result = await createEvent(null, makeFormData());

    expect(result).toEqual({ error: "No autorizado" });
    expect(mocks.eventsInsert).not.toHaveBeenCalled();
  });

  it("blocks tourists before insert (UX); RLS remains the authority", async () => {
    setupAuth("tourist-1");
    mocks.profilesSelectSingle.mockResolvedValue({ data: { tier: "tourist" } });

    const result = await createEvent(null, makeFormData());

    expect(result).toEqual({ error: "Solo los serranos pueden crear eventos." });
    expect(mocks.eventsInsert).not.toHaveBeenCalled();
  });

  it("treats a zero-row insert as failure", async () => {
    setupAuth();
    mocks.profilesSelectSingle.mockResolvedValue({ data: { tier: "standard" } });
    mocks.eventsSelect.mockResolvedValue({ error: null, data: [] });

    const result = await createEvent(null, makeFormData());

    expect(result).toEqual({ error: "No pudimos publicar el evento." });
  });

  it("surfaces a Spanish error when the insert fails", async () => {
    setupAuth();
    mocks.profilesSelectSingle.mockResolvedValue({ data: { tier: "standard" } });
    mocks.eventsSelect.mockResolvedValue({ error: { message: "rls" }, data: null });

    const result = await createEvent(null, makeFormData());

    expect(result).toEqual({ error: "No pudimos publicar el evento. Probá de nuevo." });
  });

  it("stores empty descripcion and lugar as null", async () => {
    setupAuth("serrano-1");
    mocks.profilesSelectSingle.mockResolvedValue({ data: { tier: "standard" } });
    mocks.eventsSelect.mockResolvedValue({ error: null, data: [{ id: "evt-1" }] });

    await expect(createEvent(null, makeFormData({ descripcion: "  ", lugar: "" }))).rejects.toThrow(
      "NEXT_REDIRECT",
    );

    expect(mocks.eventsInsertPayload).toEqual(
      expect.objectContaining({
        descripcion: null,
        lugar: null,
      }),
    );
  });

  it("allows equal fin and inicio", async () => {
    setupAuth("serrano-1");
    mocks.profilesSelectSingle.mockResolvedValue({ data: { tier: "standard" } });
    mocks.eventsSelect.mockResolvedValue({ error: null, data: [{ id: "evt-1" }] });

    await expect(
      createEvent(null, makeFormData({ inicio: "19:00", fin: "19:00" })),
    ).rejects.toThrow("NEXT_REDIRECT");

    expect(mocks.eventsInsertPayload).toEqual(
      expect.objectContaining({
        inicio: "2026-09-20T22:00:00.000Z",
        fin: "2026-09-20T22:00:00.000Z",
      }),
    );
  });
});

describe("updateEvent", () => {
  function makeUpdateForm(overrides: Record<string, string> = {}) {
    const fd = makeFormData(overrides);
    fd.set("eventId", overrides.eventId ?? "evt-1");
    return fd;
  }

  it("updates the row scoped to eventId and redirects to detail", async () => {
    setupAuth("serrano-1");
    mocks.eventsUpdateSelect.mockResolvedValue({ error: null, data: [{ id: "evt-1" }] });

    await expect(updateEvent(null, makeUpdateForm())).rejects.toThrow(
      "NEXT_REDIRECT:/agenda/evt-1",
    );

    expect(mocks.eventsUpdatePayload).toEqual({
      titulo: "Asamblea de nodo",
      descripcion: "Revisión de pendientes",
      lugar: "Salón",
      inicio: "2026-09-20T22:00:00.000Z",
      fin: "2026-09-21T00:00:00.000Z",
    });
    expect(mocks.eventsUpdateEq).toHaveBeenCalledWith("id", "evt-1");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/agenda");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/agenda/evt-1");
  });

  it("rejects fin before inicio without calling update", async () => {
    setupAuth();
    const result = await updateEvent(null, makeUpdateForm({ inicio: "21:00", fin: "19:00" }));

    expect(result).toEqual({ error: "La hora de fin no puede ser anterior al inicio." });
    expect(mocks.eventsUpdate).not.toHaveBeenCalled();
  });

  it("treats a zero-row update as failure", async () => {
    setupAuth();
    mocks.eventsUpdateSelect.mockResolvedValue({ error: null, data: [] });

    const result = await updateEvent(null, makeUpdateForm());

    expect(result).toEqual({ error: "No pudimos guardar los cambios." });
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it("returns unauthorized when there is no session", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null } });
    const result = await updateEvent(null, makeUpdateForm());
    expect(result).toEqual({ error: "No autorizado" });
    expect(mocks.eventsUpdate).not.toHaveBeenCalled();
  });

  it("rejects a missing eventId without writing", async () => {
    setupAuth();
    const fd = makeFormData();
    const result = await updateEvent(null, fd);
    expect(result).toEqual({ error: "No encontramos el evento." });
    expect(mocks.eventsUpdate).not.toHaveBeenCalled();
  });
});

describe("deleteEvent", () => {
  function makeDeleteForm(eventId = "evt-1") {
    const fd = new FormData();
    fd.set("eventId", eventId);
    return fd;
  }

  it("deletes the row and redirects to the agenda", async () => {
    setupAuth("serrano-1");
    mocks.eventsDeleteSelect.mockResolvedValue({ error: null, data: [{ id: "evt-1" }] });

    await expect(deleteEvent(null, makeDeleteForm())).rejects.toThrow("NEXT_REDIRECT:/agenda");

    expect(mocks.eventsDeleteEq).toHaveBeenCalledWith("id", "evt-1");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/agenda");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/agenda/evt-1");
  });

  it("treats a zero-row delete as failure", async () => {
    setupAuth();
    mocks.eventsDeleteSelect.mockResolvedValue({ error: null, data: [] });

    const result = await deleteEvent(null, makeDeleteForm());

    expect(result).toEqual({ error: "No pudimos eliminar el evento." });
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it("returns unauthorized when there is no session", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null } });
    const result = await deleteEvent(null, makeDeleteForm());
    expect(result).toEqual({ error: "No autorizado" });
    expect(mocks.eventsDelete).not.toHaveBeenCalled();
  });
});

function makeRsvpFormData(overrides: Record<string, string> = {}) {
  const fd = new FormData();
  fd.set("event_id", "evt-1");
  fd.set("estado", "voy");
  for (const [k, v] of Object.entries(overrides)) {
    fd.set(k, v);
  }
  return fd;
}

describe("setRsvp", () => {
  it("upserts on (event_id, profile_id) using the session user, not a form profile_id", async () => {
    setupAuth("serrano-1");
    mocks.profilesSelectSingle.mockResolvedValue({ data: { tier: "standard" } });
    mocks.attendanceSelect.mockResolvedValue({ error: null, data: [{ event_id: "evt-1" }] });

    const result = await setRsvp(
      null,
      makeRsvpFormData({ profile_id: "attacker-id", estado: "quizas" }),
    );

    expect(result).toBeNull();
    expect(mocks.attendanceUpsertPayload).toEqual({
      event_id: "evt-1",
      profile_id: "serrano-1",
      estado: "quizas",
    });
    expect(mocks.attendanceUpsertOptions).toEqual({ onConflict: "event_id,profile_id" });
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/agenda/evt-1");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/agenda");
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it("rejects a bogus estado before writing", async () => {
    setupAuth();
    mocks.profilesSelectSingle.mockResolvedValue({ data: { tier: "standard" } });

    const result = await setRsvp(null, makeRsvpFormData({ estado: "quizás" }));

    expect(result).toEqual({ error: "Revisá tu respuesta." });
    expect(mocks.attendanceUpsert).not.toHaveBeenCalled();
  });

  it("rejects a missing event_id before writing", async () => {
    setupAuth();
    mocks.profilesSelectSingle.mockResolvedValue({ data: { tier: "standard" } });
    const fd = makeRsvpFormData();
    fd.delete("event_id");

    const result = await setRsvp(null, fd);

    expect(result).toEqual({ error: "Falta el evento." });
    expect(mocks.attendanceUpsert).not.toHaveBeenCalled();
  });

  it("returns unauthorized when there is no session", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null } });

    const result = await setRsvp(null, makeRsvpFormData());

    expect(result).toEqual({ error: "No autorizado" });
    expect(mocks.attendanceUpsert).not.toHaveBeenCalled();
  });

  it("blocks tourists before upsert (UX); RLS remains the authority", async () => {
    setupAuth("tourist-1");
    mocks.profilesSelectSingle.mockResolvedValue({ data: { tier: "tourist" } });

    const result = await setRsvp(null, makeRsvpFormData());

    expect(result).toEqual({ error: "Solo los serranos pueden confirmar asistencia." });
    expect(mocks.attendanceUpsert).not.toHaveBeenCalled();
  });

  it("treats a zero-row upsert as failure", async () => {
    setupAuth();
    mocks.profilesSelectSingle.mockResolvedValue({ data: { tier: "standard" } });
    mocks.attendanceSelect.mockResolvedValue({ error: null, data: [] });

    const result = await setRsvp(null, makeRsvpFormData());

    expect(result).toEqual({ error: "No pudimos guardar tu respuesta." });
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });

  it("surfaces a Spanish error when the upsert fails", async () => {
    setupAuth();
    mocks.profilesSelectSingle.mockResolvedValue({ data: { tier: "standard" } });
    mocks.attendanceSelect.mockResolvedValue({ error: { message: "rls" }, data: null });

    const result = await setRsvp(null, makeRsvpFormData());

    expect(result).toEqual({ error: "No pudimos guardar tu respuesta. Probá de nuevo." });
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });
});
