"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { artWallClockToIso, INTERVIEW_SLOT_MINUTES } from "./interview-slots";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type InterviewActionState = { error?: string; success?: string } | null;

export async function bookInterviewSlot(
  _prev: InterviewActionState,
  formData: FormData,
): Promise<InterviewActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "No autorizado" };
  }

  const raw = formData.get("slotId");
  if (typeof raw !== "string" || !UUID_RE.test(raw)) {
    return { error: "Horario inválido" };
  }

  const { data, error } = await supabase.rpc("book_interview_slot", { p_slot_id: raw });
  if (error) {
    return { error: "No pudimos reservar el horario" };
  }
  if (data?.error) {
    return { error: data.error };
  }

  revalidatePath("/profile", "layout");
  revalidatePath("/solicitar/entrevista");
  revalidatePath("/admin/membresias");
  return { success: "Reservaste tu entrevista" };
}

export async function createInterviewSlot(
  _prev: InterviewActionState,
  formData: FormData,
): Promise<InterviewActionState> {
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
    return { error: "Solo un admin puede publicar horarios" };
  }

  const local = formData.get("startsAt");
  const iso = typeof local === "string" ? artWallClockToIso(local) : null;
  if (!iso) {
    return { error: "Elegí día y horario" };
  }

  const { data, error } = await supabase.rpc("create_interview_slot", {
    p_starts_at: iso,
    p_minutes: INTERVIEW_SLOT_MINUTES,
  });
  if (error) {
    return { error: "No pudimos publicar el horario" };
  }
  if (data?.error) {
    return { error: data.error };
  }

  revalidatePath("/admin/membresias");
  revalidatePath("/solicitar/entrevista");
  return { success: "Horario publicado" };
}
