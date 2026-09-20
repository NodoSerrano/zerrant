"use client";

import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { EventForm } from "@/features/events/EventForm";
import { createEvent } from "@/features/events/actions";

export function NewEventForm() {
  const router = useRouter();

  return (
    <div className="flex flex-col gap-[18px]">
      <div className="flex items-center justify-between">
        <button
          type="button"
          aria-label="Cerrar"
          onClick={() => (window.history.length > 1 ? router.back() : router.push("/agenda"))}
          className="rounded-md focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          <X className="size-6 text-text-primary" />
        </button>
        <h1 className="font-display text-base font-medium text-text-primary">Nuevo evento</h1>
        <span aria-hidden="true" className="size-6" />
      </div>

      <EventForm action={createEvent} submitLabel="Publicar evento" pendingLabel="Publicando..." />
    </div>
  );
}
