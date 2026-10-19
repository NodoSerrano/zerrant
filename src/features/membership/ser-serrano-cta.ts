/**
 * ZER-171 — visibility for the persistent "Ser Serrano" CTA.
 * ZER-191 — the CTA opens the benefits page first; only that page links to
 * the application form (`/solicitar`, the pipeline entry).
 */

export const SER_SERRANO_CTA_HREF = "/ser-serrano" as const;
export const SER_SERRANO_APPLY_HREF = "/solicitar" as const;

/** What membership unlocks, as the original CTA copy put it (ZER-171). */
export const SER_SERRANO_BENEFICIOS = [
  "Aparecer en el plantel",
  "Crear eventos",
  "Participar de los proyectos",
] as const;

export type SerSerranoCtaInput = {
  /** Profile tier; only tourists may see the CTA. */
  tier: string | null | undefined;
  /** True when the user has an active (non-terminal) membership request. */
  hasActiveMembershipRequest: boolean;
};

/**
 * Show the join CTA only for tourists without an in-flight request.
 * Members never see it; pending applicants use the status card on profile instead.
 */
export function shouldShowSerSerranoCta(input: SerSerranoCtaInput): boolean {
  if (input.tier !== "tourist") return false;
  if (input.hasActiveMembershipRequest) return false;
  return true;
}
