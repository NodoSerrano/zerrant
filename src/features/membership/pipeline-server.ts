import type { createClient } from "@/lib/supabase/server";
import type { OnboardingGateProfile } from "@/features/profile/onboarding-gate";
import { NO_ROWS } from "@/features/profile/onboarding-gate";
import type { UnirmeInput } from "./pipeline";
import { isMembershipRequestEstado } from "./request-state";

type ServerClient = Awaited<ReturnType<typeof createClient>>;

const PROFILE_SELECT = "nombre, apellido, fecha_nacimiento, onboarding_completado_en, tier";

/**
 * Reads what the membership pipeline needs for the signed-in user. Errors fail
 * closed: an unreadable request is reported, never guessed (ZER-136).
 */
export async function loadMembershipPipeline(supabase: ServerClient): Promise<UnirmeInput> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const empty: UnirmeInput = {
    hasSession: false,
    emailConfirmed: false,
    profile: null,
    request: null,
    profileError: false,
    requestError: false,
  };

  if (!user) return empty;

  const signedIn: UnirmeInput = {
    ...empty,
    hasSession: true,
    emailConfirmed: Boolean(user.email_confirmed_at),
  };

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select(PROFILE_SELECT)
    .eq("id", user.id)
    .single();

  if (profileError && profileError.code !== NO_ROWS) {
    console.error("[membership-pipeline] no se pudo leer el perfil", profileError);
    return { ...signedIn, profileError: true };
  }

  const withProfile: UnirmeInput = {
    ...signedIn,
    profile: (profile as OnboardingGateProfile | null) ?? null,
  };

  // Latest request in any state: the active one is always the newest (one
  // active per profile), and a terminal one is what the status page shows.
  const { data: request, error: requestError } = await supabase
    .from("membership_requests")
    .select("estado")
    .eq("profile_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (requestError) {
    console.error("[membership-pipeline] no se pudo leer la solicitud", requestError);
    return { ...withProfile, requestError: true };
  }

  if (request && !isMembershipRequestEstado(request.estado)) {
    console.error("[membership-pipeline] estado de solicitud desconocido", request.estado);
    return { ...withProfile, requestError: true };
  }

  return { ...withProfile, request: request ? { estado: request.estado } : null };
}
