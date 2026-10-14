import type { ReactNode } from "react";

export default function ModalLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-1 flex-col min-h-full bg-bg">
      {/* flex-1 + flex-col down from <body>: percentage heights do not resolve in this
          chain, so screens that center vertically (enviado) grow with flex-1 (bug-375). */}
      {/* Pencil focused wrappers (ZqSLW create, KG95R detail, vPUkG edit): [6,20,24,20] */}
      <div className="flex flex-1 flex-col w-full max-w-lg mx-auto pt-1.5 px-5 pb-6">
        {children}
      </div>
    </div>
  );
}
