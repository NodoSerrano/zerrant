"use client";

import { useActionState, useCallback, useRef, useState } from "react";

type ActionFn<State> = (state: Awaited<State>, formData: FormData) => State | Promise<State>;

/**
 * Drop-in for useActionState that locks the form on the first submit.
 * useActionState's `pending` flips after React schedules the transition, so a
 * fast double-click can enqueue two server-action calls. The lock is set
 * synchronously (ref + state) in the form action wrapper, before that race
 * window, and cleared when the underlying action settles (success or error).
 */
export function useGuardedActionState<State>(
  action: ActionFn<State>,
  initialState: Awaited<State>,
): [Awaited<State>, (payload: FormData) => void, boolean] {
  const lockedRef = useRef(false);
  const [locked, setLocked] = useState(false);

  const guardedAction = useCallback(
    async (prev: Awaited<State>, formData: FormData) => {
      try {
        return await action(prev, formData);
      } catch {
        // Transport/network rejects must not escape useActionState: map them to
        // the same { error } contract DB failures already use so forms keep typed values.
        return {
          error: "No pudimos conectar. Revisá tu conexión e intentá de nuevo.",
        } as Awaited<State>;
      } finally {
        lockedRef.current = false;
        setLocked(false);
      }
    },
    [action],
  );

  const [state, dispatch, pending] = useActionState(guardedAction, initialState);

  const guardedDispatch = useCallback(
    (formData: FormData) => {
      if (lockedRef.current || pending) {
        return;
      }
      lockedRef.current = true;
      setLocked(true);
      dispatch(formData);
    },
    [dispatch, pending],
  );

  return [state, guardedDispatch, pending || locked];
}
