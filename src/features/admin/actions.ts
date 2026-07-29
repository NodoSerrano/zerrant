"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function approveRequest(
  _prevState: unknown,
  formData: FormData,
) {
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
    return { error: "Solo un admin puede aprobar solicitudes" };
  }

  const requestId = formData.get("requestId") as string;

  const { error: updateError } = await supabase
    .from("membership_requests")
    .update({
      estado: "aprobada",
      revisado_por: user.id,
      actualizado_en: new Date().toISOString(),
    })
    .eq("id", requestId);

  if (updateError) {
    return { error: updateError.message };
  }

  const { data: request, error: fetchError } = await supabase
    .from("membership_requests")
    .select("profile_id, tier_solicitado")
    .eq("id", requestId)
    .single();

  if (fetchError || !request) {
    return { error: "Solicitud no encontrada" };
  }

  await supabase
    .from("profiles")
    .update({ tier: request.tier_solicitado })
    .eq("id", request.profile_id);

  revalidatePath("/admin/membresias");
  redirect("/admin/membresias");
}

export async function rejectRequest(
  _prevState: unknown,
  formData: FormData,
) {
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
    return { error: "Solo un admin puede rechazar solicitudes" };
  }

  const requestId = formData.get("requestId") as string;

  const { error: updateError } = await supabase
    .from("membership_requests")
    .update({
      estado: "rechazada",
      revisado_por: user.id,
      actualizado_en: new Date().toISOString(),
    })
    .eq("id", requestId);

  if (updateError) {
    return { error: updateError.message };
  }

  revalidatePath("/admin/membresias");
  redirect("/admin/membresias");
}
