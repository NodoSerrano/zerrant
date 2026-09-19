import type { ReactNode } from "react";

export default function ModalLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col min-h-full bg-bg">
      {/* Pencil focused wrappers (ZqSLW create, KG95R detail, vPUkG edit): [6,20,24,20] */}
      <div className="flex-1 w-full max-w-lg mx-auto pt-1.5 px-5 pb-6">{children}</div>
    </div>
  );
}
