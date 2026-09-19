"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

/**
 * Pins TabBar to the viewport bottom via a body portal.
 * position:fixed inside the app tree can bind to a transformed ancestor
 * (runtime Next/devtools wrappers) and land at the top of that box (ZER-70).
 */
export function TabBarPin({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const pin = (
    <div
      data-testid="tab-bar-pin"
      className="fixed bottom-0 left-0 right-0 z-30 mx-auto w-full max-w-lg"
    >
      {children}
    </div>
  );

  // SSR + first client paint: keep pin in-tree so no-JS still gets the links.
  // After mount: body portal so fixed binds to the viewport (ZER-70).
  if (!mounted) {
    return pin;
  }

  return createPortal(pin, document.body);
}
