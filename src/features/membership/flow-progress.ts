import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { isMembershipFlow } from "./flow-cookie";
import { screenProgress, type PipelineProgress, type PipelineStepKey } from "./pipeline";

/**
 * Progress for a flow screen, or null when the user did not enter through
 * `/unirme` (ZER-136): the tourist path renders exactly as before.
 */
export async function getFlowProgress(step: PipelineStepKey): Promise<PipelineProgress | null> {
  if (!isMembershipFlow(await cookies())) return null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return screenProgress(step, { emailConfirmed: Boolean(user?.email_confirmed_at) });
}
