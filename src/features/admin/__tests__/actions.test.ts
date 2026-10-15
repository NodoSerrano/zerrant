import { describe, expect, it, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  profilesSelect: vi.fn(),
  profilesSelectEq: vi.fn(),
  profilesSelectSingle: vi.fn(),
  rpc: vi.fn(),
  revalidatePath: vi.fn(),
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
}

const VALID_UUID = "11111111-1111-4111-8111-111111111111";

const makeFormData = (to: string = "entrevista_solicitada", requestId = VALID_UUID) => {
  const fd = new FormData();
  fd.set("requestId", requestId);
  fd.set("to", to);
  return fd;
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

    const result = await transitionRequest(null, makeFormData("cerrada"));

    expect(result).toEqual({ error: `msg ${code}` });
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
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
