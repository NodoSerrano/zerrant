import { describe, expect, it, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  profilesSelect: vi.fn(),
  profilesSelectEq: vi.fn(),
  profilesSelectSingle: vi.fn(),
  aportesInsert: vi.fn(),
  aportesSelect: vi.fn(),
  aportesInsertPayload: null as unknown,
  storageFrom: vi.fn(),
  storageUpload: vi.fn(),
  rpc: vi.fn(),
  revalidatePath: vi.fn(),
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: mocks.getUser },
    rpc: mocks.rpc,
    storage: {
      from: mocks.storageFrom.mockImplementation(() => ({
        upload: mocks.storageUpload,
      })),
    },
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

import { approveDonacion, createDonacion, rejectDonacion } from "./actions";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.storageUpload.mockResolvedValue({ error: null });
});

function setupAuth(userId = "user-self") {
  mocks.getUser.mockResolvedValue({ data: { user: { id: userId } } });
}

function makeFormData(overrides: Record<string, string> = {}) {
  const fd = new FormData();
  fd.set("titulo", 'Televisor 32" living');
  fd.set("tipo_ui", "regalo");
  fd.set("descripcion", "Samsung del living");
  fd.set("fecha", "2026-10-19");
  for (const [k, v] of Object.entries(overrides)) {
    fd.set(k, v);
  }
  return fd;
}

describe("createDonacion", () => {
  it("inserts pending donation mapped from regalo → donacion without monto", async () => {
    setupAuth("user-self");
    mocks.profilesSelectSingle.mockResolvedValue({
      data: { tier: "standard", is_platform_admin: false },
    });
    mocks.aportesSelect.mockResolvedValue({ error: null, data: [{ id: "d1" }] });

    await expect(createDonacion(null, makeFormData())).rejects.toThrow("NEXT_REDIRECT:/donaciones");

    expect(mocks.aportesInsertPayload).toEqual({
      profile_id: "user-self",
      registrado_por: "user-self",
      tipo: "donacion",
      titulo: 'Televisor 32" living',
      descripcion: "Samsung del living",
      fecha: "2026-10-19",
      monto: null,
      estado: "pendiente",
      imagen_path: null,
      prestamo_desde: null,
      prestamo_hasta: null,
    });
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/donaciones");
  });

  it("maps por_un_tiempo → prestamo", async () => {
    setupAuth();
    mocks.profilesSelectSingle.mockResolvedValue({
      data: { tier: "standard", is_platform_admin: false },
    });
    mocks.aportesSelect.mockResolvedValue({ error: null, data: [{ id: "d1" }] });

    await expect(createDonacion(null, makeFormData({ tipo_ui: "por_un_tiempo" }))).rejects.toThrow(
      "NEXT_REDIRECT",
    );

    expect(mocks.aportesInsertPayload).toEqual(
      expect.objectContaining({ tipo: "prestamo", estado: "pendiente" }),
    );
  });

  it("rejects blank titulo", async () => {
    setupAuth();
    mocks.profilesSelectSingle.mockResolvedValue({
      data: { tier: "standard", is_platform_admin: false },
    });

    const result = await createDonacion(null, makeFormData({ titulo: "  " }));
    expect(result).toEqual({ error: "Indicá un título para la donación." });
    expect(mocks.aportesInsert).not.toHaveBeenCalled();
  });

  it("rejects invalid tipo_ui", async () => {
    setupAuth();
    mocks.profilesSelectSingle.mockResolvedValue({
      data: { tier: "standard", is_platform_admin: false },
    });

    const result = await createDonacion(null, makeFormData({ tipo_ui: "economico" }));
    expect(result).toEqual({ error: "Revisá el tipo de donación." });
    expect(mocks.aportesInsert).not.toHaveBeenCalled();
  });

  it("rejects tourists", async () => {
    setupAuth();
    mocks.profilesSelectSingle.mockResolvedValue({
      data: { tier: "tourist", is_platform_admin: false },
    });

    const result = await createDonacion(null, makeFormData());
    expect(result).toEqual({ error: "Solo miembros pueden registrar donaciones." });
    expect(mocks.aportesInsert).not.toHaveBeenCalled();
  });

  it("returns unauthorized without session", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null } });
    const result = await createDonacion(null, makeFormData());
    expect(result).toEqual({ error: "No autorizado" });
  });

  it("soft-fails storage upload: inserts with imagen_path null and redirects with aviso", async () => {
    setupAuth("user-self");
    mocks.profilesSelectSingle.mockResolvedValue({
      data: { tier: "standard", is_platform_admin: false },
    });
    mocks.storageUpload.mockResolvedValue({
      error: { message: "Bucket not found" },
    });
    mocks.aportesSelect.mockResolvedValue({ error: null, data: [{ id: "d1" }] });

    const fd = makeFormData();
    fd.set("imagen", new File([new Uint8Array([1, 2, 3])], "tv.jpg", { type: "image/jpeg" }));

    await expect(createDonacion(null, fd)).rejects.toThrow(
      "NEXT_REDIRECT:/donaciones?aviso=imagen",
    );

    expect(mocks.aportesInsert).toHaveBeenCalled();
    expect(mocks.aportesInsertPayload).toEqual(
      expect.objectContaining({
        imagen_path: null,
        estado: "pendiente",
        titulo: 'Televisor 32" living',
      }),
    );
  });

  it("inserts with imagen_path when storage upload succeeds", async () => {
    setupAuth("user-self");
    mocks.profilesSelectSingle.mockResolvedValue({
      data: { tier: "standard", is_platform_admin: false },
    });
    mocks.storageUpload.mockResolvedValue({ error: null });
    mocks.aportesSelect.mockResolvedValue({ error: null, data: [{ id: "d1" }] });

    const fd = makeFormData();
    fd.set("imagen", new File([new Uint8Array([1, 2, 3])], "tv.jpg", { type: "image/jpeg" }));

    await expect(createDonacion(null, fd)).rejects.toThrow("NEXT_REDIRECT:/donaciones");

    expect(mocks.aportesInsertPayload).toEqual(
      expect.objectContaining({
        imagen_path: expect.stringMatching(/^user-self\/.+\.jpg$/),
      }),
    );
  });

  it("still hard-rejects invalid image mime before insert", async () => {
    setupAuth("user-self");
    mocks.profilesSelectSingle.mockResolvedValue({
      data: { tier: "standard", is_platform_admin: false },
    });

    const fd = makeFormData();
    fd.set("imagen", new File([new Uint8Array([1])], "doc.pdf", { type: "application/pdf" }));

    const result = await createDonacion(null, fd);
    expect(result).toEqual({
      error: "Formato de imagen no permitido. Usá JPG, PNG o WebP.",
    });
    expect(mocks.aportesInsert).not.toHaveBeenCalled();
  });

  it("persists optional prestamo dates when tipo is por_un_tiempo", async () => {
    setupAuth("user-self");
    mocks.profilesSelectSingle.mockResolvedValue({
      data: { tier: "standard", is_platform_admin: false },
    });
    mocks.aportesSelect.mockResolvedValue({ error: null, data: [{ id: "d1" }] });

    await expect(
      createDonacion(
        null,
        makeFormData({
          tipo_ui: "por_un_tiempo",
          prestamo_desde: "2026-10-01",
          prestamo_hasta: "2026-11-01",
        }),
      ),
    ).rejects.toThrow("NEXT_REDIRECT:/donaciones");

    expect(mocks.aportesInsertPayload).toEqual(
      expect.objectContaining({
        tipo: "prestamo",
        prestamo_desde: "2026-10-01",
        prestamo_hasta: "2026-11-01",
      }),
    );
  });

  it("allows partial prestamo date range", async () => {
    setupAuth("user-self");
    mocks.profilesSelectSingle.mockResolvedValue({
      data: { tier: "standard", is_platform_admin: false },
    });
    mocks.aportesSelect.mockResolvedValue({ error: null, data: [{ id: "d1" }] });

    await expect(
      createDonacion(
        null,
        makeFormData({
          tipo_ui: "por_un_tiempo",
          prestamo_desde: "2026-10-01",
        }),
      ),
    ).rejects.toThrow("NEXT_REDIRECT");

    expect(mocks.aportesInsertPayload).toEqual(
      expect.objectContaining({
        prestamo_desde: "2026-10-01",
        prestamo_hasta: null,
      }),
    );
  });

  it("rejects prestamo_desde > prestamo_hasta", async () => {
    setupAuth("user-self");
    mocks.profilesSelectSingle.mockResolvedValue({
      data: { tier: "standard", is_platform_admin: false },
    });

    const result = await createDonacion(
      null,
      makeFormData({
        tipo_ui: "por_un_tiempo",
        prestamo_desde: "2026-12-01",
        prestamo_hasta: "2026-11-01",
      }),
    );

    expect(result).toEqual({
      error: "La fecha desde no puede ser posterior a la fecha hasta.",
    });
    expect(mocks.aportesInsert).not.toHaveBeenCalled();
  });

  it("ignores prestamo dates when tipo is regalo", async () => {
    setupAuth("user-self");
    mocks.profilesSelectSingle.mockResolvedValue({
      data: { tier: "standard", is_platform_admin: false },
    });
    mocks.aportesSelect.mockResolvedValue({ error: null, data: [{ id: "d1" }] });

    await expect(
      createDonacion(
        null,
        makeFormData({
          tipo_ui: "regalo",
          prestamo_desde: "2026-10-01",
          prestamo_hasta: "2026-11-01",
        }),
      ),
    ).rejects.toThrow("NEXT_REDIRECT");

    expect(mocks.aportesInsertPayload).toEqual(
      expect.objectContaining({
        tipo: "donacion",
        prestamo_desde: null,
        prestamo_hasta: null,
      }),
    );
  });
});

describe("approveDonacion / rejectDonacion", () => {
  function makeApproveFd(id = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee") {
    const fd = new FormData();
    fd.set("aporte_id", id);
    fd.set("notas", "ok");
    return fd;
  }

  it("admin calls approve RPC", async () => {
    setupAuth("admin-1");
    mocks.profilesSelectSingle.mockResolvedValue({
      data: { is_platform_admin: true },
    });
    mocks.rpc.mockResolvedValue({ data: { success: true }, error: null });

    await expect(approveDonacion(null, makeApproveFd())).rejects.toThrow(
      "NEXT_REDIRECT:/admin/donaciones",
    );

    expect(mocks.rpc).toHaveBeenCalledWith("approve_aporte_donacion", {
      p_aporte_id: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
      p_notas: "ok",
    });
  });

  it("non-admin cannot approve", async () => {
    setupAuth();
    mocks.profilesSelectSingle.mockResolvedValue({
      data: { is_platform_admin: false },
    });

    const result = await approveDonacion(null, makeApproveFd());
    expect(result).toEqual({ error: "Solo un admin puede aprobar donaciones" });
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("surfaces RPC self-approve error", async () => {
    setupAuth("admin-1");
    mocks.profilesSelectSingle.mockResolvedValue({
      data: { is_platform_admin: true },
    });
    mocks.rpc.mockResolvedValue({
      data: { error: "No podés aprobar tu propia donación" },
      error: null,
    });

    const result = await approveDonacion(null, makeApproveFd());
    expect(result).toEqual({ error: "No podés aprobar tu propia donación" });
  });

  it("admin calls reject RPC", async () => {
    setupAuth("admin-1");
    mocks.profilesSelectSingle.mockResolvedValue({
      data: { is_platform_admin: true },
    });
    mocks.rpc.mockResolvedValue({ data: { success: true }, error: null });

    await expect(rejectDonacion(null, makeApproveFd())).rejects.toThrow(
      "NEXT_REDIRECT:/admin/donaciones",
    );

    expect(mocks.rpc).toHaveBeenCalledWith("reject_aporte_donacion", {
      p_aporte_id: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
      p_notas: "ok",
    });
  });
});
