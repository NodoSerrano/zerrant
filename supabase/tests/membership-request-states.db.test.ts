import { randomUUID } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  MEMBERSHIP_REQUEST_TRANSITIONS,
  type MembershipRequestEstado,
} from "@/features/membership/request-state";

// Local stack defaults from `supabase status` (demo keys, not secrets).
const API_URL = process.env.SUPABASE_TEST_URL ?? "http://127.0.0.1:54321";
const ANON_KEY =
  process.env.SUPABASE_TEST_ANON_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";
const SERVICE_KEY =
  process.env.SUPABASE_TEST_SERVICE_ROLE_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";

const PASSWORD = "zer143-test-password";
const NO_SESSION = { auth: { persistSession: false, autoRefreshToken: false } };

const service = createClient(API_URL, SERVICE_KEY, NO_SESSION);
const createdUserIds: string[] = [];

type TestUser = { id: string; client: SupabaseClient };

async function createUser(opts: { admin?: boolean } = {}): Promise<TestUser> {
  const email = `zer143-${randomUUID()}@test.local`;
  const { data, error } = await service.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
  });
  if (error || !data.user) throw error ?? new Error("createUser returned no user");
  createdUserIds.push(data.user.id);

  if (opts.admin) {
    const { error: adminError } = await service
      .from("profiles")
      .update({ is_platform_admin: true })
      .eq("id", data.user.id);
    if (adminError) throw adminError;
  }

  const client = createClient(API_URL, ANON_KEY, NO_SESSION);
  const { error: signInError } = await client.auth.signInWithPassword({
    email,
    password: PASSWORD,
  });
  if (signInError) throw signInError;
  return { id: data.user.id, client };
}

async function submitRequest(owner: TestUser): Promise<string> {
  const { data, error } = await owner.client
    .from("membership_requests")
    .insert({ profile_id: owner.id, mensaje: "zer143" })
    .select("id")
    .single();
  if (error || !data) throw error ?? new Error("insert returned no row");
  return data.id as string;
}

async function transition(
  actor: TestUser,
  requestId: string,
  to: MembershipRequestEstado,
  motivo?: string,
) {
  return actor.client.rpc("transition_membership_request", {
    p_request_id: requestId,
    p_to: to,
    ...(motivo === undefined ? {} : { p_motivo: motivo }),
  });
}

async function readEstado(requestId: string): Promise<string> {
  const { data, error } = await service
    .from("membership_requests")
    .select("estado")
    .eq("id", requestId)
    .single();
  if (error || !data) throw error ?? new Error("request not found");
  return data.estado as string;
}

async function readEvents(requestId: string) {
  const { data, error } = await service
    .from("membership_request_events")
    .select("from_estado, to_estado, actor_id, motivo, created_at")
    .eq("request_id", requestId)
    .order("created_at", { ascending: true })
    .order("id", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

async function walk(admin: TestUser, requestId: string, path: MembershipRequestEstado[]) {
  for (const to of path) {
    const { data, error } = await transition(admin, requestId, to);
    expect(error, `rpc error on → ${to}`).toBeNull();
    expect(data, `→ ${to}`).toEqual({ success: true, estado: to });
  }
}

let admin: TestUser;

beforeAll(async () => {
  admin = await createUser({ admin: true });
});

afterAll(async () => {
  // profiles → membership_requests → membership_request_events cascade.
  for (const id of createdUserIds) {
    await service.auth.admin.deleteUser(id);
  }
});

describe("ZER-143 transitions table (DB ↔ TS parity)", () => {
  it("DB table mirrors MEMBERSHIP_REQUEST_TRANSITIONS exactly", async () => {
    const { data, error } = await admin.client
      .from("membership_request_transitions")
      .select("from_estado, to_estado, actor");
    expect(error).toBeNull();
    const db = (data ?? []).map((r) => `${r.from_estado}>${r.to_estado}>${r.actor}`).sort();
    const ts = MEMBERSHIP_REQUEST_TRANSITIONS.map((t) => `${t.from}>${t.to}>${t.actor}`).sort();
    expect(db).toEqual(ts);
  });

  it("nobody but migrations can write the transitions table", async () => {
    const { error } = await admin.client
      .from("membership_request_transitions")
      .insert({ from_estado: "aprobado", to_estado: "pendiente_coordinacion", actor: "admin" });
    expect(error).not.toBeNull();
  });
});

describe("ZER-143 creation", () => {
  it("a new request starts in pendiente_coordinacion with a creation history row", async () => {
    const owner = await createUser();
    const requestId = await submitRequest(owner);

    expect(await readEstado(requestId)).toBe("pendiente_coordinacion");
    const events = await readEvents(requestId);
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      from_estado: null,
      to_estado: "pendiente_coordinacion",
      actor_id: owner.id,
    });
    expect(events[0]!.created_at).toBeTruthy();
  });

  it("the applicant cannot choose estado or tier on insert", async () => {
    const owner = await createUser();
    const withEstado = await owner.client
      .from("membership_requests")
      .insert({ profile_id: owner.id, estado: "aprobado" });
    expect(withEstado.error).not.toBeNull();

    const withTier = await owner.client
      .from("membership_requests")
      .insert({ profile_id: owner.id, tier_solicitado: "founder" });
    expect(withTier.error).not.toBeNull();
  });

  it("allows one active request per profile, and a new one after closing", async () => {
    const owner = await createUser();
    const first = await submitRequest(owner);

    const second = await owner.client
      .from("membership_requests")
      .insert({ profile_id: owner.id, mensaje: "dup" });
    expect(second.error?.code).toBe("23505");

    await walk(admin, first, ["cerrada"]);
    await expect(submitRequest(owner)).resolves.toBeTruthy();
  });
});

describe("ZER-143 AC1 — slot unavailable means reprogramacion, not rejection", () => {
  it("admin marks the slot unavailable and the applicant reads reprogramacion", async () => {
    const owner = await createUser();
    const requestId = await submitRequest(owner);

    await walk(admin, requestId, ["entrevista_solicitada", "reprogramacion"]);

    const { data, error } = await owner.client
      .from("membership_requests")
      .select("estado")
      .eq("id", requestId)
      .single();
    expect(error).toBeNull();
    expect(data?.estado).toBe("reprogramacion");
  });
});

describe("ZER-143 AC2 — invalid transitions fail in the server", () => {
  it("the RPC refuses aprobado → entrevista_solicitada", async () => {
    const owner = await createUser();
    const requestId = await submitRequest(owner);
    await walk(admin, requestId, [
      "entrevista_solicitada",
      "entrevista_coordinada",
      "entrevista_realizada",
      "aprobado",
    ]);

    const { data, error } = await transition(admin, requestId, "entrevista_solicitada");
    expect(error).toBeNull();
    expect(data).toMatchObject({ code: "invalid_transition" });
    expect(await readEstado(requestId)).toBe("aprobado");
  });

  it("the RPC refuses approving before the interview (strict machine)", async () => {
    const owner = await createUser();
    const requestId = await submitRequest(owner);

    const { data } = await transition(admin, requestId, "aprobado");
    expect(data).toMatchObject({ code: "invalid_transition" });
    expect(await readEstado(requestId)).toBe("pendiente_coordinacion");

    const { data: profile } = await service
      .from("profiles")
      .select("tier")
      .eq("id", owner.id)
      .single();
    expect(profile?.tier).toBe("tourist");
  });

  it("the trigger refuses an invalid pair even for the service role", async () => {
    const owner = await createUser();
    const requestId = await submitRequest(owner);

    const { error } = await service
      .from("membership_requests")
      .update({ estado: "aprobado" })
      .eq("id", requestId);
    expect(error).not.toBeNull();
    expect(await readEstado(requestId)).toBe("pendiente_coordinacion");
  });

  it("an admin cannot approve their own request; service role still can", async () => {
    const self = await createUser({ admin: true });
    const requestId = await submitRequest(self);
    await walk(self, requestId, [
      "entrevista_solicitada",
      "entrevista_coordinada",
      "entrevista_realizada",
    ]);

    const refused = await transition(self, requestId, "aprobado");
    expect(refused.data).toBeNull();
    expect(refused.error?.hint).toBe("self_approve");
    expect(refused.error?.code).toBe("23514");
    expect(await readEstado(requestId)).toBe("entrevista_realizada");

    const { data: stillTourist } = await service
      .from("profiles")
      .select("tier")
      .eq("id", self.id)
      .single();
    expect(stillTourist?.tier).toBe("tourist");

    const { error: serviceError } = await service
      .from("membership_requests")
      .update({ estado: "aprobado" })
      .eq("id", requestId);
    expect(serviceError).toBeNull();
    expect(await readEstado(requestId)).toBe("aprobado");
  });

  it("approving after the interview grants the standard tier", async () => {
    const owner = await createUser();
    const requestId = await submitRequest(owner);
    await walk(admin, requestId, [
      "entrevista_solicitada",
      "entrevista_coordinada",
      "entrevista_realizada",
      "aprobado",
    ]);

    const { data: profile } = await service
      .from("profiles")
      .select("tier")
      .eq("id", owner.id)
      .single();
    expect(profile?.tier).toBe("standard");
  });

  it("the legacy approve/reject RPCs no longer exist", async () => {
    const owner = await createUser();
    const requestId = await submitRequest(owner);
    const approve = await admin.client.rpc("approve_membership_request", {
      p_request_id: requestId,
    });
    const reject = await admin.client.rpc("reject_membership_request", { p_request_id: requestId });
    expect(approve.error).not.toBeNull();
    expect(reject.error).not.toBeNull();
    expect(await readEstado(requestId)).toBe("pendiente_coordinacion");
  });
});

describe("ZER-143 AC3 — history and applicant permissions", () => {
  it("every change leaves a history row with actor, date, previous and new state", async () => {
    const owner = await createUser();
    const requestId = await submitRequest(owner);
    await walk(admin, requestId, ["entrevista_solicitada"]);
    const { data } = await transition(admin, requestId, "reprogramacion", "Horario no disponible");
    expect(data).toEqual({ success: true, estado: "reprogramacion" });

    const events = await readEvents(requestId);
    expect(events.map((e) => [e.from_estado, e.to_estado, e.actor_id])).toEqual([
      [null, "pendiente_coordinacion", owner.id],
      ["pendiente_coordinacion", "entrevista_solicitada", admin.id],
      ["entrevista_solicitada", "reprogramacion", admin.id],
    ]);
    expect(events[2]!.motivo).toBe("Horario no disponible");
    for (const e of events) expect(e.created_at).toBeTruthy();
  });

  it("the applicant cannot run admin transitions through the RPC", async () => {
    const owner = await createUser();
    const requestId = await submitRequest(owner);

    const { data } = await transition(owner, requestId, "entrevista_solicitada");
    expect(data).toMatchObject({ code: "forbidden" });
    expect(await readEstado(requestId)).toBe("pendiente_coordinacion");
  });

  it("the applicant cannot update estado directly", async () => {
    const owner = await createUser();
    const requestId = await submitRequest(owner);

    await owner.client
      .from("membership_requests")
      .update({ estado: "entrevista_solicitada" })
      .eq("id", requestId);
    expect(await readEstado(requestId)).toBe("pendiente_coordinacion");
  });

  it("not even an admin can update estado directly (RPC is the only path)", async () => {
    const owner = await createUser();
    const requestId = await submitRequest(owner);

    await admin.client
      .from("membership_requests")
      .update({ estado: "entrevista_solicitada" })
      .eq("id", requestId);
    expect(await readEstado(requestId)).toBe("pendiente_coordinacion");
    expect(await readEvents(requestId)).toHaveLength(1);
  });

  it("the applicant cannot read or forge history", async () => {
    const owner = await createUser();
    const requestId = await submitRequest(owner);

    const { data: visible } = await owner.client
      .from("membership_request_events")
      .select("id")
      .eq("request_id", requestId);
    expect(visible ?? []).toEqual([]);

    const forged = await owner.client.from("membership_request_events").insert({
      request_id: requestId,
      from_estado: "entrevista_realizada",
      to_estado: "aprobado",
      actor_id: admin.id,
    });
    expect(forged.error).not.toBeNull();
    expect(await readEvents(requestId)).toHaveLength(1);
  });

  it("history is append-only even for admins", async () => {
    const owner = await createUser();
    const requestId = await submitRequest(owner);

    const { data: rows } = await admin.client
      .from("membership_request_events")
      .select("id")
      .eq("request_id", requestId);
    expect(rows).toHaveLength(1);

    await admin.client
      .from("membership_request_events")
      .update({ motivo: "x" })
      .eq("request_id", requestId);
    await admin.client.from("membership_request_events").delete().eq("request_id", requestId);

    const events = await readEvents(requestId);
    expect(events).toHaveLength(1);
    expect(events[0]!.motivo).toBeNull();
  });

  it("anon can neither read requests nor call the RPC", async () => {
    const owner = await createUser();
    const requestId = await submitRequest(owner);
    const anon = createClient(API_URL, ANON_KEY, NO_SESSION);

    const { data } = await anon.from("membership_requests").select("id").eq("id", requestId);
    expect(data ?? []).toEqual([]);
    const rpc = await anon.rpc("transition_membership_request", {
      p_request_id: requestId,
      p_to: "entrevista_solicitada",
    });
    expect(rpc.error).not.toBeNull();
    expect(await readEstado(requestId)).toBe("pendiente_coordinacion");
  });
});
