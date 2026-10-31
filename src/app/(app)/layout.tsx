import type { ReactNode } from "react";
import { AppShell } from "@/components/AppShell";
import { getOnboardingGateProfile } from "@/features/profile/onboarding-gate-server";
import { hasMemberAccess } from "@/features/membership/member-access";

export default async function AppLayout({ children }: { children: ReactNode }) {
  // Proyectos y Tareas is members-only (ZER-107): tourists do not get Actividad (ZER-206).
  // Same cached profile read and same rule as the /nodo MembersOnlyGate.
  const showActividad = hasMemberAccess(await getOnboardingGateProfile());

  return <AppShell showActividad={showActividad}>{children}</AppShell>;
}
