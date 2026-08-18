"use client";

import { usePathname } from "next/navigation";
import { TabBar, type Tab } from "@/components/TabBar";

export function TabBarClient() {
  const pathname = usePathname();

  const active: Tab = pathname.startsWith("/nodo")
    ? "nodo"
    : pathname.startsWith("/plantel")
      ? "plantel"
      : pathname.startsWith("/profile") || pathname.startsWith("/onboarding")
        ? "perfil"
        : "inicio";

  return <TabBar active={active} />;
}
