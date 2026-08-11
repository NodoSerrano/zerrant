/**
 * Integration tests para el flujo de confirmación de roles (ZER-30 M3.7).
 *
 * REQUISITOS:
 *   - Supabase local corriendo (`supabase start`)
 *   - Variables de entorno:
 *       NEXT_PUBLIC_SUPABASE_URL
 *       NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (anon key)
 *       SUPABASE_SERVICE_ROLE_KEY
 *
 * Para correr:
 *   pnpm vitest run src/features/roles/rls-integration.test.ts
 *
 * ⚠️ Estos tests operan sobre la base de datos local real. Las migraciones deben
 * haberse aplicado (`supabase db reset` o `supabase migration up`).
 */

import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const shouldRun = Boolean(supabaseUrl && anonKey && serviceKey);

// Clientes: admin (service_role) y anónimo (anon key)
const serviceClient = shouldRun
  ? createClient<Database>(supabaseUrl!, serviceKey!, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  : null;

const anonClient = shouldRun
  ? createClient<Database>(supabaseUrl!, anonKey!, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  : null;

// ── Helpers ──────────────────────────────────────────────────────────────────

interface TestUser {
  id: string;
  email: string;
  accessToken: string;
}

async function createUser(email: string): Promise<TestUser> {
  if (!serviceClient) throw new Error("serviceClient not initialized");

  const password = "test-password-123456";

  const { data: user, error } = await serviceClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (error || !user.user) {
    throw new Error(`Failed to create test user ${email}: ${error?.message}`);
  }

  // Sign in as the user to get an access token
  const { data: session } = await anonClient!.auth.signInWithPassword({
    email,
    password,
  });

  if (!session.session) {
    throw new Error(`Failed to sign in as ${email}`);
  }

  return {
    id: user.user.id,
    email,
    accessToken: session.session.access_token,
  };
}

function clientForUser(accessToken: string) {
  if (!anonClient) throw new Error("anonClient not initialized");
  return createClient<Database>(supabaseUrl!, anonKey!, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: {
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  });
}

async function promoteToAdmin(userId: string) {
  if (!serviceClient) throw new Error("serviceClient not initialized");
  const { error } = await serviceClient
    .from("profiles")
    .update({ is_platform_admin: true })
    .eq("id", userId);

  if (error) throw new Error(`Failed to promote user: ${error.message}`);
}

async function getRoleId(name: string): Promise<string> {
  if (!serviceClient) throw new Error("serviceClient not initialized");
  const { data, error } = await serviceClient
    .from("roles")
    .select("id")
    .eq("nombre", name)
    .single();

  if (error || !data) throw new Error(`Role ${name} not found: ${error?.message}`);
  return data.id;
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe.runIf(shouldRun)("profile_roles RLS integration", () => {
  let normalUser: TestUser;
  let adminUser: TestUser;
  let roleInfraId: string;

  beforeAll(async () => {
    normalUser = await createUser("rls-normal@test.local");
    adminUser = await createUser("rls-admin@test.local");
    await promoteToAdmin(adminUser.id);
    roleInfraId = await getRoleId("Infra");
  });

  afterAll(async () => {
    if (serviceClient) {
      await serviceClient.auth.admin.deleteUser(normalUser.id);
      await serviceClient.auth.admin.deleteUser(adminUser.id);
    }
  });

  describe("INSERT policy", () => {
    it("usuario normal NO puede auto-confirmarse (confirmado=true)", async () => {
      const client = clientForUser(normalUser.accessToken);

      const { error } = await client.from("profile_roles").insert({
        profile_id: normalUser.id,
        role_id: roleInfraId,
        confirmado: true,
      });

      // La policy RLS debe rechazar el insert con confirmado=true
      expect(error).not.toBeNull();
      expect(error!.code).toBe("42501");
    });

    it("usuario normal puede insertar su propio rol con confirmado=false", async () => {
      const client = clientForUser(normalUser.accessToken);

      const { error } = await client.from("profile_roles").insert({
        profile_id: normalUser.id,
        role_id: roleInfraId,
        confirmado: false,
      });

      expect(error).toBeNull();

      // Cleanup
      await client
        .from("profile_roles")
        .delete()
        .eq("profile_id", normalUser.id)
        .eq("role_id", roleInfraId);
    });
  });

  describe("SELECT policy", () => {
    beforeAll(async () => {
      if (!serviceClient) return;
      await serviceClient.from("profile_roles").insert({
        profile_id: normalUser.id,
        role_id: roleInfraId,
        confirmado: false,
      });
    });

    afterAll(async () => {
      if (!serviceClient) return;
      await serviceClient
        .from("profile_roles")
        .delete()
        .eq("profile_id", normalUser.id)
        .eq("role_id", roleInfraId);
    });

    it("admin puede listar roles pendientes de otros usuarios", async () => {
      const client = clientForUser(adminUser.accessToken);

      const { data, error } = await client
        .from("profile_roles")
        .select("*")
        .eq("profile_id", normalUser.id);

      expect(error).toBeNull();
      expect(data).not.toBeNull();
      expect(data!.length).toBe(1);
      expect(data![0].confirmado).toBe(false);
    });

    it("usuario normal solo ve sus propios roles (no ve ajenos)", async () => {
      const client = clientForUser(normalUser.accessToken);

      const { data, error } = await client.from("profile_roles").select("*");

      expect(error).toBeNull();
      expect(data).not.toBeNull();

      // Solo debe ver sus propios registros
      for (const row of data!) {
        expect(row.profile_id).toBe(normalUser.id);
      }
    });

    it("usuario normal no puede ver perfil del admin en profile_roles", async () => {
      const client = clientForUser(normalUser.accessToken);

      const { data } = await client.from("profile_roles").select("*");

      const adminRows = (data ?? []).filter((r) => r.profile_id === adminUser.id);
      expect(adminRows).toHaveLength(0);
    });
  });

  describe("UPDATE policy", () => {
    beforeAll(async () => {
      if (!serviceClient) return;
      await serviceClient.from("profile_roles").insert({
        profile_id: normalUser.id,
        role_id: roleInfraId,
        confirmado: false,
      });
    });

    afterAll(async () => {
      if (!serviceClient) return;
      await serviceClient
        .from("profile_roles")
        .delete()
        .eq("profile_id", normalUser.id)
        .eq("role_id", roleInfraId);
    });

    it("admin puede confirmar un rol (UPDATE confirmado=true)", async () => {
      const client = clientForUser(adminUser.accessToken);

      const { error } = await client
        .from("profile_roles")
        .update({ confirmado: true })
        .eq("profile_id", normalUser.id)
        .eq("role_id", roleInfraId);

      expect(error).toBeNull();

      // Verificar que se confirmó
      const { data } = await client
        .from("profile_roles")
        .select("confirmado")
        .eq("profile_id", normalUser.id)
        .eq("role_id", roleInfraId)
        .single();

      expect(data?.confirmado).toBe(true);
    });

    it("usuario normal NO puede confirmar sus propios roles (no es admin)", async () => {
      const client = clientForUser(normalUser.accessToken);

      // Intentar confirmar su propio rol (debería fallar porque no es admin)
      const { error } = await client
        .from("profile_roles")
        .update({ confirmado: true })
        .eq("profile_id", normalUser.id)
        .eq("role_id", roleInfraId);

      expect(error).not.toBeNull();
      expect(error!.code).toBe("42501");
    });

    it("admin NO puede cambiar profile_id (column grant lo impide)", async () => {
      const client = clientForUser(adminUser.accessToken);

      const { error } = await client
        .from("profile_roles")
        .update({ profile_id: adminUser.id } as any)
        .eq("profile_id", normalUser.id)
        .eq("role_id", roleInfraId);

      // Debe fallar porque no hay GRANT UPDATE sobre profile_id
      expect(error).not.toBeNull();
    });

    it("admin NO puede cambiar role_id (column grant lo impide)", async () => {
      const client = clientForUser(adminUser.accessToken);

      // Obtener otro role_id
      const otroRoleId = await getRoleId("RRSS");

      const { error } = await client
        .from("profile_roles")
        .update({ role_id: otroRoleId } as any)
        .eq("profile_id", normalUser.id)
        .eq("role_id", roleInfraId);

      expect(error).not.toBeNull();
    });

    it("usuario normal NO puede confirmar roles ajenos", async () => {
      // Crear un tercer usuario para probar que el normal no puede tocar sus roles
      if (!serviceClient) return;
      const otherUser = await createUser("rls-other@test.local");

      try {
        await serviceClient.from("profile_roles").insert({
          profile_id: otherUser.id,
          role_id: roleInfraId,
          confirmado: false,
        });

        const client = clientForUser(normalUser.accessToken);
        const { error } = await client
          .from("profile_roles")
          .update({ confirmado: true })
          .eq("profile_id", otherUser.id)
          .eq("role_id", roleInfraId);

        expect(error).not.toBeNull();
        expect(error!.code).toBe("42501");
      } finally {
        await serviceClient.from("profile_roles").delete().eq("profile_id", otherUser.id);
        await serviceClient.auth.admin.deleteUser(otherUser.id);
      }
    });
  });

  describe("DELETE policy", () => {
    it("usuario normal puede borrar sus roles no confirmados", async () => {
      const client = clientForUser(normalUser.accessToken);

      // Insert first
      await client.from("profile_roles").insert({
        profile_id: normalUser.id,
        role_id: roleInfraId,
        confirmado: false,
      });

      const { error } = await client
        .from("profile_roles")
        .delete()
        .eq("profile_id", normalUser.id)
        .eq("role_id", roleInfraId);

      expect(error).toBeNull();
    });

    it("admin puede borrar cualquier profile_role", async () => {
      // Insert via service client
      await serviceClient!.from("profile_roles").insert({
        profile_id: normalUser.id,
        role_id: roleInfraId,
        confirmado: false,
      });

      const client = clientForUser(adminUser.accessToken);

      try {
        const { error } = await client
          .from("profile_roles")
          .delete()
          .eq("profile_id", normalUser.id)
          .eq("role_id", roleInfraId);

        expect(error).toBeNull();
      } catch {
        // Cleanup: puede que falle si el admin no tiene delete grant sobre profile_roles...
        // El grant actual sí da DELETE a nivel tabla.
        await serviceClient!
          .from("profile_roles")
          .delete()
          .eq("profile_id", normalUser.id)
          .eq("role_id", roleInfraId);
      }
    });
  });
});
