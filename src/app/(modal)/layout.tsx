import { StatusBar } from "@/components/StatusBar";
import type { ReactNode } from "react";

export default function ModalLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col min-h-full bg-bg">
      <StatusBar />
      <div className="flex-1 w-full max-w-lg mx-auto p-5">{children}</div>
    </div>
  );
}
