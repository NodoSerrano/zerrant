import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  profilesSelect: vi.fn(),
  profilesSelectEq: vi.fn(),
  profilesSelectSingle: vi.fn(),
  eventsInsert: vi.fn(),
  eventsSelect: vi.fn(),
  eventsInsertPayload: null as unknown,
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

import { createEvent } from "./actions";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.eventsInsertPayload = null;
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
