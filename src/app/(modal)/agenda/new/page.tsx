import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { NewEventForm } from "./NewEventForm";

export const dynamic = "force-dynamic";

const NO_ROWS = "PGRST116";

export default async function NewEventPage() {
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

  // Tourists don't create events. `createEvent` re-checks; RLS is the authority.
  if (error && error.code !== NO_ROWS) {
    console.warn("[agenda/new] no se pudo leer el perfil para la guarda de tier");
  } else if (!profile || profile.tier === "tourist") {
    redirect("/agenda");
  }

  return <NewEventForm />;
}
