/**
 * ZER-171 — visibility for the persistent "Ser Serrano" CTA.
 * Pipeline entry stays `/solicitar` (same as the tourist profile shell).
 */

export const SER_SERRANO_CTA_HREF = "/solicitar" as const;

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
