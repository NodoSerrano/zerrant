import { Suspense, type ReactNode } from "react";
import { TabBarClient } from "@/components/TabBarClient";
import { TabBarPin } from "@/components/TabBarPin";
import { ActionNotice } from "@/components/ActionNotice";
import { TAB_BAR_SPACER_CLASS } from "@/components/tabBarLayout";
import { cn } from "@/lib/utils";

/**
 * Hub chrome with the bottom TabBar. Synchronous on purpose: the (app) layout decides
 * `showActividad` from the profile, while the public offline fallback renders it without
 * any session or database read (ZER-206).
 */
export function AppShell({
  children,
  showActividad = false,
}: {
  children: ReactNode;
  showActividad?: boolean;
}) {
  return (
    <div className="flex flex-col min-h-full bg-bg">
      {/*
        Pencil hub wrappers (NgZiI tasks, k8Odh plantel, v9SljB profile) still encode
        [8,20,20,20] under a fake StatusBar. After ZER-66 that chrome is gone, so the
        live shell uses [20,20,20,20] (pt-5 px-5 pb-5): sides/bottom stay on Pencil,
        top matches the 20px lateral inset so titles are not flush with the viewport.
      */}
      <div className="flex-1 w-full max-w-lg mx-auto pt-5 px-5 pb-5">
        {/* useSearchParams needs a Suspense boundary to keep pages prerenderable. */}
        <Suspense fallback={null}>
          <ActionNotice />
        </Suspense>
        {children}
      </div>
      {/* Reserved so lists clear the fixed TabBar (height in tabBarLayout.ts). */}
      <div
        data-testid="tab-bar-spacer"
        className={cn(TAB_BAR_SPACER_CLASS, "shrink-0")}
        aria-hidden
      />
      <TabBarPin>
        <TabBarClient showActividad={showActividad} />
      </TabBarPin>
    </div>
  );
}
