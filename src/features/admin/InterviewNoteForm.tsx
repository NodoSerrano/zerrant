"use client";

import { useGuardedActionState } from "@/lib/use-guarded-action-state";
import { cn } from "@/lib/utils";
import { saveInterviewNote, type SaveInterviewNoteState } from "./actions";

export function InterviewNoteForm({
  requestId,
  noteId,
  body,
}: {
  requestId: string;
  noteId?: string;
  body?: string;
}) {
  const [state, formAction, pending] = useGuardedActionState(
    saveInterviewNote as (
      state: SaveInterviewNoteState,
      formData: FormData,
    ) => Promise<SaveInterviewNoteState>,
    null,
  );
  const editing = Boolean(noteId);

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <input type="hidden" name="requestId" value={requestId} />
      {noteId ? <input type="hidden" name="noteId" value={noteId} /> : null}
      <textarea
        name="body"
        required
        maxLength={2000}
        rows={3}
        defaultValue={body ?? ""}
        placeholder="Nota de la entrevista. Solo la ve un admin."
        aria-label={editing ? "Editar nota interna" : "Nueva nota interna"}
        className={cn(
          "min-h-[72px] rounded-2xl border border-border bg-surface p-3",
          "font-body text-[13px] leading-[1.4] text-text-primary placeholder:text-text-muted",
          "resize-y focus:outline-hidden focus:ring-2 focus:ring-primary/40",
        )}
      />
      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-pill bg-surface border border-border h-[36px] px-3 disabled:opacity-50"
      >
        <span className="font-display text-[13px] font-medium text-text-secondary">
          {editing ? "Guardar nota" : "Agregar nota"}
        </span>
      </button>
      {state?.error || state?.success ? (
        <p
          role="status"
          className={`font-body text-xs ${state.error ? "text-coral" : "text-text-secondary"}`}
        >
          {state.error ?? state.success}
        </p>
      ) : null}
    </form>
  );
}
