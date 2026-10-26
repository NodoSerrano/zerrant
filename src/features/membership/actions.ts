"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { parseMembershipScreening } from "./screening";
import { MEMBERSHIP_REQUEST_ACTIVE_ESTADOS } from "./request-state";
import { formatReapplyDate, reapplyStatus } from "./reapply";

const DB_ERROR = "No pudimos enviar tu solicitud. Probá de nuevo.";
const NOT_TOURIST = "Solo los tourists pueden solicitar membresía.";
const ALREADY_ACTIVE = "Ya tenés una solicitud en curso.";
/** The DB reapply gate refused it (ZER-180): the app check below normally says when. */
const REAPPLY_LOCKED =
  "Tu solicitud anterior se cerró hace poco. Todavía no podés enviar una nueva.";
const NO_ROWS = "PGRST116";
/** Partial unique index membership_requests_one_active_per_profile. */
const UNIQUE_VIOLATION = "23505";
/** membership_requests_reapply_gate (ZER-180). */
const REAPPLY_DENIED = "42501";

function reapplyLockedUntil(availableFrom: string | null): string {
  return availableFrom
    ? `Tu solicitud anterior se cerró. Podés enviar una nueva desde el ${formatReapplyDate(availableFrom)}.`
    : REAPPLY_LOCKED;
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

  const { data: existing, error: existingError } = await supabase
    .from("membership_requests")
    .select("estado")
    .eq("profile_id", user.id)
    .in("estado", [...MEMBERSHIP_REQUEST_ACTIVE_ESTADOS])
    .limit(1)
    .maybeSingle();

  if (existingError) {
    console.error("[createMembershipRequest] existing request read failed", existingError);
    return { error: DB_ERROR };
  }

  if (existing) {
    return { error: ALREADY_ACTIVE };
  }

  // After a cerrada request: 30 days, or earlier if an admin enabled it (ZER-180).
  // The DB gate enforces it too; this read is what lets us say from when.
  const { data: closed, error: closedError } = await supabase
    .from("membership_requests")
    .select("cerrada_en, reapertura_habilitada_en")
    .eq("profile_id", user.id)
    .eq("estado", "cerrada")
    .order("cerrada_en", { ascending: false, nullsFirst: true })
    .limit(1)
    .maybeSingle();

  if (closedError) {
    // Fail closed, like the DB gate.
    console.error("[createMembershipRequest] closed request read failed", closedError);
    return { error: DB_ERROR };
  }

  const reapply = reapplyStatus(
    closed
      ? { cerradaEn: closed.cerrada_en, reaperturaHabilitadaEn: closed.reapertura_habilitada_en }
      : null,
  );
  if (!reapply.allowed) {
    return { error: reapplyLockedUntil(reapply.availableFrom) };
  }

  const screening = parseMembershipScreening(formData);
  if (!screening.ok) {
    return { error: screening.error };
  }

  const { error } = await supabase.from("membership_requests").insert({
    profile_id: user.id,
    ...screening.data,
  });

  if (error) {
    console.error("[createMembershipRequest] insert failed", error);
    // The maybeSingle pre-check above and the insert are two statements: a
    // concurrent submit can land between them. The partial unique index is what
    // actually enforces one-active-request-per-profile, so its violation is the
    // already-in-progress case, not an unknown failure.
    if (error.code === UNIQUE_VIOLATION) {
      return { error: ALREADY_ACTIVE };
    }
    if (error.code === REAPPLY_DENIED) {
      return { error: REAPPLY_LOCKED };
    }
    return { error: DB_ERROR };
  }

  revalidatePath("/profile", "layout");
  redirect("/solicitar/enviado");
}
