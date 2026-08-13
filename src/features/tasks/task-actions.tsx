"use client";

import { useActionState } from "react";
import { PrimaryButton } from "@/components/PrimaryButton";
import { takeTask, markTaskDone, verifyTask } from "@/features/tasks/actions";

export function TakeTaskButton({ taskId }: { taskId: string }) {
  const [state, action, pending] = useActionState(takeTask, null);

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

export function MarkDoneButton({ taskId }: { taskId: string }) {
  const [state, action, pending] = useActionState(markTaskDone, null);

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
  const [state, action, pending] = useActionState(verifyTask, null);

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
