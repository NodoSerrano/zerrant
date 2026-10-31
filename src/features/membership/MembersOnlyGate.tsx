import type { ReactNode } from "react";
import { createClient } from "@/lib/supabase/server";
import { MembersOnlyState } from "@/features/membership/MembersOnlyState";
import { resolveSerSerranoCtaVisibility } from "@/features/membership/ser-serrano-cta-server";
import { hasMemberAccess } from "@/features/membership/member-access";
import { getOnboardingGateProfile } from "@/features/profile/onboarding-gate-server";

/**
 * Projects and tasks are members-only (ZER-107): RLS hides them from tourists,
 * so a shared link used to land on the 404. Say why instead (ZER-204).
 * Shared by both /nodo layouts: lists under (app), detail and forms under (modal) (ZER-206).
 * Reads the same cached profile as the (app) layout's Actividad tab, with the same rule.
 */
export async function MembersOnlyGate({ children }: { children: ReactNode }) {
  const access = await getOnboardingGateProfile();

  // Signed out: the proxy already sends /nodo to the login.
  if (!access.userId || hasMemberAccess(access)) return children;

  const supabase = await createClient();
  const canApply = await resolveSerSerranoCtaVisibility(access.userId, {
    client: supabase,
    tier: access.profile?.tier ?? "tourist",
  });

  return <MembersOnlyState canApply={canApply} />;
}
