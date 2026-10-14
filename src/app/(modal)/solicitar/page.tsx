import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getFlowProgress } from "@/features/membership/flow-progress";
import { SolicitarForm } from "./SolicitarForm";
import { MEMBERSHIP_STATUS_PATH } from "@/features/membership/pipeline";

export const dynamic = "force-dynamic";

const NO_ROWS = "PGRST116";

export default async function SolicitarPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?next=%2Fsolicitar");
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("tier")
    .eq("id", user.id)
    .single();

  if (error && error.code !== NO_ROWS) {
    console.warn("[solicitar] no se pudo leer el perfil para la guarda de tier");
  } else if (profile && profile.tier !== "tourist") {
    redirect("/nodo/tasks");
  } else if (!profile) {
    redirect("/nodo/tasks");
  }

  // No re-application after cerrada (ZER-136; enabling it is ZER-180). A read
  // error renders the form: createMembershipRequest re-checks and fails closed.
  const { data: closed, error: closedError } = await supabase
    .from("membership_requests")
    .select("id")
    .eq("profile_id", user.id)
    .eq("estado", "cerrada")
    .limit(1)
    .maybeSingle();

  if (closedError) {
    console.error("[solicitar] no se pudo leer si hay una solicitud cerrada", closedError);
  } else if (closed) {
    redirect(MEMBERSHIP_STATUS_PATH);
  }

  const progress = await getFlowProgress("solicitud");

  return <SolicitarForm progress={progress ?? undefined} />;
}
