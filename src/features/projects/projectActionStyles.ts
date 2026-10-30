/**
 * Shared look for the project detail operations (ZER-224), so the buttons stop drifting
 * apart. Plain module on purpose: the buttons are client components and the detail is a
 * server component, and both import these strings.
 */

/** Per-member action on the right of a member row: Designar admin, Quitar admin. */
export const MEMBER_ACTION_CLASS =
  "shrink-0 whitespace-nowrap rounded-pill border border-border bg-surface px-3 py-1.5 font-display text-xs font-semibold disabled:opacity-50";

/** Full-width operation under the member list: Solicitudes de ingreso, Salir del proyecto. */
export const PROJECT_OPERATION_CLASS =
  "flex h-12 w-full items-center justify-center rounded-2xl border border-border bg-surface font-display text-[15px] font-medium disabled:opacity-50";
