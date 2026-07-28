import Link from "next/link";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { relativeTime } from "@/lib/time";
import { TaskCard } from "@/components/TaskCard";
import { EmptyState } from "@/components/EmptyState";
import { cn } from "@/lib/utils";
import type { TaskEstado } from "@/features/tasks/types";

const ESTADO_LABELS: Record<string, string> = {
  abierta: "Abierta",
  tomada: "Tomada",
  hecha: "Hecha",
  verificada: "Verificada",
};

const ESTADO_MAP: Record<string, "abierta" | "tomada" | "hecha"> = {
  abierta: "abierta",
  tomada: "tomada",
  hecha: "hecha",
  // TaskCard solo tiene 3 estados. Las tareas verificadas se muestran como
  // "Hecha" visualmente; el filtro de URL sí las aísla. Cuando Pencil defina
  // un diseño para "verificada", agregarlo al componente.
  verificada: "hecha",
};

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string }>;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return <p className="text-text-secondary p-5">Iniciá sesión para ver las tareas.</p>;

  const { estado } = await searchParams;

  let query = supabase
    .from("tasks")
    .select("*, profiles:creado_por(nombre, apellido, apodo, nombre_visible)")
    .order("created_at", { ascending: false });

  if (estado && estado !== "todas") {
    query = query.eq("estado", estado as TaskEstado);
  }

  const { data: tasks } = await query;

  const { data: profile } = await supabase
    .from("profiles")
    .select("tier")
    .eq("id", user.id)
    .single();
  const canCreate = profile && profile.tier !== "tourist";

  const filtros = ["todas", "abierta", "tomada", "hecha", "verificada"];

  return (
    <div className="flex flex-col gap-5 relative">
      <h1 className="font-display text-2xl font-bold text-text-primary">Nodo</h1>

      <div className="flex rounded-pill bg-surface p-0.5 border border-border">
        <span className="flex-1 text-center py-2 font-display text-sm font-semibold bg-primary text-on-primary rounded-pill">
          Tareas
        </span>
        <span className="flex-1 text-center py-2 font-display text-sm font-medium text-text-muted cursor-default">
          Proyectos
        </span>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {filtros.map((f) => (
          <Link
            key={f}
            href={f === "todas" ? "/nodo/tasks" : `/nodo/tasks?estado=${f}`}
            className={cn(
              "inline-flex items-center rounded-pill px-3 py-1.5 text-xs font-semibold font-display whitespace-nowrap transition-colors",
              (f === "todas" && !estado) || estado === f
                ? "bg-primary text-on-primary"
                : "bg-surface border border-border text-text-secondary hover:text-text-primary",
            )}
          >
            {f === "todas" ? "Todas" : ESTADO_LABELS[f]}
          </Link>
        ))}
      </div>

      {!tasks || tasks.length === 0 ? (
        <EmptyState
          href={canCreate ? "/nodo/tasks/new" : undefined}
          subtitle={
            canCreate
              ? "Parece que todavia no hay tareas publicadas. Queres crear la primera?"
              : "Parece que todavia no hay tareas publicadas."
          }
        />
      ) : (
        <div className="flex flex-col gap-3">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              href={`/nodo/tasks/${task.id}`}
              title={task.titulo}
              category={task.categoria}
              timeAgo={relativeTime(task.created_at)}
              estado={ESTADO_MAP[task.estado ?? "abierta"]}
              urgencia={task.urgencia ?? "media"}
              actionLabel="Tomar"
            />
          ))}
        </div>
      )}

      {canCreate && (
        <Link
          href="/nodo/tasks/new"
          className={cn(
            "fixed bottom-24 right-5 z-40",
            "size-14 rounded-full",
            "bg-linear-to-br from-brand-green to-brand-blue",
            "shadow-[0_4px_14px_rgba(26,22,20,0.25)]",
            "flex items-center justify-center",
            "active:scale-95 hover:brightness-110 transition-all",
          )}
          aria-label="Crear tarea"
        >
          <Plus className="size-6 text-on-primary" strokeWidth={2.5} />
        </Link>
      )}
    </div>
  );
}
