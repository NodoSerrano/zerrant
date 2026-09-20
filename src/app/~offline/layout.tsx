import AppLayout from "@/app/(app)/layout";
import type { ReactNode } from "react";

/**
 * Offline fallback keeps the same bottom-nav chrome as hubs without the
 * (app) onboarding gate/template — SW install must precache this URL without
 * an authenticated session.
 */
export default function OfflineLayout({ children }: { children: ReactNode }) {
  return <AppLayout>{children}</AppLayout>;
}
