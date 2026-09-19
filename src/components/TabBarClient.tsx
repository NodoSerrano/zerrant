"use client";

import { usePathname } from "next/navigation";
import { TabBar, type Tab } from "@/components/TabBar";

export function TabBarClient() {
  const pathname = usePathname();

  const active: Tab = pathname.startsWith("/nodo")
    ? "nodo"
    : pathname.startsWith("/plantel")
      ? "plantel"
      : pathname.startsWith("/agenda")
        ? "agenda"
        : "perfil";

  return <TabBar active={active} />;
}
