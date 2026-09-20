import type { Metadata } from "next";
import { OfflineShellFallback } from "@/features/pwa/OfflineShellFallback";

export const metadata: Metadata = {
  title: "Sin conexión",
  robots: {
    index: false,
    follow: false,
  },
};

/** Serwist navigation fallback — public so SW install can precache without auth. */
export default function OfflinePage() {
  return <OfflineShellFallback />;
}
