"use client";

import { usePathname } from "next/navigation";
import { TabBar, type Tab } from "@/components/TabBar";

export function TabBarClient({ showActividad = false }: { showActividad?: boolean }) {
  const pathname = usePathname();

  // /nodo/* is the Actividad tab (ZER-206), members only.
  // /admin/* opens from Perfil (and its back link returns there).
  const active: Tab = pathname.startsWith("/nodo")
    ? "actividad"
    : pathname.startsWith("/plantel")
      ? "plantel"
      : pathname.startsWith("/agenda")
        ? "agenda"
        : pathname.startsWith("/profile") ||
            pathname.startsWith("/onboarding") ||
            pathname.startsWith("/admin")
          ? "perfil"
          : "inicio";

  return <TabBar active={active} showActividad={showActividad} />;
}
