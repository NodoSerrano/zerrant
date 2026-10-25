import type { ReactNode } from "react";
import { createClient } from "@/lib/supabase/server";
import { MembersOnlyState } from "@/features/membership/MembersOnlyState";
import { resolveSerSerranoCtaVisibility } from "@/features/membership/ser-serrano-cta-server";

/**
 * Projects and tasks are members-only (ZER-107): RLS hides them from tourists,
 * so a shared link used to land on the 404. Say why instead (ZER-204).
 */
export default async function NodoLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Signed out: the proxy already sends /nodo to the login.
  if (!user) return children;

  const { data: profile } = await supabase
    .from("profiles")
    .select("tier, is_platform_admin")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.tier !== "tourist" || profile.is_platform_admin) return children;

  const canApply = await resolveSerSerranoCtaVisibility(user.id, {
    client: supabase,
    tier: profile.tier,
  });

  return <MembersOnlyState canApply={canApply} />;
}
