import { redirect } from "next/navigation";

/** Old links and the gate land here. The profile form lives on step 1. */
export default async function OnboardingStep2(): Promise<never> {
  redirect("/onboarding/step1");
}
