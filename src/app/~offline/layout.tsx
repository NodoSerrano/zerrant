import { AppShell } from "@/components/AppShell";
import type { ReactNode } from "react";

/**
 * Offline fallback keeps the same bottom-nav chrome as hubs without the
 * (app) onboarding gate/template — SW install must precache this URL without
 * an authenticated session. That is why it uses the synchronous shell and not
 * the (app) layout, which reads the profile to decide the Actividad tab (ZER-206).
 */
export default function OfflineLayout({ children }: { children: ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
