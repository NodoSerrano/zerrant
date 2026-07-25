"use client";

import { useFormStatus } from "react-dom";
import { LogOut } from "lucide-react";

export function SignOutButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="flex w-full items-center gap-3 px-4 py-[15px] disabled:opacity-50"
    >
      <span className="flex size-5 items-center justify-center shrink-0">
        <LogOut className="size-5 text-coral" />
      </span>
      <span className="text-sm text-coral">{pending ? "Cerrando..." : "Cerrar sesión"}</span>
    </button>
  );
}
