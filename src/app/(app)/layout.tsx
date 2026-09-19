import { TabBarClient } from "@/components/TabBarClient";
import type { ReactNode } from "react";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col min-h-full bg-bg">
      {/* Pencil hub wrappers (e.g. NgZiI tasks, k8Odh plantel, v9SljB profile): [8,20,20,20] */}
      <div className="flex-1 w-full max-w-lg mx-auto pt-2 px-5 pb-5">{children}</div>
      <TabBarClient />
    </div>
  );
}
