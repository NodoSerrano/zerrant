"use client";

import { PrimaryButton } from "@/components/PrimaryButton";
import { assignTask, markTaskDone, releaseTask, takeTask, verifyTask } from "@/features/tasks/actions";
import { useGuardedActionState } from "@/lib/use-guarded-action-state";

export function TakeTaskButton({ taskId }: { taskId: string }) {
  const [state, action, pending] = useGuardedActionState(takeTask, null);

  return (
    <form action={action}>
      <input type="hidden" name="taskId" value={taskId} />
      {state?.error && <p className="text-sm text-coral mb-2">{state.error}</p>}
      <PrimaryButton type="submit" disabled={pending} className="w-full">
        {pending ? "Tomando..." : "Tomar esta tarea"}
      </PrimaryButton>
    </form>
  );
}

export function ReleaseTaskButton({ taskId }: { taskId: string }) {
  const [state, action, pending] = useGuardedActionState(releaseTask, null);

  return (
    <form action={action}>
      <input type="hidden" name="taskId" value={taskId} />
      {state?.error && <p className="text-sm text-coral mb-2">{state.error}</p>}
      <PrimaryButton type="submit" disabled={pending} className="w-full">
        {pending ? "Liberando..." : "Liberar tarea"}
      </PrimaryButton>
    </form>
  );
}

export function AssignTaskForm({
  taskId,
  members,
}: {
  taskId: string;
  members: { id: string; name: string }[];
}) {
  const [state, action, pending] = useGuardedActionState(assignTask, null);

  if (members.length === 0) return null;

  return (
    <form action={action} className="flex flex-col gap-2">
      <input type="hidden" name="taskId" value={taskId} />
      <label htmlFor="assigneeId" className="font-body text-[13px] font-medium text-text-secondary">
        Asignar a
      </label>
      <select
        id="assigneeId"
        name="assigneeId"
        required
        defaultValue=""
        className="h-11 rounded-2xl border border-border bg-surface px-4 text-[15px] text-text-primary"
      >
        <option value="">Elegí un serrano</option>
        {members.map((member) => (
          <option key={member.id} value={member.id}>
            {member.name}
          </option>
        ))}
      </select>
      {state?.error && <p className="text-sm text-coral">{state.error}</p>}
      <PrimaryButton type="submit" disabled={pending} className="w-full">
        {pending ? "Asignando..." : "Asignar"}
      </PrimaryButton>
    </form>
  );
}

export function MarkDoneButton({ taskId }: { taskId: string }) {
  const [state, action, pending] = useGuardedActionState(markTaskDone, null);

  return (
    <form action={action}>
      <input type="hidden" name="taskId" value={taskId} />
      {state?.error && <p className="text-sm text-coral mb-2">{state.error}</p>}
      <PrimaryButton type="submit" disabled={pending} className="w-full">
        {pending ? "Guardando..." : "Marcar como hecha"}
      </PrimaryButton>
    </form>
  );
}

export function VerifyTaskButton({ taskId }: { taskId: string }) {
  const [state, action, pending] = useGuardedActionState(verifyTask, null);

  return (
    <form action={action}>
      <input type="hidden" name="taskId" value={taskId} />
      {state?.error && <p className="text-sm text-coral mb-2">{state.error}</p>}
      <PrimaryButton type="submit" disabled={pending} className="w-full">
        {pending ? "Verificando..." : "Verificar tarea"}
      </PrimaryButton>
    </form>
  );
}
