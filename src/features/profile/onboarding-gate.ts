export type OnboardingGateProfile = {
  nombre: string | null;
  apellido: string | null;
  fecha_nacimiento: string | null;
  onboarding_completado_en: string | null;
  apodo?: string | null;
  avatar_url?: string | null;
};

export const NO_ROWS = "PGRST116";

/** Segment-aware match: `/onboarding` must not capture `/onboarding-old`. */
export function underPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function isOnboardingComplete(profile: OnboardingGateProfile | null | undefined): boolean {
  return Boolean(profile?.onboarding_completado_en);
}

export function isStep1Complete(profile: OnboardingGateProfile | null | undefined): boolean {
  return Boolean(profile?.nombre && profile?.apellido && profile?.fecha_nacimiento);
}

/** Where to send a user that still owes onboarding (not already under the right step). */
export function nextOnboardingPath(
  profile: OnboardingGateProfile | null | undefined,
): "/onboarding/step1" | "/onboarding/step2" {
  return isStep1Complete(profile) ? "/onboarding/step2" : "/onboarding/step1";
}

/**
 * Pure redirect decision for the onboarding gate.
 * Returns a path to redirect to, or null to allow the request.
 */
export function resolveOnboardingRedirect(
  profile: OnboardingGateProfile | null | undefined,
  pathname: string,
): string | null {
  const onboardingDone = isOnboardingComplete(profile);
  const step1Done = isStep1Complete(profile);
  const isOnboarding = underPrefix(pathname, "/onboarding");

  if (!onboardingDone && !isOnboarding) {
    return nextOnboardingPath(profile);
  }

  // Step 2 cannot skip step 1: step 1 holds the required data.
  if (!onboardingDone && !step1Done && !underPrefix(pathname, "/onboarding/step1")) {
    return "/onboarding/step1";
  }

  if (onboardingDone && isOnboarding) {
    return "/";
  }

  return null;
}
