"use client";

import { useActionState, useCallback, useRef, useState } from "react";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { isHTTPAccessFallbackError } from "next/dist/client/components/http-access-fallback/http-access-fallback";

type ActionFn<State> = (state: Awaited<State>, formData: FormData) => State | Promise<State>;

export const TRANSPORT_ERROR = "No pudimos conectar. Revisá tu conexión e intentá de nuevo.";

/** States returned by this hook must be able to surface `{ error }` for transport failures. */
type GuardedState = { error?: string } | null;

/**
 * Decide whether a rejected server action is Next control-flow (rethrow) or a
 * transport/unexpected failure that should become `{ error }` for the form.
 * Pure so tests can assert redirect/notFound without fighting useActionState.
 */
export function resolveGuardedActionRejection(
  error: unknown,
): { kind: "rethrow"; error: unknown } | { kind: "state"; state: { error: string } } {
  if (isRedirectError(error) || isHTTPAccessFallbackError(error)) {
    return { kind: "rethrow", error };
  }

  console.error("[useGuardedActionState] action rejected", error);
  return { kind: "state", state: { error: TRANSPORT_ERROR } };
}

/**
 * Drop-in for useActionState that locks the form on the first submit.
 * useActionState's `pending` flips after React schedules the transition, so a
 * fast double-click can enqueue two server-action calls. The lock is set
 * synchronously (ref + state) in the form action wrapper, before that race
 * window, and cleared when the underlying action settles (success or error).
 *
 * Transport rejects map to `{ error }` so forms keep typed values. Next.js
 * control-flow throws (`redirect` / `notFound` / forbidden / unauthorized) are
 * rethrown so navigation still works.
 */
export function useGuardedActionState<State extends GuardedState>(
  action: ActionFn<State>,
  initialState: Awaited<State>,
): [Awaited<State>, (payload: FormData) => void, boolean] {
  const lockedRef = useRef(false);
  const [locked, setLocked] = useState(false);

  const guardedAction = useCallback(
    async (prev: Awaited<State>, formData: FormData) => {
      try {
        return await action(prev, formData);
      } catch (error) {
        const resolved = resolveGuardedActionRejection(error);
        if (resolved.kind === "rethrow") {
          throw resolved.error;
        }
        return resolved.state as Awaited<State>;
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
