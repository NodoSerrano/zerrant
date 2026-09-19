import type { ReactNode } from "react";

export default function OnboardingShellLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col min-h-full bg-bg">
      {/*
        Same hub inset as (app) after ZER-73: [20,20,20,20]. Onboarding has no TabBar,
        so there is no 104px spacer and no pinned chrome.
      */}
      <div className="flex-1 w-full max-w-lg mx-auto pt-5 px-5 pb-5">{children}</div>
    </div>
  );
}
