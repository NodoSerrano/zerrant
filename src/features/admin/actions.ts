"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { estadoLabel, isMembershipRequestEstado } from "@/features/membership/request-state";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function getRequestId(formData: FormData): string | null {
  const raw = formData.get("requestId");
  if (typeof raw !== "string" || !UUID_RE.test(raw)) {
    return null;
  }
  return raw;
}

export type TransitionRequestState = { error?: string; success?: string } | null;

export async function transitionRequest(
  _prevState: TransitionRequestState,
  formData: FormData,
): Promise<TransitionRequestState> {
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
    return { error: "Solo un admin puede gestionar solicitudes" };
  }

  const requestId = getRequestId(formData);
  const to = formData.get("to");
  if (!requestId || !isMembershipRequestEstado(to)) {
    return { error: "Solicitud inválida" };
  }

  const { data, error: rpcError } = await supabase.rpc("transition_membership_request", {
    p_request_id: requestId,
    p_to: to,
  });

  if (rpcError) {
    if (rpcError.message?.includes("propia solicitud")) {
      return { error: "No podés aprobar tu propia solicitud" };
    }
    return { error: "No pudimos actualizar la solicitud" };
  }

  if (data?.error || !data?.estado) {
    return { error: data?.error ?? "No pudimos actualizar la solicitud" };
  }

  revalidatePath("/admin/membresias");
  revalidatePath("/profile", "layout");
  return { success: `Estado actualizado: ${estadoLabel(data.estado)}` };
}
