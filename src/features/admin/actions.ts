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

  const { data, error: rpcError } = await supabase.rpc(
    "approve_membership_request",
    { p_request_id: requestId },
  );

  if (rpcError) {
    return { error: rpcError.message };
  }

  if (data?.error) {
    return { error: data.error };
  }

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
