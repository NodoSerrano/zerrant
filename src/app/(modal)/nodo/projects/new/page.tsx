import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isTasksBlockedTier } from "@/features/tasks/tier-guards";
import { NewProjectForm } from "./NewProjectForm";

export const dynamic = "force-dynamic";

const NO_ROWS = "PGRST116";

export default async function NewProjectPage() {
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

  // Tourists don't create projects. `createProject` + RLS re-check: this is UX.
  if (error && error.code !== NO_ROWS) {
    console.warn("[projects/new] no se pudo leer el perfil para la guarda de tier");
  } else if (!profile || isTasksBlockedTier(profile.tier)) {
    redirect("/nodo/projects");
  }

  return <NewProjectForm />;
}
