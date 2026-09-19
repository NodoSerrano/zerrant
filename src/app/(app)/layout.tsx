import { TabBarClient } from "@/components/TabBarClient";
import type { ReactNode } from "react";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col min-h-full bg-bg">
      {/* Pencil hub wrappers (e.g. NgZiI tasks, k8Odh plantel, v9SljB profile): [8,20,20,20] */}
      <div className="flex-1 w-full max-w-lg mx-auto pt-2 px-5 pb-5">{children}</div>
      {/* Pencil TabBar nMDGY: pt 21 + pill 62 + pb 21 = 104px reserved so lists clear the fixed bar */}
      <div data-testid="tab-bar-spacer" className="h-[104px] shrink-0" aria-hidden />
      <div className="fixed bottom-0 left-0 right-0 z-30 mx-auto w-full max-w-lg">
        <TabBarClient />
      </div>
    </div>
  );
}
