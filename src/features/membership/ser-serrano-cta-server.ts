import { createClient } from "@/lib/supabase/server";
import { MEMBERSHIP_REQUEST_ACTIVE_ESTADOS } from "./request-state";
import { shouldShowSerSerranoCta } from "./ser-serrano-cta";

/**
 * Server-side gate for the persistent Ser Serrano CTA (ZER-171).
 * Fail closed on infra errors: never invent pending, never show CTA on unknown tier.
 */
export async function resolveSerSerranoCtaVisibility(userId: string): Promise<boolean> {
  const supabase = await createClient();

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("tier")
    .eq("id", userId)
    .maybeSingle();

  if (profileError || !profile) {
    if (profileError) {
      console.error("[ser-serrano-cta] profile read failed", profileError);
    }
    return false;
  }

  if (profile.tier !== "tourist") {
    return false;
  }

  const { data: pendingRequest, error: pendingError } = await supabase
    .from("membership_requests")
    .select("id")
    .eq("profile_id", userId)
    .in("estado", MEMBERSHIP_REQUEST_ACTIVE_ESTADOS)
    .limit(1)
    .maybeSingle();

  if (pendingError) {
    console.error("[ser-serrano-cta] membership_requests read failed", pendingError);
    // Soft-allow CTA when request status is unknown (same spirit as profile shell).
    return shouldShowSerSerranoCta({
      tier: profile.tier,
      hasActiveMembershipRequest: false,
    });
  }

  return shouldShowSerSerranoCta({
    tier: profile.tier,
    hasActiveMembershipRequest: Boolean(pendingRequest),
  });
}
