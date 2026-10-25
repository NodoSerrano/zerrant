import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createDonacion } from "@/features/donaciones/actions";
import { NewDonacionForm } from "./NewDonacionForm";

export const dynamic = "force-dynamic";

const NO_ROWS = "PGRST116";

export default async function NewDonacionPage() {
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
    console.warn("[donaciones/new] no se pudo leer el perfil");
  } else if (!profile || profile.tier === "tourist") {
    redirect("/profile");
  }

  return <NewDonacionForm action={createDonacion} />;
}
