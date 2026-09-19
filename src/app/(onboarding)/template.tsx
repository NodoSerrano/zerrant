import type { ReactNode } from "react";
import { enforceOnboardingGate } from "@/features/profile/onboarding-gate-server";

/** Re-runs on navigation (unlike layout) so the onboarding gate stays fresh. */
export default async function OnboardingTemplate({ children }: { children: ReactNode }) {
  await enforceOnboardingGate();
  return children;
}
