import { Compass } from "lucide-react";
import { TabBarClient } from "@/components/TabBarClient";
import { TabBarPin } from "@/components/TabBarPin";
import { SYSTEM_STATE_COPY } from "@/features/system-states/copy";
import { SystemStateView } from "@/features/system-states/SystemStateView";

/**
 * App-owned 404 (Pencil 7.6 · eZRDM).
 * Root-level so unknown routes outside route groups still get the designed surface.
 * Includes hub chrome so members keep orientation (Inicio CTA + TabBar).
 */
export default function NotFound() {
  const copy = SYSTEM_STATE_COPY.notFound;

  return (
    <div className="flex flex-col min-h-full bg-bg">
      <div className="flex-1 w-full max-w-lg mx-auto pt-5 px-5 pb-5">
        <SystemStateView
          dataPencilFrame={copy.frameId}
          icon={Compass}
          iconTone="neutral"
          title={copy.title}
          subtitle={copy.subtitle}
          action={{ type: "link", href: "/", label: copy.actionLabel }}
        />
      </div>
      <div data-testid="tab-bar-spacer" className="h-[104px] shrink-0" aria-hidden />
      <TabBarPin>
        <TabBarClient />
      </TabBarPin>
    </div>
  );
}
