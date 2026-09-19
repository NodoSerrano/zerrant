import { TabBarClient } from "@/components/TabBarClient";
import { TabBarPin } from "@/components/TabBarPin";
import type { ReactNode } from "react";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col min-h-full bg-bg">
      {/*
        Pencil hub wrappers (NgZiI tasks, k8Odh plantel, v9SljB profile) still encode
        [8,20,20,20] under a fake StatusBar. After ZER-66 that chrome is gone, so the
        live shell uses [20,20,20,20] (pt-5 px-5 pb-5): sides/bottom stay on Pencil,
        top matches the 20px lateral inset so titles are not flush with the viewport.
      */}
      <div className="flex-1 w-full max-w-lg mx-auto pt-5 px-5 pb-5">{children}</div>
      {/* Pencil TabBar nMDGY: pt 21 + pill 62 + pb 21 = 104px reserved so lists clear the fixed bar */}
      <div data-testid="tab-bar-spacer" className="h-[104px] shrink-0" aria-hidden />
      <TabBarPin>
        <TabBarClient />
      </TabBarPin>
    </div>
  );
}
