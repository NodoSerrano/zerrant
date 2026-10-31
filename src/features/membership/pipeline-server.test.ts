import { beforeEach, describe, expect, it, vi } from "vitest";
import { loadMembershipPipeline } from "./pipeline-server";

const profileRow = {
  nombre: "Ana",
  apellido: "Paz",
  fecha_nacimiento: "1990-01-01",
  onboarding_completado_en: "2026-10-01T00:00:00Z",
  tier: "tourist",
};

type Result = { data: unknown; error: { code?: string; message?: string } | null };

function makeSupabase(opts: {
  user?: { id: string; email_confirmed_at?: string | null } | null;
  profile?: Result;
  request?: Result;
}) {
  const calls: { table: string; ops: unknown[][] }[] = [];
  const chain = (table: string, result: Result) => {
    const ops: unknown[][] = [];
    calls.push({ table, ops });
    const q: Record<string, unknown> = {};
    for (const m of ["select", "eq", "order", "limit"]) {
      q[m] = (...args: unknown[]) => {
        ops.push([m, ...args]);
        return q;
      };
    }
    q.single = () => Promise.resolve(result);
    q.maybeSingle = () => Promise.resolve(result);
    return q;
  };
  return {
    calls,
    client: {
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: opts.user ?? null } }) },
      from: vi.fn((table: string) =>
        chain(
          table,
          table === "profiles"
            ? (opts.profile ?? { data: profileRow, error: null })
            : (opts.request ?? { data: null, error: null }),
        ),
      ),
    },
  };
}

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("loadMembershipPipeline", () => {
  it("returns a no-session input without querying tables", async () => {
    const s = makeSupabase({ user: null });
    const r = await loadMembershipPipeline(s.client as never);

    expect(r).toMatchObject({ hasSession: false, profile: null, request: null });
    expect(s.client.from).not.toHaveBeenCalled();
  });

  it("loads profile, email confirmation and the latest own request", async () => {
    const s = makeSupabase({
      user: { id: "u1", email_confirmed_at: "2026-10-01T00:00:00Z" },
      request: { data: { estado: "entrevista_coordinada" }, error: null },
    });
    const r = await loadMembershipPipeline(s.client as never);

    expect(r).toEqual({
      hasSession: true,
      emailConfirmed: true,
      profile: profileRow,
      request: { estado: "entrevista_coordinada" },
      profileError: false,
      requestError: false,
    });
    const req = s.calls.find((c) => c.table === "membership_requests")!;
    expect(req.ops).toContainEqual(["eq", "profile_id", "u1"]);
    expect(req.ops).toContainEqual(["order", "created_at", { ascending: false }]);
    expect(req.ops).toContainEqual(["limit", 1]);
  });

  it("reports an unconfirmed email", async () => {
    const s = makeSupabase({ user: { id: "u1", email_confirmed_at: null } });
    expect((await loadMembershipPipeline(s.client as never)).emailConfirmed).toBe(false);
  });

  it("treats a missing profile row as no profile, not an error", async () => {
    const s = makeSupabase({
      user: { id: "u1" },
      profile: { data: null, error: { code: "PGRST116" } },
    });
    const r = await loadMembershipPipeline(s.client as never);

    expect(r.profile).toBeNull();
    expect(r.profileError).toBe(false);
  });

  it("flags an infra profile error and skips the request read", async () => {
    const s = makeSupabase({
      user: { id: "u1" },
      profile: { data: null, error: { code: "500", message: "boom" } },
    });
    const r = await loadMembershipPipeline(s.client as never);

    expect(r.profileError).toBe(true);
    expect(s.client.from).toHaveBeenCalledTimes(1);
  });

  it("flags a request read error and never invents a request", async () => {
    const s = makeSupabase({
      user: { id: "u1" },
      request: { data: null, error: { code: "500", message: "boom" } },
    });
    const r = await loadMembershipPipeline(s.client as never);

    expect(r.requestError).toBe(true);
    expect(r.request).toBeNull();
  });

  it("brings when a cerrada request closed and whether an admin reopened it (ZER-180)", async () => {
    const s = makeSupabase({
      user: { id: "u1", email_confirmed_at: "2026-10-01T00:00:00Z" },
      request: {
        data: {
          estado: "cerrada",
          cerrada_en: "2026-10-20T15:00:00.000Z",
          reapertura_habilitada_en: null,
        },
        error: null,
      },
    });
    const r = await loadMembershipPipeline(s.client as never);

    expect(r.request).toEqual({
      estado: "cerrada",
      cerradaEn: "2026-10-20T15:00:00.000Z",
      reaperturaHabilitadaEn: null,
    });
    const req = s.calls.find((c) => c.table === "membership_requests")!;
    expect(req.ops).toContainEqual(["select", "estado, cerrada_en, reapertura_habilitada_en"]);
  });

  it("ignores a request row with an unknown estado", async () => {
    const s = makeSupabase({
      user: { id: "u1" },
      request: { data: { estado: "rechazada" }, error: null },
    });
    const r = await loadMembershipPipeline(s.client as never);

    expect(r.request).toBeNull();
    expect(r.requestError).toBe(true);
  });
});
