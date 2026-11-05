import Link from "next/link";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { relativeTime } from "@/lib/time";
import { TaskCard } from "@/components/TaskCard";
import { EmptyState } from "@/components/EmptyState";
import { NodoTabs } from "@/components/NodoTabs";
import { cn } from "@/lib/utils";
import { FAB_ABOVE_TAB_BAR_CLASS } from "@/components/tabBarLayout";
import { BRAND_GRADIENT_CLASS } from "@/lib/brandGradients";
import { displayName } from "@/features/profile/displayName";
import type { NombreVisible } from "@/features/profile/types";
import { ESTADO_BADGE } from "@/features/tasks/taskDisplay";
import { formatCategorias } from "@/features/tasks/categorias";
import {
  TASK_HUB_ESTADO_FILTERS,
  resolveTaskHubFilter,
  taskHubFilterHref,
} from "@/features/tasks/hub-filter";
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

type TakerProfile = {
  nombre: string | null;
  apellido: string | null;
  apodo: string | null;
  nombre_visible: NombreVisible | null;
};

function takerLabel(task: {
  tomada_por: string | null;
  tomador: TakerProfile | null;
}): string | null {
  if (!task.tomada_por || !task.tomador) return null;
  const name = displayName({
    nombre: task.tomador.nombre,
    apellido: task.tomador.apellido,
    apodo: task.tomador.apodo,
    nombre_visible: task.tomador.nombre_visible ?? "nombre_apellido",
  });
  return name || null;
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

  if (!user) return <p className="text-text-secondary">Iniciá sesión para ver las tareas.</p>;

  const { estado } = await searchParams;
  // Default abierta (ZER-225). Legacy ?estado=verificada / unknown → abierta.
  const filter = resolveTaskHubFilter(estado);

  let query = supabase
    .from("tasks")
    .select(
      "*, profiles:creado_por(nombre, apellido, apodo, nombre_visible), tomador:tomada_por(nombre, apellido, apodo, nombre_visible)",
    )
    .order("created_at", { ascending: false });

  if (filter === "todas") {
    query = query.neq("estado", "cancelada");
  } else {
    query = query.eq("estado", filter as TaskEstado);
  }

  const { data: tasks } = await query;

  const { data: profile } = await supabase
    .from("profiles")
    .select("tier")
    .eq("id", user.id)
    .single();
  const canCreate = Boolean(profile && profile.tier !== "tourist");
  const isEmpty = !tasks || tasks.length === 0;
  const showCreateCta = canCreate && (filter === "todas" || !isEmpty);

  const pillClass = (active: boolean) =>
    cn(
      "inline-flex items-center rounded-pill px-3 py-1.5 text-xs font-semibold font-display whitespace-nowrap transition-colors",
      active
        ? "bg-primary text-on-primary"
        : "bg-surface border border-border text-text-secondary hover:text-text-primary",
    );

  return (
    <div className="flex flex-col gap-5 relative">
      {/* TabBar destination (ZER-206): no back link, title only. */}
      <h1 className="font-display text-2xl font-bold text-text-primary">Proyectos y Tareas</h1>

      <NodoTabs active="tareas" />

      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <div data-testid="task-hub-filter-estado" className="flex gap-2">
          {TASK_HUB_ESTADO_FILTERS.map((f) => (
            <Link key={f} href={taskHubFilterHref(f)} className={pillClass(filter === f)}>
              {ESTADO_LABELS[f]}
            </Link>
          ))}
        </div>
        <span className="h-4 w-px shrink-0 bg-border" aria-hidden="true" />
        <Link
          data-testid="task-hub-filter-todas"
          href={taskHubFilterHref("todas")}
          className={pillClass(filter === "todas")}
        >
          Todas
        </Link>
      </div>

      {isEmpty ? (
        <EmptyState
          href={showCreateCta ? "/nodo/tasks/new" : undefined}
          subtitle={
            filter !== "todas"
              ? "No hay tareas con este estado."
              : canCreate
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
              category={formatCategorias(task.categorias ?? [], task.categoria_otra)}
              timeAgo={relativeTime(task.created_at)}
              estado={toCardEstado(task.estado)}
              urgencia={task.urgencia ?? "media"}
              assigneeName={takerLabel(task)}
            />
          ))}
        </div>
      )}

      {showCreateCta && (
        <Link
          href="/nodo/tasks/new"
          className={cn(
            "fixed right-5 z-40",
            FAB_ABOVE_TAB_BAR_CLASS,
            "size-14 rounded-full",
            BRAND_GRADIENT_CLASS,
            "shadow-[0_4px_14px_rgba(26,22,20,0.25)]",
            "flex items-center justify-center",
            "active:scale-95 hover:brightness-110 transition-all",
          )}
          aria-label="Crear tarea"
        >
          <Plus className="size-6 text-on-gradient" strokeWidth={2.5} />
        </Link>
      )}
    </div>
  );
}
