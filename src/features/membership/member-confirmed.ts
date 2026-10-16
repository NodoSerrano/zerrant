import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

/** How long Inicio and perfil keep the post-conversion confirmation. */
export const MEMBER_CONFIRMED_NOTICE_MS = 7 * 24 * 60 * 60 * 1000;

/** Conversion instant. Not `actualizado_en`: a later row update must not restart the window. */
export const MEMBER_CONFIRMED_COLUMN = "aprobado_en" as const;

/**
 * Lower bound on `aprobado_en`.
 * The caller passes the page clock. This does not mint a second `Date`.
 */
export function memberConfirmedSince(now: Date): string {
  return new Date(now.getTime() - MEMBER_CONFIRMED_NOTICE_MS).toISOString();
}

/** Same query and same injected clock for Inicio and perfil. */
export function recentMemberConfirmation(
  supabase: SupabaseClient<Database>,
  profileId: string,
  now: Date,
) {
  return supabase
    .from("membership_requests")
    .select("id")
    .eq("profile_id", profileId)
    .eq("estado", "aprobado")
    .gte(MEMBER_CONFIRMED_COLUMN, memberConfirmedSince(now))
    .limit(1)
    .maybeSingle();
}
