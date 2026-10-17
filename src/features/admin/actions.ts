"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import {
  estadoLabel,
  isMembershipRequestEstado,
  isMotivoRequired,
  MEMBERSHIP_TRANSITION_MOTIVO_MAX,
  type MembershipRequestEstado,
} from "@/features/membership/request-state";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function getRequestId(formData: FormData): string | null {
  const raw = formData.get("requestId");
  if (typeof raw !== "string" || !UUID_RE.test(raw)) {
    return null;
  }
  return raw;
}

export type TransitionRequestState = { error?: string; success?: string } | null;

function transitionMotivo(
  formData: FormData,
  to: MembershipRequestEstado,
): { motivo: string | null } | { error: string } {
  const raw = formData.get("motivo");
  const motivo = typeof raw === "string" ? raw.trim() : "";
  if (!motivo) {
    return isMotivoRequired(to) ? { error: "Escribí el motivo del cierre" } : { motivo: null };
  }
  if (motivo.length > MEMBERSHIP_TRANSITION_MOTIVO_MAX) {
    return { error: `El motivo puede tener hasta ${MEMBERSHIP_TRANSITION_MOTIVO_MAX} caracteres` };
  }
  return { motivo };
}

function changedByAnotherAdmin(estado: MembershipRequestEstado): TransitionRequestState {
  revalidatePath("/admin/membresias");
  return {
    error: `Otro admin ya cambió esta solicitud a «${estadoLabel(estado)}». Actualizamos la vista para que veas el estado actual.`,
  };
}

async function currentEstado(
  supabase: Awaited<ReturnType<typeof createClient>>,
  requestId: string,
): Promise<MembershipRequestEstado | null> {
  const { data } = await supabase
    .from("membership_requests")
    .select("estado")
    .eq("id", requestId)
    .single();
  return isMembershipRequestEstado(data?.estado) ? data.estado : null;
}

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

  const parsedMotivo = transitionMotivo(formData, to);
  if ("error" in parsedMotivo) return parsedMotivo;

  // The estado the admin was looking at. If another admin moved the request
  // meanwhile, say so instead of applying a decision made on stale data.
  const rawFrom = formData.get("from");
  const from = isMembershipRequestEstado(rawFrom) ? rawFrom : null;
  if (from) {
    const estado = await currentEstado(supabase, requestId);
    if (estado && estado !== from) return changedByAnotherAdmin(estado);
  }

  const { data, error: rpcError } = await supabase.rpc("transition_membership_request", {
    p_request_id: requestId,
    p_to: to,
    ...(parsedMotivo.motivo ? { p_motivo: parsedMotivo.motivo } : {}),
  });

  if (rpcError) {
    // Stable token from the trigger hint. check_violation (23514) is shared
    // with other estado guards, so the code alone is not enough.
    if (rpcError.hint === "self_approve") {
      return { error: "No podés aprobar tu propia solicitud" };
    }
    return { error: "No pudimos actualizar la solicitud" };
  }

  if (data?.error || !data?.estado) {
    // Lost the race between our check and the RPC's row lock.
    if (from && data?.code === "invalid_transition") {
      const estado = await currentEstado(supabase, requestId);
      if (estado && estado !== from) return changedByAnotherAdmin(estado);
    }
    return { error: data?.error ?? "No pudimos actualizar la solicitud" };
  }

  revalidatePath("/admin/membresias");
  revalidatePath("/profile", "layout");
  return { success: `Estado actualizado: ${estadoLabel(data.estado)}` };
}

const NOTE_BODY_MAX = 2000;

function noteBody(formData: FormData): { body: string } | { error: string } {
  const raw = formData.get("body");
  if (typeof raw !== "string") return { error: "La nota no puede estar vacía" };
  const body = raw.trim();
  if (!body) return { error: "La nota no puede estar vacía" };
  if (body.length > NOTE_BODY_MAX) return { error: "La nota es demasiado larga" };
  return { body };
}

function getNoteId(formData: FormData): string | null | "invalid" {
  const raw = formData.get("noteId");
  if (typeof raw !== "string" || raw.length === 0) return null;
  if (!UUID_RE.test(raw)) return "invalid";
  return raw;
}

export type SaveInterviewNoteState = { error?: string; success?: string } | null;

export async function saveInterviewNote(
  _prevState: SaveInterviewNoteState,
  formData: FormData,
): Promise<SaveInterviewNoteState> {
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

  const parsed = noteBody(formData);
  if ("error" in parsed) return parsed;

  const noteId = getNoteId(formData);
  if (noteId === "invalid") return { error: "Nota inválida" };

  let data: { id: string } | null = null;
  let rpcError: { message: string } | null = null;

  if (noteId) {
    const updated = await supabase.rpc("upsert_interview_note", {
      p_note_id: noteId,
      p_body: parsed.body,
    });
    data = updated.data;
    rpcError = updated.error;
  } else {
    const requestId = getRequestId(formData);
    if (!requestId) return { error: "Solicitud inválida" };
    const inserted = await supabase.rpc("upsert_interview_note", {
      p_request_id: requestId,
      p_body: parsed.body,
    });
    data = inserted.data;
    rpcError = inserted.error;
  }

  if (rpcError || !data?.id) {
    return { error: "No pudimos guardar la nota" };
  }

  revalidatePath("/admin/membresias");
  return { success: "Nota guardada" };
}
