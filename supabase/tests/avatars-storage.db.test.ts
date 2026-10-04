import { randomUUID } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

// Local stack defaults from `supabase status` (demo keys, not secrets).
const API_URL = process.env.SUPABASE_TEST_URL ?? "http://127.0.0.1:54321";
const ANON_KEY =
  process.env.SUPABASE_TEST_ANON_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";
const SERVICE_KEY =
  process.env.SUPABASE_TEST_SERVICE_ROLE_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";

const BUCKET = "avatars";
const PASSWORD = "zer138-test-password";
const NO_SESSION = { auth: { persistSession: false, autoRefreshToken: false } };
const JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0]);

const service = createClient(API_URL, SERVICE_KEY, NO_SESSION);
const anon = createClient(API_URL, ANON_KEY, NO_SESSION);
const createdUserIds: string[] = [];

type TestUser = { id: string; client: SupabaseClient };

async function createUser(): Promise<TestUser> {
  const email = `zer138-${randomUUID()}@test.local`;
  const { data, error } = await service.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
  });
  if (error || !data.user) throw error ?? new Error("createUser returned no user");
  createdUserIds.push(data.user.id);

  const client = createClient(API_URL, ANON_KEY, NO_SESSION);
  const { error: signInError } = await client.auth.signInWithPassword({
    email,
    password: PASSWORD,
  });
  if (signInError) throw signInError;
  return { id: data.user.id, client };
}

async function uploadAs(user: TestUser, folder = user.id) {
  const path = `${folder}/${randomUUID()}.jpg`;
  const { error } = await user.client.storage
    .from(BUCKET)
    .upload(path, JPEG, { contentType: "image/jpeg", upsert: false });
  return { path, error };
}

let owner: TestUser;
let other: TestUser;
let ownerPath: string;

beforeAll(async () => {
  owner = await createUser();
  other = await createUser();
  const uploaded = await uploadAs(owner);
  if (uploaded.error) throw uploaded.error;
  ownerPath = uploaded.path;
});

afterAll(async () => {
  for (const id of createdUserIds) {
    const { data } = await service.storage.from(BUCKET).list(id);
    if (data?.length) {
      await service.storage.from(BUCKET).remove(data.map((o) => `${id}/${o.name}`));
    }
    await service.auth.admin.deleteUser(id);
  }
});

describe("avatars bucket policies", () => {
  it("serves an avatar through its public url without a session", async () => {
    const { data } = anon.storage.from(BUCKET).getPublicUrl(ownerPath);
    const response = await fetch(data.publicUrl);
    expect(response.status).toBe(200);
  });

  it("does not let an anonymous client list the bucket root", async () => {
    const { data } = await anon.storage.from(BUCKET).list();
    expect(data ?? []).toEqual([]);
  });

  it("does not let an anonymous client list someone's folder", async () => {
    const { data } = await anon.storage.from(BUCKET).list(owner.id);
    expect(data ?? []).toEqual([]);
  });

  it("does not let another user list the bucket root or the owner's folder", async () => {
    const root = await other.client.storage.from(BUCKET).list();
    const folder = await other.client.storage.from(BUCKET).list(owner.id);
    expect(root.data ?? []).toEqual([]);
    expect(folder.data ?? []).toEqual([]);
  });

  it("lets the owner list their own folder", async () => {
    const { data, error } = await owner.client.storage.from(BUCKET).list(owner.id);
    expect(error).toBeNull();
    expect(data?.map((o) => `${owner.id}/${o.name}`)).toContain(ownerPath);
  });

  it("does not let a user upload into another user's folder", async () => {
    const { error } = await uploadAs(other, owner.id);
    expect(error).not.toBeNull();
  });

  it("does not let a user delete another user's avatar", async () => {
    await other.client.storage.from(BUCKET).remove([ownerPath]);
    const { data } = await service.storage.from(BUCKET).list(owner.id);
    expect(data?.map((o) => `${owner.id}/${o.name}`)).toContain(ownerPath);
  });

  it("lets the owner delete their own avatar", async () => {
    const extra = await uploadAs(owner);
    expect(extra.error).toBeNull();

    const { data, error } = await owner.client.storage.from(BUCKET).remove([extra.path]);

    expect(error).toBeNull();
    expect(data?.map((o) => o.name)).toContain(extra.path);
  });
});
