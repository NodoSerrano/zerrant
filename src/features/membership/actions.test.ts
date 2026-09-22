import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  profilesSelectSingle: vi.fn(),
  pendingMaybeSingle: vi.fn(),
  membershipInsert: vi.fn(),
  redirect: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: mocks.getUser },
    from: vi.fn((table: string) => {
      if (table === "profiles") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: mocks.profilesSelectSingle,
            })),
          })),
        };
      }
      if (table === "membership_requests") {
        return {
          insert: mocks.membershipInsert,
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                maybeSingle: mocks.pendingMaybeSingle,
              })),
            })),
          })),
        };
      }
      return {};
    }),
  }),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    mocks.redirect(url);
    throw new Error(`NEXT_REDIRECT:${url}`);
  },
}));

import { createMembershipRequest } from "./actions";

function screeningForm(extra: Record<string, string> = {}) {
  const fd = new FormData();
  fd.set("contacto_whatsapp", "1122334455");
  fd.set("frecuencia_uso", "1_semana");
  fd.set("duracion_visita", "2_4h");
  fd.set("aporte_actitud", "comodo");
  fd.set("reunion_disponibilidad", "Martes 18hs");
  for (const [k, v] of Object.entries(extra)) {
    fd.set(k, v);
  }
  return fd;
}

const screeningInsert = {
  contacto_whatsapp: "1122334455",
  frecuencia_uso: "1_semana",
  duracion_visita: "2_4h",
  aporte_actitud: "comodo",
  reunion_disponibilidad: "Martes 18hs",
  situacion_actual: null,
  ocupacion_detalle: null,
  entrevista_items: null,
  aporte_otro: null,
  aporte_mayor: null,
  mensaje: null,
};

function setupAuth(userId = "test-user-id") {
  mocks.getUser.mockResolvedValue({ data: { user: { id: userId } } });
}

function setupTourist() {
  setupAuth();
  mocks.profilesSelectSingle.mockResolvedValue({ data: { tier: "tourist" }, error: null });
  mocks.pendingMaybeSingle.mockResolvedValue({ data: null, error: null });
}

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("createMembershipRequest", () => {
  it("creates a membership request and redirects to /solicitar/enviado on success", async () => {
    setupTourist();
    mocks.membershipInsert.mockResolvedValue({ error: null });

    const fd = screeningForm({ mensaje: "Quiero ayudar con la huerta" });

    await expect(createMembershipRequest(null, fd)).rejects.toThrow(
      "NEXT_REDIRECT:/solicitar/enviado",
    );

    expect(mocks.membershipInsert).toHaveBeenCalledWith({
      profile_id: "test-user-id",
      ...screeningInsert,
      mensaje: "Quiero ayudar con la huerta",
    });
    expect(mocks.redirect).toHaveBeenCalledWith("/solicitar/enviado");
  });

  it("rejects missing screening core without inserting", async () => {
    setupTourist();

    const result = await createMembershipRequest(null, new FormData());

    expect(result).toEqual({
      error: "Completá WhatsApp, uso del espacio, aporte y horario de reunión",
    });
    expect(mocks.membershipInsert).not.toHaveBeenCalled();
  });

  it("returns error when unauthenticated", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null } });

    const result = await createMembershipRequest(null, new FormData());

    expect(result).toEqual({ error: "No autorizado" });
    expect(mocks.membershipInsert).not.toHaveBeenCalled();
  });

  it("returns a generic error when insert fails", async () => {
    setupTourist();
    mocks.membershipInsert.mockResolvedValue({
      error: { message: "new row violates row-level security policy" },
    });

    const result = await createMembershipRequest(null, screeningForm());

    expect(result).toEqual({ error: "No pudimos enviar tu solicitud. Probá de nuevo." });
  });

  it("stores null when mensaje is absent or only whitespace", async () => {
    setupTourist();
    mocks.membershipInsert.mockResolvedValue({ error: null });

    const fd = screeningForm({ mensaje: "   " });

    await expect(createMembershipRequest(null, fd)).rejects.toThrow(
      "NEXT_REDIRECT:/solicitar/enviado",
    );

    expect(mocks.membershipInsert).toHaveBeenCalledWith({
      profile_id: "test-user-id",
      ...screeningInsert,
      mensaje: null,
    });
  });

  it("ignores a non-string mensaje field", async () => {
    setupTourist();
    mocks.membershipInsert.mockResolvedValue({ error: null });

    const fd = screeningForm();
    fd.set("mensaje", new File(["x"], "note.txt", { type: "text/plain" }));

    await expect(createMembershipRequest(null, fd)).rejects.toThrow(
      "NEXT_REDIRECT:/solicitar/enviado",
    );

    expect(mocks.membershipInsert).toHaveBeenCalledWith({
      profile_id: "test-user-id",
      ...screeningInsert,
      mensaje: null,
    });
  });

  it("rejects non-tourist profiles without inserting", async () => {
    setupAuth();
    mocks.profilesSelectSingle.mockResolvedValue({ data: { tier: "standard" }, error: null });

    const result = await createMembershipRequest(null, new FormData());

    expect(result).toEqual({ error: "Solo los tourists pueden solicitar membresía." });
    expect(mocks.membershipInsert).not.toHaveBeenCalled();
  });

  it("returns a generic error when the profile read fails", async () => {
    setupAuth();
    mocks.profilesSelectSingle.mockResolvedValue({
      data: null,
      error: { code: "57014", message: "canceling statement due to statement timeout" },
    });

    const result = await createMembershipRequest(null, new FormData());

    expect(result).toEqual({ error: "No pudimos enviar tu solicitud. Probá de nuevo." });
    expect(mocks.membershipInsert).not.toHaveBeenCalled();
  });

  it("rejects a second pending request without inserting", async () => {
    setupAuth();
    mocks.profilesSelectSingle.mockResolvedValue({ data: { tier: "tourist" }, error: null });
    mocks.pendingMaybeSingle.mockResolvedValue({ data: { id: "req-1" }, error: null });

    const result = await createMembershipRequest(null, new FormData());

    expect(result).toEqual({ error: "Ya tenes una solicitud pendiente." });
    expect(mocks.membershipInsert).not.toHaveBeenCalled();
  });

  it("maps a unique-violation on the one-pending index to the pending message", async () => {
    // The pre-check races: between `maybeSingle` and the insert another submit
    // can land. The partial unique index is what actually enforces the rule, so
    // 23505 means "already pending", not an unknown DB failure.
    setupTourist();
    mocks.membershipInsert.mockResolvedValue({
      error: {
        code: "23505",
        message:
          'duplicate key value violates unique constraint "membership_requests_one_pending_per_profile"',
      },
    });

    const result = await createMembershipRequest(null, screeningForm());

    expect(result).toEqual({ error: "Ya tenes una solicitud pendiente." });
  });

  it("logs the supabase error when the insert fails", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    setupTourist();
    mocks.membershipInsert.mockResolvedValue({
      error: { code: "42P17", message: "infinite recursion detected in policy" },
    });

    await createMembershipRequest(null, screeningForm());

    expect(spy).toHaveBeenCalledWith(
      "[createMembershipRequest] insert failed",
      expect.objectContaining({ code: "42P17" }),
    );
  });

  it("logs the supabase error when the profile read fails", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    setupAuth();
    mocks.profilesSelectSingle.mockResolvedValue({
      data: null,
      error: { code: "57014", message: "canceling statement due to statement timeout" },
    });

    await createMembershipRequest(null, new FormData());

    expect(spy).toHaveBeenCalledWith(
      "[createMembershipRequest] profile read failed",
      expect.objectContaining({ code: "57014" }),
    );
  });
});
