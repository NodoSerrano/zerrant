import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { NewTaskForm } from "./NewTaskForm";

export const dynamic = "force-dynamic";

// PostgREST devuelve este código cuando `.single()` no encuentra la fila; el
// resto de los códigos son fallos de verdad y se tratan distinto. Mismo criterio
// que el gate de onboarding en `src/proxy.ts`.
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

  // Los turistas no publican tareas. `createTask` vuelve a chequearlo del lado
  // del server: esto es UX (no mostrar un form inutilizable), aquello es
  // seguridad (un POST directo no pasa por este render).
  if (error && error.code !== NO_ROWS) {
    // La lectura falló (timeout, permisos, 5xx): no sabemos el tier. Rebotar a
    // un serrano legítimo sin explicación es peor que dejarlo entrar, porque el
    // insert igual queda protegido por la guarda de `createTask`.
    console.error("[tasks/new] no se pudo leer el perfil para la guarda de tier", error);
  } else if (!profile || profile.tier === "tourist") {
    redirect("/nodo/tasks");
  }

  return <NewTaskForm />;
}
