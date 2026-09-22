import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EnviadoConfirmation } from "./EnviadoConfirmation";

export const dynamic = "force-dynamic";

export default async function EnviadoPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("tier")
    .eq("id", user.id)
    .single();

  if (profileError || profile?.tier !== "tourist") {
    redirect("/profile");
  }

  const { data: pending, error: pendingError } = await supabase
    .from("membership_requests")
    .select("id")
    .eq("profile_id", user.id)
    .eq("estado", "pendiente")
    .maybeSingle();

  if (pendingError || !pending) {
    redirect("/profile");
  }

  return <EnviadoConfirmation />;
}
