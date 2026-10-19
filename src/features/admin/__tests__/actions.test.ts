import { describe, expect, it, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  profilesSelect: vi.fn(),
  profilesSelectEq: vi.fn(),
  profilesSelectSingle: vi.fn(),
  rpc: vi.fn(),
  revalidatePath: vi.fn(),
  requestSingle: vi.fn(),
  requestEq: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: mocks.getUser },
    rpc: mocks.rpc,
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
      if (table === "membership_requests") {
        return {
          select: vi.fn(() => ({
            eq: mocks.requestEq.mockImplementation(() => ({ single: mocks.requestSingle })),
          })),
        };
      }
      return {};
    }),
  }),
}));

vi.mock("next/cache", () => ({
  revalidatePath: mocks.revalidatePath,
}));

import { saveInterviewNote, transitionRequest } from "../actions";

beforeEach(() => {
  vi.clearAllMocks();
});

function setupAdmin() {
  mocks.getUser.mockResolvedValue({ data: { user: { id: "admin-user-id" } } });
  mocks.profilesSelectSingle.mockResolvedValue({ data: { is_platform_admin: true } });
  // The request is still where the form says it was, unless a test says otherwise.
  mocks.requestSingle.mockImplementation(async () => ({
    data: { estado: lastFrom },
    error: null,
  }));
}

let lastFrom = "pendiente_coordinacion";

const VALID_UUID = "11111111-1111-4111-8111-111111111111";

const makeFormData = (
  to: string = "entrevista_solicitada",
  requestId = VALID_UUID,
  extra: Record<string, string> = {},
) => {
  const fd = new FormData();
  fd.set("requestId", requestId);
  fd.set("to", to);
  // Every real form sends the estado the admin was looking at (RequestCard).
  fd.set("from", FROM_FOR[to] ?? "pendiente_coordinacion");
  for (const [key, value] of Object.entries(extra)) fd.set(key, value);
  lastFrom = String(fd.get("from"));
  return fd;
};

const FROM_FOR: Record<string, string> = {
  entrevista_solicitada: "pendiente_coordinacion",
  entrevista_coordinada: "entrevista_solicitada",
  reprogramacion: "entrevista_coordinada",
  entrevista_realizada: "entrevista_coordinada",
  aprobado: "entrevista_realizada",
  cerrada: "pendiente_coordinacion",
};

describe("transitionRequest", () => {
  it("calls the transition RPC and returns the new estado label on success", async () => {
    setupAdmin();
    mocks.rpc.mockResolvedValue({
      data: { success: true, estado: "entrevista_solicitada" },
      error: null,
    });

    const result = await transitionRequest(null, makeFormData("entrevista_solicitada"));

    expect(mocks.rpc).toHaveBeenCalledWith("transition_membership_request", {
      p_request_id: VALID_UUID,
      p_to: "entrevista_solicitada",
    });
    expect(result).toEqual({ success: "Estado actualizado: Entrevista solicitada" });
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/admin/membresias");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/profile", "layout");
  });

  it.each([
    "forbidden",
    "not_found",
    "invalid_transition",
    "unsupported_tier",
    "invalid_motivo",
    "conflict",
  ])("surfaces the RPC error for code %s without revalidating", async (code) => {
    setupAdmin();
    mocks.rpc.mockResolvedValue({ data: { error: `msg ${code}`, code }, error: null });

    const result = await transitionRequest(
      null,
      makeFormData("cerrada", VALID_UUID, { motivo: "No encaja" }),
    );

    expect(result).toEqual({ error: `msg ${code}` });
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });

  it("surfaces a self-approval rejection from the trigger hint, not the message text", async () => {
    setupAdmin();
    mocks.rpc.mockResolvedValue({
      data: null,
      error: {
        code: "23514",
        hint: "self_approve",
        message: "wrapped: check_violation",
      },
    });

    const result = await transitionRequest(null, makeFormData("aprobado"));

    expect(result).toEqual({ error: "No podés aprobar tu propia solicitud" });
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });

  it("does not treat every check_violation as self-approval", async () => {
    setupAdmin();
    mocks.rpc.mockResolvedValue({
      data: null,
      error: { code: "23514", hint: null, message: "Transición inválida" },
    });

    const result = await transitionRequest(null, makeFormData("aprobado"));

    expect(result).toEqual({ error: "No pudimos actualizar la solicitud" });
  });

  it("returns a generic error when the RPC call itself fails", async () => {
    setupAdmin();
    mocks.rpc.mockResolvedValue({ data: null, error: { message: "boom" } });

    const result = await transitionRequest(null, makeFormData());

    expect(result).toEqual({ error: "No pudimos actualizar la solicitud" });
  });

  it("rejects an invalid target estado without calling the RPC", async () => {
    setupAdmin();

    const result = await transitionRequest(null, makeFormData("pendiente"));

    expect(result).toEqual({ error: "Solicitud inválida" });
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("rejects a malformed request id without calling the RPC", async () => {
    setupAdmin();

    const result = await transitionRequest(null, makeFormData("cerrada", "not-a-uuid"));

    expect(result).toEqual({ error: "Solicitud inválida" });
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("rejects non-admin users without calling the RPC", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    mocks.profilesSelectSingle.mockResolvedValue({ data: { is_platform_admin: false } });

    const result = await transitionRequest(null, makeFormData());

    expect(result).toEqual({ error: "Solo un admin puede gestionar solicitudes" });
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  describe("motivo (ZER-169)", () => {
    it("requires a motivo to close a request and never calls the RPC without one", async () => {
      setupAdmin();

      const result = await transitionRequest(
        null,
        makeFormData("cerrada", VALID_UUID, { motivo: "   " }),
      );

      expect(result).toEqual({ error: "Escribí el motivo del cierre" });
      expect(mocks.rpc).not.toHaveBeenCalled();
    });

    it("requires a motivo to close even when the field is missing", async () => {
      setupAdmin();

      const result = await transitionRequest(null, makeFormData("cerrada"));

      expect(result).toEqual({ error: "Escribí el motivo del cierre" });
      expect(mocks.rpc).not.toHaveBeenCalled();
    });

    it("passes the trimmed motivo to the RPC when closing", async () => {
      setupAdmin();
      mocks.rpc.mockResolvedValue({ data: { success: true, estado: "cerrada" }, error: null });

      const result = await transitionRequest(
        null,
        makeFormData("cerrada", VALID_UUID, { motivo: "  No respondió en 3 semanas  " }),
      );

      expect(mocks.rpc).toHaveBeenCalledWith("transition_membership_request", {
        p_request_id: VALID_UUID,
        p_to: "cerrada",
        p_motivo: "No respondió en 3 semanas",
      });
      expect(result).toEqual({ success: "Estado actualizado: Solicitud cerrada" });
    });

    it("accepts an optional motivo when rescheduling", async () => {
      setupAdmin();
      mocks.rpc.mockResolvedValue({
        data: { success: true, estado: "reprogramacion" },
        error: null,
      });

      await transitionRequest(
        null,
        makeFormData("reprogramacion", VALID_UUID, { motivo: "Se enfermó" }),
      );

      expect(mocks.rpc).toHaveBeenCalledWith("transition_membership_request", {
        p_request_id: VALID_UUID,
        p_to: "reprogramacion",
        p_motivo: "Se enfermó",
      });
    });

    it("lets a reschedule go through without a motivo", async () => {
      setupAdmin();
      mocks.rpc.mockResolvedValue({
        data: { success: true, estado: "reprogramacion" },
        error: null,
      });

      const result = await transitionRequest(null, makeFormData("reprogramacion"));

      expect(mocks.rpc).toHaveBeenCalledWith("transition_membership_request", {
        p_request_id: VALID_UUID,
        p_to: "reprogramacion",
      });
      expect(result).toEqual({ success: "Estado actualizado: Reprogramación requerida" });
    });

    it("rejects a motivo over 500 characters", async () => {
      setupAdmin();

      const result = await transitionRequest(
        null,
        makeFormData("cerrada", VALID_UUID, { motivo: "a".repeat(501) }),
      );

      expect(result).toEqual({ error: "El motivo puede tener hasta 500 caracteres" });
      expect(mocks.rpc).not.toHaveBeenCalled();
    });
  });

  describe("concurrent admins (ZER-169)", () => {
    it("rejects a form without the estado the admin saw, so the stale check cannot be skipped", async () => {
      setupAdmin();
      const fd = makeFormData("entrevista_coordinada");
      fd.delete("from");

      const result = await transitionRequest(null, fd);

      expect(result).toEqual({ error: "Solicitud inválida" });
      expect(mocks.rpc).not.toHaveBeenCalled();
    });

    it("rejects a from that is not a real estado", async () => {
      setupAdmin();

      const result = await transitionRequest(
        null,
        makeFormData("entrevista_coordinada", VALID_UUID, { from: "pendiente" }),
      );

      expect(result).toEqual({ error: "Solicitud inválida" });
      expect(mocks.rpc).not.toHaveBeenCalled();
    });

    it("refuses the change when another admin already moved the request", async () => {
      setupAdmin();
      mocks.requestSingle.mockResolvedValue({
        data: { estado: "entrevista_coordinada" },
        error: null,
      });

      const result = await transitionRequest(
        null,
        makeFormData("entrevista_coordinada", VALID_UUID, { from: "entrevista_solicitada" }),
      );

      expect(mocks.requestEq).toHaveBeenCalledWith("id", VALID_UUID);
      expect(result).toEqual({
        error:
          "Otro admin ya cambió esta solicitud a «Entrevista coordinada». Actualizamos la vista para que veas el estado actual.",
      });
      expect(mocks.rpc).not.toHaveBeenCalled();
      expect(mocks.revalidatePath).toHaveBeenCalledWith("/admin/membresias");
    });

    it("goes ahead when the request is still in the estado the admin saw", async () => {
      setupAdmin();
      mocks.requestSingle.mockResolvedValue({
        data: { estado: "entrevista_solicitada" },
        error: null,
      });
      mocks.rpc.mockResolvedValue({
        data: { success: true, estado: "entrevista_coordinada" },
        error: null,
      });

      const result = await transitionRequest(
        null,
        makeFormData("entrevista_coordinada", VALID_UUID, { from: "entrevista_solicitada" }),
      );

      expect(mocks.rpc).toHaveBeenCalled();
      expect(result).toEqual({ success: "Estado actualizado: Entrevista coordinada" });
    });

    it("explains a lost race reported by the RPC as a change by another admin", async () => {
      setupAdmin();
      mocks.requestSingle
        .mockResolvedValueOnce({ data: { estado: "entrevista_solicitada" }, error: null })
        .mockResolvedValueOnce({ data: { estado: "cerrada" }, error: null });
      mocks.rpc.mockResolvedValue({
        data: { error: "Ese cambio de estado no está permitido", code: "invalid_transition" },
        error: null,
      });

      const result = await transitionRequest(
        null,
        makeFormData("entrevista_coordinada", VALID_UUID, { from: "entrevista_solicitada" }),
      );

      expect(result).toEqual({
        error:
          "Otro admin ya cambió esta solicitud a «Solicitud cerrada». Actualizamos la vista para que veas el estado actual.",
      });
      expect(mocks.revalidatePath).toHaveBeenCalledWith("/admin/membresias");
    });
  });

  it("rejects unauthenticated callers", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null } });

    const result = await transitionRequest(null, makeFormData());

    expect(result).toEqual({ error: "No autorizado" });
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
});

const NOTE_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

function noteForm(fields: Record<string, string>) {
  const fd = new FormData();
  for (const [key, value] of Object.entries(fields)) fd.set(key, value);
  return fd;
}

describe("saveInterviewNote", () => {
  it("inserts via the RPC as the session admin and drops any author id from the form", async () => {
    setupAdmin();
    mocks.rpc.mockResolvedValue({
      data: {
        id: NOTE_ID,
        request_id: VALID_UUID,
        author_id: "admin-user-id",
        body: "Encaja en el nodo",
        created_at: "2026-03-01T15:04:00.000Z",
        updated_at: "2026-03-01T15:04:00.000Z",
      },
      error: null,
    });

    const result = await saveInterviewNote(
      null,
      noteForm({
        requestId: VALID_UUID,
        body: "  Encaja en el nodo  ",
        authorId: "22222222-2222-4222-8222-222222222222",
        profile_id: "33333333-3333-4333-8333-333333333333",
      }),
    );

    expect(mocks.rpc).toHaveBeenCalledWith("upsert_interview_note", {
      p_request_id: VALID_UUID,
      p_body: "Encaja en el nodo",
    });
    const payload = mocks.rpc.mock.calls[0][1] as Record<string, unknown>;
    expect(payload).not.toHaveProperty("p_author_id");
    expect(payload).not.toHaveProperty("author_id");
    expect(JSON.stringify(payload)).not.toContain("22222222");
    expect(JSON.stringify(payload)).not.toContain("33333333");
    expect(result).toEqual({ success: "Nota guardada" });
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/admin/membresias");
  });

  it("rejects non-admins before calling the RPC", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    mocks.profilesSelectSingle.mockResolvedValue({ data: { is_platform_admin: false } });

    const result = await saveInterviewNote(
      null,
      noteForm({ requestId: VALID_UUID, body: "secreto" }),
    );

    expect(result).toEqual({ error: "Solo un admin puede gestionar solicitudes" });
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("rejects unauthenticated callers before calling the RPC", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null } });

    const result = await saveInterviewNote(
      null,
      noteForm({ requestId: VALID_UUID, body: "secreto" }),
    );

    expect(result).toEqual({ error: "No autorizado" });
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it.each(["", "   ", "\n\t"])("rejects empty body %j before the RPC", async (body) => {
    setupAdmin();

    const result = await saveInterviewNote(null, noteForm({ requestId: VALID_UUID, body }));

    expect(result).toEqual({ error: "La nota no puede estar vacía" });
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("updates by sending only the note id and body", async () => {
    setupAdmin();
    mocks.rpc.mockResolvedValue({
      data: {
        id: NOTE_ID,
        request_id: VALID_UUID,
        author_id: "admin-user-id",
        body: "corregida",
        created_at: "2026-03-01T15:04:00.000Z",
        updated_at: "2026-03-01T16:00:00.000Z",
      },
      error: null,
    });

    const result = await saveInterviewNote(
      null,
      noteForm({
        noteId: NOTE_ID,
        body: " corregida ",
        requestId: VALID_UUID,
        authorId: "22222222-2222-4222-8222-222222222222",
      }),
    );

    expect(mocks.rpc).toHaveBeenCalledTimes(1);
    expect(mocks.rpc).toHaveBeenCalledWith("upsert_interview_note", {
      p_note_id: NOTE_ID,
      p_body: "corregida",
    });
    expect(result).toEqual({ success: "Nota guardada" });
  });
});
