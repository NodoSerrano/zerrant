"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function getRequestId(formData: FormData): string | null {
  const raw = formData.get("requestId");
  if (typeof raw !== "string" || !UUID_RE.test(raw)) {
    return null;
  }
  return raw;
}

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

  const requestId = getRequestId(formData);
  if (!requestId) {
    return { error: "Solicitud inválida" };
  }

  const { data, error: rpcError } = await supabase.rpc(
    "approve_membership_request",
    { p_request_id: requestId },
  );

  if (rpcError) {
    return { error: "Error al aprobar la solicitud" };
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

  const requestId = getRequestId(formData);
  if (!requestId) {
    return { error: "Solicitud inválida" };
  }

  const { data, error: rpcError } = await supabase.rpc(
    "reject_membership_request",
    { p_request_id: requestId },
  );

  if (rpcError) {
    return { error: "Error al rechazar la solicitud" };
  }

  if (data?.error) {
    return { error: data.error };
  }

  revalidatePath("/admin/membresias");
  redirect("/admin/membresias");
}
