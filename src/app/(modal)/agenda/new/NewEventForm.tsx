"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { EventForm } from "@/features/events/EventForm";
import { createEvent } from "@/features/events/actions";

export function NewEventForm() {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <Link
          href="/agenda"
          aria-label="Volver a la agenda"
          className="flex size-10 items-center justify-center rounded-full focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          <ChevronLeft className="size-6 text-text-primary" />
        </Link>
        <h1 className="font-display text-base font-medium text-text-primary">Nuevo evento</h1>
        <span aria-hidden="true" className="size-10" />
      </div>

      <EventForm action={createEvent} submitLabel="Publicar evento" pendingLabel="Publicando..." />
    </div>
  );
}
