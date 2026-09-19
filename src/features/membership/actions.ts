"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const DB_ERROR = "No pudimos enviar tu solicitud. Probá de nuevo.";
const NOT_TOURIST = "Solo los tourists pueden solicitar membresía.";
const ALREADY_PENDING = "Ya tenes una solicitud pendiente.";
const NO_ROWS = "PGRST116";
/** Partial unique index membership_requests_one_pending_per_profile. */
const UNIQUE_VIOLATION = "23505";

function messageFromForm(formData: FormData): string | null {
  const value = formData.get("mensaje");
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export async function createMembershipRequest(
  _prevState: { error: string } | null,
  formData: FormData,
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "No autorizado" };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("tier")
    .eq("id", user.id)
    .single();

  if (profileError && profileError.code !== NO_ROWS) {
    // Without this the user only ever sees DB_ERROR and the cause is
    // unrecoverable from logs -- that is how ZER-65 stayed invisible.
    console.error("[createMembershipRequest] profile read failed", profileError);
    return { error: DB_ERROR };
  }

  if (!profile || profile.tier !== "tourist") {
    return { error: NOT_TOURIST };
  }

  const { data: existing } = await supabase
    .from("membership_requests")
    .select("id")
    .eq("profile_id", user.id)
    .eq("estado", "pendiente")
    .maybeSingle();

  if (existing) {
    return { error: ALREADY_PENDING };
  }

  const { error } = await supabase.from("membership_requests").insert({
    profile_id: user.id,
    mensaje: messageFromForm(formData),
  });

  if (error) {
    console.error("[createMembershipRequest] insert failed", error);
    // The maybeSingle pre-check above and the insert are two statements: a
    // concurrent submit can land between them. The partial unique index is what
    // actually enforces one-pending-per-profile, so its violation is the pending
    // case, not an unknown failure.
    if (error.code === UNIQUE_VIOLATION) {
      return { error: ALREADY_PENDING };
    }
    return { error: DB_ERROR };
  }

  revalidatePath("/profile", "layout");
  redirect("/solicitar/enviado");
}
