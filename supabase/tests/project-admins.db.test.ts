import { randomUUID } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterAll, describe, expect, it } from "vitest";

// ZER-199: admins can be turned back into members, but a project always keeps
// at least one approved admin.
// Local stack defaults from `supabase status` (demo keys, not secrets).
const API_URL = process.env.SUPABASE_TEST_URL ?? "http://127.0.0.1:54321";
const ANON_KEY =
  process.env.SUPABASE_TEST_ANON_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";
const SERVICE_KEY =
  process.env.SUPABASE_TEST_SERVICE_ROLE_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";

const PASSWORD = "zer199-test-password";
const NO_SESSION = { auth: { persistSession: false, autoRefreshToken: false } };

const service = createClient(API_URL, SERVICE_KEY, NO_SESSION);
const createdUserIds: string[] = [];
const createdProjectIds: string[] = [];

type TestUser = { id: string; client: SupabaseClient };

async function createUser(): Promise<TestUser> {
  const email = `zer199-${randomUUID()}@test.local`;
  const { data, error } = await service.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
  });
  if (error || !data.user) throw error ?? new Error("createUser returned no user");
  createdUserIds.push(data.user.id);

  const { error: profileError } = await service
    .from("profiles")
    .update({ tier: "standard" })
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

/** An open project created by `owner` (who becomes its admin) that `member` joined. */
async function projectWithMember(owner: TestUser, member: TestUser): Promise<string> {
  const { data, error } = await owner.client
    .from("projects")
    .insert({
      nombre: `ZER-199 ${randomUUID().slice(0, 8)}`,
      estado: "en_curso",
      ingreso: "abierto",
      creado_por: owner.id,
    })
    .select("id")
    .single();
  if (error || !data) throw error ?? new Error("project insert returned nothing");
  createdProjectIds.push(data.id);

  const { error: joinError } = await member.client
    .from("project_members")
    .insert({ project_id: data.id, profile_id: member.id, estado: "aprobado" });
  if (joinError) throw joinError;
  return data.id;
}

function setRol(user: TestUser, projectId: string, profileId: string, rol: "admin" | "miembro") {
  return user.client
    .from("project_members")
    .update({ rol })
    .eq("project_id", projectId)
    .eq("profile_id", profileId)
    .select("rol");
}

async function rolOf(projectId: string, profileId: string) {
  const { data } = await service
    .from("project_members")
    .select("rol")
    .eq("project_id", projectId)
    .eq("profile_id", profileId)
    .maybeSingle();
  return data?.rol;
}

afterAll(async () => {
  if (createdProjectIds.length) {
    await service.from("projects").delete().in("id", createdProjectIds);
  }
  for (const id of createdUserIds) await service.auth.admin.deleteUser(id);
});

describe("project admins (ZER-199)", () => {
  it("an admin turns another admin back into a member", async () => {
    const owner = await createUser();
    const member = await createUser();
    const projectId = await projectWithMember(owner, member);
    await setRol(owner, projectId, member.id, "admin");

    const { error, data } = await setRol(owner, projectId, member.id, "miembro");

    expect(error).toBeNull();
    expect(data).toEqual([{ rol: "miembro" }]);
    expect(await rolOf(projectId, member.id)).toBe("miembro");
  });

  it("an admin can step down while another admin remains", async () => {
    const owner = await createUser();
    const member = await createUser();
    const projectId = await projectWithMember(owner, member);
    await setRol(owner, projectId, member.id, "admin");

    const { error } = await setRol(owner, projectId, owner.id, "miembro");

    expect(error).toBeNull();
    expect(await rolOf(projectId, owner.id)).toBe("miembro");
  });

  it("refuses to leave the project without an admin", async () => {
    const owner = await createUser();
    const member = await createUser();
    const projectId = await projectWithMember(owner, member);

    const { error } = await setRol(owner, projectId, owner.id, "miembro");

    expect(error?.message).toBe("last_project_admin");
    expect(await rolOf(projectId, owner.id)).toBe("admin");
  });

  it("refuses to delete the last admin's membership", async () => {
    const owner = await createUser();
    const member = await createUser();
    const projectId = await projectWithMember(owner, member);

    const { error } = await service
      .from("project_members")
      .delete()
      .eq("project_id", projectId)
      .eq("profile_id", owner.id);

    expect(error?.message).toBe("last_project_admin");
    expect(await rolOf(projectId, owner.id)).toBe("admin");
  });

  it("a plain member cannot demote an admin", async () => {
    const owner = await createUser();
    const member = await createUser();
    const third = await createUser();
    const projectId = await projectWithMember(owner, member);
    await third.client
      .from("project_members")
      .insert({ project_id: projectId, profile_id: third.id, estado: "aprobado" });
    await setRol(owner, projectId, member.id, "admin");

    const { data } = await setRol(third, projectId, member.id, "miembro");

    expect(data).toEqual([]);
    expect(await rolOf(projectId, member.id)).toBe("admin");
  });

  it("deleting the whole project still works", async () => {
    const owner = await createUser();
    const member = await createUser();
    const projectId = await projectWithMember(owner, member);

    const { error } = await service.from("projects").delete().eq("id", projectId);

    expect(error).toBeNull();
    expect(await rolOf(projectId, owner.id)).toBeUndefined();
  });
});
