import { ChevronLeft, Flame, Tag, User } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { displayName } from "@/features/profile/displayName";
import { TakeTaskButton, MarkDoneButton, VerifyTaskButton } from "@/features/tasks/task-actions";
import { TaskMenu } from "@/features/tasks/TaskMenu";
import {
  getCategoriaIcon,
  getCategoriaLabel,
  getEstadoBadge,
  getUrgencia,
} from "@/features/tasks/taskDisplay";
import { relativeTime } from "@/lib/time";
import { cn } from "@/lib/utils";
import type { Profile } from "@/features/profile/types";

// Mensajes de cierre: estados donde no hay acción posible y sólo se informa.
const ESTADO_MESSAGES: Record<string, string> = {
  verificada: "Tarea verificada y completada.",
  cancelada: "Esta tarea fue cancelada.",
};

export default async function TaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: task } = await supabase
    .from("tasks")
    .select("*, creador:creado_por(*), tomador:tomada_por(*)")
    .eq("id", id)
    .single();

  if (!task) notFound();

  const { data: currentProfile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const creador = task.creador as unknown as Profile | null;

  const isOwner = task.creado_por === user.id;
  const isTaker = task.tomada_por === user.id;
  const isAdmin = currentProfile?.is_platform_admin ?? false;
  const isSerrano = Boolean(currentProfile && currentProfile.tier !== "tourist");

  const estado = task.estado ?? "abierta";
  const badge = getEstadoBadge(estado);
  const urgencia = getUrgencia(task.urgencia ?? "media");
  const CategoriaIcon = getCategoriaIcon(task.categoria);

  // El textarea de crear tarea persiste "" y nunca null, así que los dos casos
  // significan lo mismo: no hay descripción.
  const descripcion = task.descripcion?.trim();

  const closingMessage = ESTADO_MESSAGES[estado];

  // El menú sólo tiene sentido para el creador y mientras la tarea siga viva.
  // Se decide acá además de adentro del componente para no montar un client
  // component que no va a dibujar nada.
  const showMenu = isOwner && (estado === "abierta" || estado === "tomada");

  return (
    <div className="flex flex-col gap-[18px]">
      <div className="flex flex-row items-center justify-between w-full">
        <Link href="/nodo/tasks" aria-label="Volver a tareas">
          <ChevronLeft className="size-6 text-text-primary" />
        </Link>
        <h1 className="font-display text-base font-medium text-text-primary">Tarea</h1>
        {showMenu ? (
          <TaskMenu taskId={task.id} estado={estado} isOwner={isOwner} />
        ) : (
          // Contrapeso del chevron: sin esto el título queda descentrado
          // cuando no hay menú que mostrar.
          <span aria-hidden="true" className="size-[22px]" />
        )}
      </div>

      <div className="flex flex-row items-center gap-3 w-full">
        <div className="size-12 rounded-[14px] bg-warm-yellow/[0.09] flex items-center justify-center shrink-0">
          <CategoriaIcon className="size-[22px] text-warm-orange" aria-hidden="true" />
        </div>
        <div className="flex-1 flex flex-col gap-1 min-w-0">
          <h2 className="font-display text-xl font-bold text-text-primary w-full">{task.titulo}</h2>
          <span
            className={cn(
              "self-start rounded-pill px-[11px] py-1 font-display text-xs font-semibold",
              badge.bg,
              badge.text,
            )}
          >
            {badge.label}
          </span>
        </div>
      </div>

      <div className="w-full flex flex-col gap-[10px] p-4 bg-surface border border-border rounded-md">
        <div className="flex flex-row items-center gap-2">
          <Tag className="size-[15px] text-text-muted" aria-hidden="true" />
          <span className="font-body text-[13px] font-normal text-text-secondary">
            {getCategoriaLabel(task.categoria)}
          </span>
        </div>
        <div className="flex flex-row items-center gap-2">
          <Flame className={cn("size-[15px]", urgencia.color)} aria-hidden="true" />
          <span className="font-body text-[13px] font-normal text-text-secondary">
            {urgencia.label}
          </span>
        </div>
        {creador && (
          <div className="flex flex-row items-center gap-2">
            <User className="size-[15px] text-text-muted" aria-hidden="true" />
            <span className="font-body text-[13px] font-normal text-text-secondary">
              {`Publicó ${displayName(creador)} · ${relativeTime(task.created_at)}`}
            </span>
          </div>
        )}
      </div>

      {descripcion && (
        <p className="w-full font-body text-sm leading-[21px] text-text-secondary">{descripcion}</p>
      )}

      {/* Cada acción cuelga directo del wrapper: en Pencil el CTA es hermano
          del resto, no hijo de otro contenedor. Metido adentro de un flex
          intermedio heredaría el gap de ese padre y la separación quedaría mal. */}
      {estado === "abierta" && isSerrano && !isOwner && <TakeTaskButton taskId={task.id} />}

      {estado === "tomada" && isTaker && <MarkDoneButton taskId={task.id} />}

      {estado === "tomada" && !isTaker && (
        <p className="font-body text-sm text-text-muted text-center">
          Esta tarea ya fue tomada por otro serrano.
        </p>
      )}

      {estado === "hecha" && isAdmin && <VerifyTaskButton taskId={task.id} />}

      {closingMessage && (
        <p className="font-body text-sm text-text-muted text-center">{closingMessage}</p>
      )}
    </div>
  );
}
