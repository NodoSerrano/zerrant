import { redirect } from "next/navigation";
import { NO_ROWS, resolveOnboardingRedirect } from "@/features/profile/onboarding-gate";
import { getOnboardingGateProfile } from "@/features/profile/onboarding-gate-server";

export default async function Home() {
  const { profile, error, userId } = await getOnboardingGateProfile();

  if (!userId) {
    redirect("/auth/login");
  }

  // Soft-allow on infra errors — fall through to profile hub.
  if (error && error.code !== NO_ROWS) {
    redirect("/profile");
  }

  const onboardingTarget = resolveOnboardingRedirect(profile, "/");
  if (onboardingTarget) {
    redirect(onboardingTarget);
  }

  redirect("/profile");
}
