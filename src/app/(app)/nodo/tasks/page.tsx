import Link from "next/link";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { relativeTime } from "@/lib/time";
import { TaskCard } from "@/components/TaskCard";
import { EmptyState } from "@/components/EmptyState";
import { cn } from "@/lib/utils";
import { ESTADO_BADGE, getCategoriaLabel } from "@/features/tasks/taskDisplay";
import type { TaskEstado } from "@/features/tasks/types";

// The pill labels come from the same place as the chip labels, so a state
// can't be renamed on one screen and not the other.
const ESTADO_LABELS: Record<string, string> = Object.fromEntries(
  Object.entries(ESTADO_BADGE).map(([estado, badge]) => [estado, badge.label]),
);

type CardEstado = "abierta" | "tomada" | "hecha" | "cancelada";

// `Record<TaskEstado, ...>` instead of `Record<string, ...>`: if the Postgres
// enum gains a value tomorrow, this stops compiling and forces a decision on
// how to render it. With `string` the new value passed silently and reached
// TaskCard as `undefined`.
const ESTADO_MAP: Record<NonNullable<TaskEstado>, CardEstado> = {
  abierta: "abierta",
  tomada: "tomada",
  hecha: "hecha",
  // TaskCard only has 3 states. Verified tasks render visually as
  // "Hecha"; the URL filter does isolate them. When Pencil defines a
  // design for "verificada", add it to the component.
  verificada: "hecha",
  cancelada: "cancelada",
};

// Type checking covers the code; this covers the data. A row written by an
// older migration, or by another client, can carry a state this build
// doesn't know.
function toCardEstado(estado: TaskEstado | null): CardEstado {
  return ESTADO_MAP[estado as NonNullable<TaskEstado>] ?? "abierta";
}

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

  const filtros = ["todas", "abierta", "tomada", "hecha", "verificada", "cancelada"];

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
              category={getCategoriaLabel(task.categoria)}
              timeAgo={relativeTime(task.created_at)}
              estado={toCardEstado(task.estado)}
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
