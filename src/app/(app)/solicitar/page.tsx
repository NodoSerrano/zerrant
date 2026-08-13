import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SolicitarForm } from "./SolicitarForm";

export const dynamic = "force-dynamic";

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

  if (profile?.tier !== "tourist") {
    if (error) {
      console.warn("[solicitar] no se pudo leer el perfil para la guarda de tier", error);
    }
    redirect("/nodo/tasks");
  }

  return <SolicitarForm />;
}
