"use client";

import { usePathname } from "next/navigation";
import { TabBar, type Tab } from "@/components/TabBar";

export function TabBarClient({ showActividad = false }: { showActividad?: boolean }) {
  const pathname = usePathname();

  // Actividad is the project and task hubs only. A future /nodo page that is
  // not one of those lists should not light this tab.
  const active: Tab =
    pathname === "/nodo/projects" ||
    pathname.startsWith("/nodo/projects/") ||
    pathname === "/nodo/tasks" ||
    pathname.startsWith("/nodo/tasks/")
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
