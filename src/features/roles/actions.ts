"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

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

  const profileId = formData.get("profileId") as string;
  const roleId = formData.get("roleId") as string;

  const { error } = await supabase
    .from("profile_roles")
    .update({ confirmado: true })
    .eq("profile_id", profileId)
    .eq("role_id", roleId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin", "layout");
  redirect("/admin/roles");
}
