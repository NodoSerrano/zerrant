import { createClient } from "@/lib/supabase/server";
import { MEMBERSHIP_REQUEST_ACTIVE_ESTADOS } from "./request-state";
import { shouldShowSerSerranoCta } from "./ser-serrano-cta";

type ServerClient = Awaited<ReturnType<typeof createClient>>;

export type ResolveSerSerranoCtaOptions = {
  /** Page client. Omit only when the caller has not opened one yet. */
  client?: ServerClient;
  /**
   * Tier already loaded by the page. Omit to read `profiles`.
   * Null or unknown fails closed and does not query membership requests.
   */
  tier?: string | null;
};

/**
 * Server-side gate for the persistent Ser Serrano CTA (ZER-171).
 * Fail closed on profile errors, unknown tier, and membership_requests read errors.
 * A failed request read must not send a tourist who may already be pending back to /solicitar.
 */
export async function resolveSerSerranoCtaVisibility(
  userId: string,
  options?: ResolveSerSerranoCtaOptions,
): Promise<boolean> {
  const supabase = options?.client ?? (await createClient());
  const tierProvided = options != null && "tier" in options;
  let tier = tierProvided ? options.tier : undefined;

  if (!tierProvided) {
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
    tier = profile.tier;
  }

  if (tier !== "tourist") {
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
    return false;
  }

  return shouldShowSerSerranoCta({
    tier,
    hasActiveMembershipRequest: Boolean(pendingRequest),
  });
}
