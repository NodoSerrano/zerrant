"use client";

import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { AporteForm } from "@/features/aportes/AporteForm";
import type { createAporte } from "@/features/aportes/actions";

type CreateAporte = typeof createAporte;

interface NewAporteFormProps {
  action: CreateAporte;
  isPlatformAdmin: boolean;
}

export function NewAporteForm({ action, isPlatformAdmin }: NewAporteFormProps) {
  const router = useRouter();

  return (
    <div className="flex flex-col gap-[18px]">
      <div className="flex items-center justify-between">
        <button
          type="button"
          aria-label="Cerrar"
          onClick={() => (window.history.length > 1 ? router.back() : router.push("/profile"))}
          className="rounded-md focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          <X className="size-6 text-text-primary" />
        </button>
        <h1 className="font-display text-base font-medium text-text-primary">Registrar aporte</h1>
        <span aria-hidden="true" className="size-6" />
      </div>

      <AporteForm action={action} isPlatformAdmin={isPlatformAdmin} />
    </div>
  );
}
