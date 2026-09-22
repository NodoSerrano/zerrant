import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SolicitarForm } from "./SolicitarForm";

export const dynamic = "force-dynamic";

const NO_ROWS = "PGRST116";

export default async function SolicitarPage() {
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

  if (error && error.code !== NO_ROWS) {
    console.warn("[solicitar] no se pudo leer el perfil para la guarda de tier");
  } else if (profile && profile.tier !== "tourist") {
    redirect("/nodo/tasks");
  } else if (!profile) {
    redirect("/nodo/tasks");
  }

  return <SolicitarForm />;
}
