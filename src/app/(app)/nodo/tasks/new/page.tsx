import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { NewTaskForm } from "./NewTaskForm";

export const dynamic = "force-dynamic";

// PostgREST returns this code when `.single()` finds no row; all other codes
// are real failures and are handled differently. Same criterion as the
// onboarding gate in `src/proxy.ts`.
const NO_ROWS = "PGRST116";

export default async function NewTaskPage() {
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

  // Tourists don't publish tasks. `createTask` re-checks it server-side:
  // this is UX (don't show an unusable form), that is security (a direct
  // POST doesn't go through this render).
  if (error && error.code !== NO_ROWS) {
    // The read failed (timeout, permissions, 5xx): we don't know the tier.
    // Bouncing a legitimate serrano without explanation is worse than letting
    // them in, because the insert is still protected by the `createTask` guard.
    console.warn("[tasks/new] no se pudo leer el perfil para la guarda de tier");
  } else if (!profile || profile.tier === "tourist") {
    redirect("/nodo/tasks");
  }

  return <NewTaskForm />;
}
