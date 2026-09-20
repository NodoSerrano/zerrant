import { describe, expect, it, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  profilesSelect: vi.fn(),
  profilesSelectEq: vi.fn(),
  profilesSelectSingle: vi.fn(),
  aportesInsert: vi.fn(),
  aportesSelect: vi.fn(),
  aportesInsertPayload: null as unknown,
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
      if (table === "aportes") {
        return {
          insert: mocks.aportesInsert.mockImplementation((payload: unknown) => {
            mocks.aportesInsertPayload = payload;
            return {
              select: mocks.aportesSelect,
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

import { createAporte } from "./actions";

beforeEach(() => {
  vi.clearAllMocks();
});

function setupAuth(userId = "user-self") {
  mocks.getUser.mockResolvedValue({ data: { user: { id: userId } } });
}

function makeFormData(overrides: Record<string, string> = {}) {
  const fd = new FormData();
  fd.set("tipo", "donacion");
  fd.set("descripcion", "Doné un proyector Epson");
  fd.set("fecha", "2026-07-12");
  fd.set("monto", "");
  for (const [k, v] of Object.entries(overrides)) {
    fd.set(k, v);
  }
  return fd;
}

describe("createAporte", () => {
  it("writes self-load with profile_id === registrado_por === auth.uid()", async () => {
    setupAuth("user-self");
    mocks.profilesSelectSingle.mockResolvedValue({
      data: { tier: "standard", is_platform_admin: false },
    });
    mocks.aportesSelect.mockResolvedValue({ error: null, data: [{ id: "a1" }] });

    await expect(createAporte(null, makeFormData())).rejects.toThrow(
      "NEXT_REDIRECT:/profile/aportes",
    );

    expect(mocks.aportesInsertPayload).toEqual({
      profile_id: "user-self",
      registrado_por: "user-self",
      tipo: "donacion",
      descripcion: "Doné un proyector Epson",
      fecha: "2026-07-12",
      monto: null,
    });
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/profile/aportes");
  });

  it.each(["", "   "])("stores empty monto %j as null, not 0", async (monto) => {
    setupAuth();
    mocks.profilesSelectSingle.mockResolvedValue({
      data: { tier: "standard", is_platform_admin: false },
    });
    mocks.aportesSelect.mockResolvedValue({ error: null, data: [{ id: "a1" }] });

    await expect(createAporte(null, makeFormData({ monto }))).rejects.toThrow("NEXT_REDIRECT");

    const payload = mocks.aportesInsertPayload as { monto: unknown };
    expect(payload.monto).toBeNull();
  });

  it("parses a numeric monto as a finite number", async () => {
    setupAuth();
    mocks.profilesSelectSingle.mockResolvedValue({
      data: { tier: "standard", is_platform_admin: false },
    });
    mocks.aportesSelect.mockResolvedValue({ error: null, data: [{ id: "a1" }] });

    await expect(createAporte(null, makeFormData({ monto: "1500.5" }))).rejects.toThrow(
      "NEXT_REDIRECT",
    );

    expect(mocks.aportesInsertPayload).toEqual(expect.objectContaining({ monto: 1500.5 }));
  });

  it("admin-load writes target profile_id and admin as registrado_por", async () => {
    setupAuth("admin-1");
    mocks.profilesSelectSingle.mockResolvedValue({
      data: { tier: "founder", is_platform_admin: true },
    });
    mocks.aportesSelect.mockResolvedValue({ error: null, data: [{ id: "a1" }] });

    await expect(
      createAporte(
        null,
        makeFormData({ profile_id: "serrano-other", tipo: "economico", monto: "100" }),
      ),
    ).rejects.toThrow("NEXT_REDIRECT");

    expect(mocks.aportesInsertPayload).toEqual({
      profile_id: "serrano-other",
      registrado_por: "admin-1",
      tipo: "economico",
      descripcion: "Doné un proyector Epson",
      fecha: "2026-07-12",
      monto: 100,
    });
  });

  it("rejects a tipo outside the nine-value allow-list without casting", async () => {
    setupAuth();
    mocks.profilesSelectSingle.mockResolvedValue({
      data: { tier: "standard", is_platform_admin: false },
    });

    const result = await createAporte(null, makeFormData({ tipo: "bitcoin" }));

    expect(result).toEqual({ error: "Revisá el tipo de aporte." });
    expect(mocks.aportesInsert).not.toHaveBeenCalled();
  });

  it("rejects a blank descripcion without writing", async () => {
    setupAuth();
    mocks.profilesSelectSingle.mockResolvedValue({
      data: { tier: "standard", is_platform_admin: false },
    });

    const result = await createAporte(null, makeFormData({ descripcion: "   " }));

    expect(result).toEqual({ error: "La descripción no puede estar vacía." });
    expect(mocks.aportesInsert).not.toHaveBeenCalled();
  });

  it("rejects a missing fecha without writing", async () => {
    setupAuth();
    mocks.profilesSelectSingle.mockResolvedValue({
      data: { tier: "standard", is_platform_admin: false },
    });
    const fd = makeFormData();
    fd.delete("fecha");

    const result = await createAporte(null, fd);

    expect(result).toEqual({ error: "Indicá la fecha del aporte." });
    expect(mocks.aportesInsert).not.toHaveBeenCalled();
  });

  it("rejects a non-numeric monto without writing", async () => {
    setupAuth();
    mocks.profilesSelectSingle.mockResolvedValue({
      data: { tier: "standard", is_platform_admin: false },
    });

    const result = await createAporte(null, makeFormData({ monto: "mucho" }));

    expect(result).toEqual({ error: "El monto tiene que ser un número." });
    expect(mocks.aportesInsert).not.toHaveBeenCalled();
  });

  it("returns unauthorized when there is no session", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null } });

    const result = await createAporte(null, makeFormData());

    expect(result).toEqual({ error: "No autorizado" });
    expect(mocks.aportesInsert).not.toHaveBeenCalled();
  });

  it("surfaces a Spanish error when the insert fails", async () => {
    setupAuth();
    mocks.profilesSelectSingle.mockResolvedValue({
      data: { tier: "standard", is_platform_admin: false },
    });
    mocks.aportesSelect.mockResolvedValue({ error: { message: "rls" }, data: null });

    const result = await createAporte(null, makeFormData());

    expect(result).toEqual({ error: "No pudimos registrar el aporte. Probá de nuevo." });
  });

  it("treats a zero-row insert as failure", async () => {
    setupAuth();
    mocks.profilesSelectSingle.mockResolvedValue({
      data: { tier: "standard", is_platform_admin: false },
    });
    mocks.aportesSelect.mockResolvedValue({ error: null, data: [] });

    const result = await createAporte(null, makeFormData());

    expect(result).toEqual({ error: "No pudimos registrar el aporte." });
  });
});
