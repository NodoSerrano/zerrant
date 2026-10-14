/** How long Inicio and perfil keep the post-conversion confirmation. */
export const MEMBER_CONFIRMED_NOTICE_MS = 7 * 24 * 60 * 60 * 1000;

/** `actualizado_en` lower bound: the row was moved to aprobado inside the window. */
export function memberConfirmedSince(now: Date = new Date()): string {
  return new Date(now.getTime() - MEMBER_CONFIRMED_NOTICE_MS).toISOString();
}
