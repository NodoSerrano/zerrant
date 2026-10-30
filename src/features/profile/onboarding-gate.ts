export type OnboardingGateProfile = {
  nombre: string | null;
  apellido: string | null;
  fecha_nacimiento: string | null;
  onboarding_completado_en: string | null;
  apodo?: string | null;
  avatar_url?: string | null;
  bio?: string | null;
  contacto_telegram?: string | null;
  sitio_url?: string | null;
  /** Present when selected; used by Inicio community hub (ZER-107). */
  tier?: string | null;
  /** Platform admins count as members for Proyectos y Tareas (ZER-206). */
  is_platform_admin?: boolean | null;
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

/** Incomplete onboarding always resumes on the single profile screen. */
export function nextOnboardingPath(): "/onboarding/step1" {
  return "/onboarding/step1";
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
  const isOnboarding = underPrefix(pathname, "/onboarding");

  if (!onboardingDone && !underPrefix(pathname, "/onboarding/step1")) {
    return nextOnboardingPath();
  }

  if (onboardingDone && isOnboarding) {
    return "/";
  }

  return null;
}
