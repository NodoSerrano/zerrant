"use client";

import { usePathname } from "next/navigation";
import { TabBar, type Tab } from "@/components/TabBar";

export function TabBarClient() {
  const pathname = usePathname();

  // /nodo/* remains reachable from Inicio (community hub) but has no TabBar tab.
  const active: Tab = pathname.startsWith("/plantel")
    ? "plantel"
    : pathname.startsWith("/agenda")
      ? "agenda"
      : pathname.startsWith("/profile") || pathname.startsWith("/onboarding")
        ? "perfil"
        : "inicio";

  return <TabBar active={active} />;
}
