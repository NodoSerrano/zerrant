import { randomUUID } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterAll, describe, expect, it } from "vitest";

// ZER-163: skill proposals (admin-approved). ZER-216: a member skill is only its name.
// Local stack defaults from `supabase status` (demo keys, not secrets).
const API_URL = process.env.SUPABASE_TEST_URL ?? "http://127.0.0.1:54321";
const ANON_KEY =
  process.env.SUPABASE_TEST_ANON_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";
const SERVICE_KEY =
  process.env.SUPABASE_TEST_SERVICE_ROLE_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";

const PASSWORD = "zer163-test-password";
const NO_SESSION = { auth: { persistSession: false, autoRefreshToken: false } };

const service = createClient(API_URL, SERVICE_KEY, NO_SESSION);
const createdUserIds: string[] = [];
const createdSkillIds: string[] = [];

type TestUser = { id: string; client: SupabaseClient };

async function createUser(opts: { admin?: boolean; tier?: string } = {}): Promise<TestUser> {
  const email = `zer163-${randomUUID()}@test.local`;
  const { data, error } = await service.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
  });
  if (error || !data.user) throw error ?? new Error("createUser returned no user");
  createdUserIds.push(data.user.id);

  const { error: profileError } = await service
    .from("profiles")
    .update({ tier: opts.tier ?? "standard", is_platform_admin: opts.admin ?? false })
    .eq("id", data.user.id);
  if (profileError) throw profileError;

  const client = createClient(API_URL, ANON_KEY, NO_SESSION);
  const { error: signInError } = await client.auth.signInWithPassword({
    email,
    password: PASSWORD,
  });
  if (signInError) throw signInError;
  return { id: data.user.id, client };
}

const unique = (base: string) => `${base} ${randomUUID().slice(0, 8)}`;

async function propose(user: TestUser, nombre: string) {
  const { data, error } = await user.client.rpc("propose_skill", { p_nombre: nombre });
  if (error) throw error;
  if (data?.id) createdSkillIds.push(data.id as string);
  return data as {
    id?: string;
    estado?: string;
    existing?: boolean;
    error?: string;
    code?: string;
  };
}

async function skillRow(id: string) {
  const { data } = await service
    .from("skills")
    .select("id, nombre, estado")
    .eq("id", id)
    .maybeSingle();
  return data;
}

afterAll(async () => {
  if (createdSkillIds.length) await service.from("skills").delete().in("id", createdSkillIds);
  for (const id of createdUserIds) await service.auth.admin.deleteUser(id);
});

describe("skill proposals (ZER-163)", () => {
  it("a member proposes a skill that stays pending and out of the shared catalog", async () => {
    const member = await createUser();
    const other = await createUser();
    const nombre = unique("Cerámica");

    const result = await propose(member, nombre);
    expect(result).toMatchObject({ estado: "pendiente", existing: false });

    const { data: own } = await member.client.from("skills").select("id").eq("id", result.id!);
    expect(own).toHaveLength(1);
    const { data: hidden } = await other.client.from("skills").select("id").eq("id", result.id!);
    expect(hidden).toHaveLength(0);
  });

  it("reuses an existing skill regardless of case and spaces instead of duplicating it", async () => {
    const member = await createUser();
    const result = await propose(member, "  diseño  ");
    expect(result).toMatchObject({ existing: true, estado: "aprobada" });

    const { count } = await service
      .from("skills")
      .select("id", { count: "exact", head: true })
      .ilike("nombre", "diseño");
    expect(count).toBe(1);
  });

  it("rejects empty or too long names and tourists", async () => {
    const member = await createUser();
    expect(await propose(member, "   ")).toMatchObject({ code: "invalid_nombre" });
    expect(await propose(member, "x".repeat(41))).toMatchObject({ code: "invalid_nombre" });

    const tourist = await createUser({ tier: "tourist" });
    expect(await propose(tourist, unique("Telar"))).toMatchObject({ code: "forbidden" });
  });

  it("the uniqueness rule also holds for direct inserts", async () => {
    const { error } = await service.from("skills").insert({ nombre: "  SOLIDITY " });
    expect(error?.code).toBe("23505");
  });

  it("only an admin approves; approving adds it to the proposer's profile", async () => {
    const member = await createUser();
    const admin = await createUser({ admin: true });
    const { id } = await propose(member, unique("Serigrafía"));

    const denied = await member.client.rpc("review_skill", { p_skill_id: id, p_aprobar: true });
    expect(denied.data).toMatchObject({ code: "forbidden" });
    expect((await skillRow(id!))?.estado).toBe("pendiente");

    const approved = await admin.client.rpc("review_skill", { p_skill_id: id, p_aprobar: true });
    expect(approved.error).toBeNull();
    expect((await skillRow(id!))?.estado).toBe("aprobada");

    const { data: link } = await service
      .from("profile_skills")
      .select("skill_id")
      .eq("profile_id", member.id)
      .eq("skill_id", id!);
    expect(link).toHaveLength(1);
  });

  it("rejecting removes the proposal", async () => {
    const member = await createUser();
    const admin = await createUser({ admin: true });
    const { id } = await propose(member, unique("Malabares"));

    await admin.client.rpc("review_skill", { p_skill_id: id, p_aprobar: false });
    expect(await skillRow(id!)).toBeNull();
  });

  it("a pending skill cannot be attached to a profile, not even with a direct insert", async () => {
    const member = await createUser();
    const { id } = await propose(member, unique("Origami"));

    const { error } = await member.client
      .from("profile_skills")
      .insert({ profile_id: member.id, skill_id: id });
    expect(error).not.toBeNull();
  });
});

describe("save_profile_skills by skill id only (ZER-216)", () => {
  async function approvedId(nombre: string) {
    const { data } = await service.from("skills").select("id").eq("nombre", nombre).single();
    return data!.id as string;
  }

  it("replaces the caller's set of skills", async () => {
    const member = await createUser();
    const ia = await approvedId("IA");
    const diseno = await approvedId("Diseño");

    const first = await member.client.rpc("save_profile_skills", { p_skill_ids: [ia, diseno] });
    expect(first.error).toBeNull();
    expect(first.data).toMatchObject({ success: true });

    const second = await member.client.rpc("save_profile_skills", { p_skill_ids: [ia] });
    expect(second.data).toMatchObject({ success: true });

    const { data: rows } = await service
      .from("profile_skills")
      .select("skill_id")
      .eq("profile_id", member.id);
    expect(rows).toEqual([{ skill_id: ia }]);
  });

  it("level and years are gone from member skills", async () => {
    const { error } = await service.from("profile_skills").select("nivel").limit(1);
    expect(error?.code).toBe("42703");
  });

  it("ignores pending skills, and tourists cannot save", async () => {
    const member = await createUser();
    const { id: pending } = await propose(member, unique("Bordado"));
    await member.client.rpc("save_profile_skills", { p_skill_ids: [pending] });
    const { data: rows } = await service
      .from("profile_skills")
      .select("id")
      .eq("profile_id", member.id);
    expect(rows).toHaveLength(0);

    const tourist = await createUser({ tier: "tourist" });
    const { data } = await tourist.client.rpc("save_profile_skills", { p_skill_ids: [] });
    expect(data).toMatchObject({ code: "forbidden" });
  });
});
