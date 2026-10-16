import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { loadMembershipPipeline } from "@/features/membership/pipeline-server";
import { resolveUnirmeTarget } from "@/features/membership/pipeline";

export const dynamic = "force-dynamic";

/**
 * "Quiero ser Serrano" deep link (ZER-136): sends whoever opens it to their
 * next pipeline step and never renders. A page, not a route handler, so a
 * server action that redirects here (login/signup with next=/unirme) ends on
 * the real destination URL instead of leaving the browser on /unirme, where
 * the next form would POST and get a 405 (bug-375). The flow cookie is set in
 * the proxy, because a page cannot write cookies.
 */
export default async function UnirmePage(): Promise<never> {
  const input = await loadMembershipPipeline(await createClient());
  redirect(resolveUnirmeTarget(input));
}
