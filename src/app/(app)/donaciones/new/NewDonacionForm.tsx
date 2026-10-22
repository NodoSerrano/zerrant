"use client";

import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { DonacionForm } from "@/features/donaciones/DonacionForm";
import type { createDonacion } from "@/features/donaciones/actions";

type CreateDonacion = typeof createDonacion;

interface NewDonacionFormProps {
  action: CreateDonacion;
}

export function NewDonacionForm({ action }: NewDonacionFormProps) {
  const router = useRouter();

  return (
    <div className="flex flex-col gap-[18px] pb-[90px]">
      <div className="flex items-center justify-between">
        <button
          type="button"
          aria-label="Cerrar"
          onClick={() => (window.history.length > 1 ? router.back() : router.push("/donaciones"))}
          className="rounded-md focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          <X className="size-6 text-text-primary" />
        </button>
        <h1 className="font-display text-base font-medium text-text-primary">Registrar donación</h1>
        <span aria-hidden="true" className="size-6" />
      </div>

      <DonacionForm action={action} />
    </div>
  );
}
