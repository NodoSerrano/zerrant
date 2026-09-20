import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAporte } from "@/features/aportes/actions";
import { NewAporteForm } from "./NewAporteForm";

export const dynamic = "force-dynamic";

const NO_ROWS = "PGRST116";

export default async function NewAportePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("tier, is_platform_admin")
    .eq("id", user.id)
    .single();

  if (error && error.code !== NO_ROWS) {
    console.warn("[aportes/new] no se pudo leer el perfil para la guarda de tier");
  } else if (!profile || profile.tier === "tourist") {
    redirect("/profile");
  }

  return (
    <NewAporteForm action={createAporte} isPlatformAdmin={profile?.is_platform_admin ?? false} />
  );
}
