import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { MisAportesScreen } from "./MisAportesScreen";

export const dynamic = "force-dynamic";

const SERRANO_TIERS = new Set(["scholar", "standard", "founder"]);

export default async function AportesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("tier")
    .eq("id", user.id)
    .single();

  if (error || !profile || !SERRANO_TIERS.has(profile.tier)) {
    redirect("/profile");
  }

  // M6 owns the aportes table. Until then: chrome + empty stats only.
  return <MisAportesScreen total={0} thisMonth={0} />;
}
