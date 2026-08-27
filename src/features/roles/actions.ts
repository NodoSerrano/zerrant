"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function getUuid(formData: FormData, key: string): string | null {
  const raw = formData.get(key);
  if (typeof raw !== "string" || !UUID_RE.test(raw)) {
    return null;
  }
  return raw;
}

export async function confirmProfileRole(_prevState: { error: string } | null, formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "No autorizado" };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_platform_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_platform_admin) {
    return { error: "Solo un admin puede confirmar roles" };
  }

  const profileId = getUuid(formData, "profileId");
  const roleId = getUuid(formData, "roleId");

  if (!profileId || !roleId) {
    return { error: "Solicitud inválida" };
  }

  const { data, error } = await supabase
    .from("profile_roles")
    .update({ confirmado: true })
    .eq("profile_id", profileId)
    .eq("role_id", roleId)
    .eq("confirmado", false)
    .select("id");

  if (error) {
    return { error: "Error al confirmar el rol" };
  }

  if (!data || data.length === 0) {
    return { error: "No pudimos confirmar este rol." };
  }

  revalidatePath("/admin/roles");
  redirect("/admin/roles");
}
