"use client";

import { usePathname } from "next/navigation";
import { TabBar, type Tab } from "@/components/TabBar";

export function TabBarClient() {
  const pathname = usePathname();

  // /nodo/* remains reachable from Inicio (community hub) but has no TabBar tab.
  // /admin/* opens from Perfil (and its back link returns there).
  const active: Tab = pathname.startsWith("/plantel")
    ? "plantel"
    : pathname.startsWith("/agenda")
      ? "agenda"
      : pathname.startsWith("/profile") ||
          pathname.startsWith("/onboarding") ||
          pathname.startsWith("/admin")
        ? "perfil"
        : "inicio";

  return <TabBar active={active} />;
}
