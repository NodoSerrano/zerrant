import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { NO_ROWS, resolveOnboardingRedirect, type OnboardingGateProfile } from "./onboarding-gate";

const GATE_SELECT =
  "nombre, apellido, fecha_nacimiento, onboarding_completado_en, apodo, avatar_url";

export type OnboardingGateResult = {
  profile: OnboardingGateProfile | null;
  error: { code?: string; message?: string } | null;
  userId: string | null;
};

/** Uncached load — used by tests and wrapped by React.cache for RSC. */
export async function fetchOnboardingGateProfile(): Promise<OnboardingGateResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { profile: null, error: null, userId: null };
  }

  const { data, error } = await supabase
    .from("profiles")
    .select(GATE_SELECT)
    .eq("id", user.id)
    .single();

  if (error && error.code !== NO_ROWS) {
    return { profile: null, error: { code: error.code, message: error.message }, userId: user.id };
  }

  if (error?.code === NO_ROWS || !data) {
    return {
      profile: null,
      error: error ? { code: error.code, message: error.message } : null,
      userId: user.id,
    };
  }

  return {
    profile: data as OnboardingGateProfile,
    error: null,
    userId: user.id,
  };
}

/**
 * Per-request cached profile read for the onboarding gate + step1 prefill.
 * React.cache dedupes within a single RSC request tree (layout ↔ page).
 * It does NOT share with the proxy/middleware runtime.
 */
export const getOnboardingGateProfile = cache(fetchOnboardingGateProfile);

/**
 * Enforce onboarding gate for protected RSC trees ((app) + (modal)).
 * Soft-allows on infra profile errors (same semantics as the former proxy gate).
 */
export async function enforceOnboardingGate(pathname?: string): Promise<void> {
  let path = pathname;
  if (!path) {
    const h = await headers();
    path = h.get("x-pathname") ?? "/";
  }

  const { profile, error } = await getOnboardingGateProfile();

  // Soft-allow: infra failure must not lock the whole app into onboarding.
  if (error && error.code !== NO_ROWS) {
    console.error("[onboarding-gate] no se pudo leer el perfil para el gate de onboarding", error);
    return;
  }

  const target = resolveOnboardingRedirect(profile, path);
  if (target) {
    redirect(target);
  }
}
