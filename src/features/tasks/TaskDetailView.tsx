import { ChevronLeft, Flame, Tag, User, UserCheck } from "lucide-react";
import Link from "next/link";
import { TakeTaskButton, MarkDoneButton, VerifyTaskButton } from "./task-actions";
import { TaskMenu } from "./TaskMenu";
import { getCategoriaIcon, getCategoriaLabel, getEstadoBadge, getUrgencia } from "./taskDisplay";
import { relativeTime } from "@/lib/time";
import { cn } from "@/lib/utils";

// Presentación del detalle, separada de la lectura de datos. Es el mismo corte
// que ya usa crear tarea (`page.tsx` guarda + `NewTaskForm` dibuja): deja la
// pantalla montable con datos de prueba para medirla en el navegador.

// Estados donde no queda acción posible y sólo se informa el desenlace.
const ESTADO_MESSAGES: Record<string, string> = {
  hecha: "Trabajo terminado. Falta que un admin lo verifique.",
  verificada: "Tarea verificada y completada.",
  cancelada: "Esta tarea fue cancelada.",
};

export interface TaskDetailViewProps {
  taskId: string;
  titulo: string;
  descripcion: string | null;
  categoria: string;
  urgencia: string;
  estado: string;
  createdAt: string;
  autor: string | null;
  tomador: string | null;
  isOwner: boolean;
  isTaker: boolean;
  isAdmin: boolean;
  isSerrano: boolean;
}

export function TaskDetailView({
  taskId,
  titulo,
  descripcion,
  categoria,
  urgencia,
  estado,
  createdAt,
  autor,
  tomador,
  isOwner,
  isTaker,
  isAdmin,
  isSerrano,
}: TaskDetailViewProps) {
  const badge = getEstadoBadge(estado);
  const urgenciaData = getUrgencia(urgencia);
  const CategoriaIcon = getCategoriaIcon(categoria);

  // El textarea de crear tarea persiste "" y nunca null, así que los dos casos
  // significan lo mismo: no hay descripción.
  const cuerpo = descripcion?.trim();

  const closingMessage = ESTADO_MESSAGES[estado];

  // El menú sólo tiene sentido para el creador y mientras la tarea siga viva.
  const showMenu = isOwner && (estado === "abierta" || estado === "tomada");

  return (
    <div className="flex w-full flex-col gap-[18px]">
      <div className="flex flex-row items-center justify-between w-full">
        <Link href="/nodo/tasks" aria-label="Volver a tareas">
          <ChevronLeft className="size-6 text-text-primary" />
        </Link>
        <h1 className="font-display text-base font-medium text-text-primary">Tarea</h1>
        {showMenu ? (
          <TaskMenu taskId={taskId} estado={estado} isOwner={isOwner} />
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
          <h2 className="font-display text-xl font-bold text-text-primary w-full">{titulo}</h2>
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
            {getCategoriaLabel(categoria)}
          </span>
        </div>
        <div className="flex flex-row items-center gap-2">
          <Flame className={cn("size-[15px]", urgenciaData.color)} aria-hidden="true" />
          <span className="font-body text-[13px] font-normal text-text-secondary">
            {urgenciaData.label}
          </span>
        </div>
        {autor && (
          <div className="flex flex-row items-center gap-2">
            <User className="size-[15px] text-text-muted" aria-hidden="true" />
            <span className="font-body text-[13px] font-normal text-text-secondary">
              {`Publicó ${autor} · ${relativeTime(createdAt)}`}
            </span>
          </div>
        )}
        {tomador && (
          <div className="flex flex-row items-center gap-2">
            <UserCheck className="size-[15px] text-text-muted" aria-hidden="true" />
            <span className="font-body text-[13px] font-normal text-text-secondary">
              {`Tomada por ${tomador}`}
            </span>
          </div>
        )}
      </div>

      {cuerpo && (
        <p className="w-full font-body text-sm leading-[21px] text-text-secondary">{cuerpo}</p>
      )}

      {/* Cada acción cuelga directo del wrapper: en Pencil el CTA es hermano
          del resto, no hijo de otro contenedor. Metido adentro de un flex
          intermedio heredaría el gap de ese padre y la separación quedaría mal. */}
      {estado === "abierta" && isSerrano && !isOwner && <TakeTaskButton taskId={taskId} />}

      {estado === "tomada" && isTaker && <MarkDoneButton taskId={taskId} />}

      {estado === "tomada" && !isTaker && (
        <p className="font-body text-sm text-text-muted text-center">
          {isOwner ? "Alguien ya tomó esta tarea." : "Esta tarea ya fue tomada por otro serrano."}
        </p>
      )}

      {estado === "hecha" && isAdmin && <VerifyTaskButton taskId={taskId} />}

      {closingMessage && !(estado === "hecha" && isAdmin) && (
        <p className="font-body text-sm text-text-muted text-center">{closingMessage}</p>
      )}
    </div>
  );
}
