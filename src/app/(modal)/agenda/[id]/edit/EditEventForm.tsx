"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { EventForm } from "@/features/events/EventForm";
import { EventDeleteControl } from "@/features/events/EventDeleteControl";
import { updateEvent } from "@/features/events/actions";
import type { EventFormDefaults } from "@/features/events/types";

interface EditEventFormProps {
  eventId: string;
  defaults: EventFormDefaults;
}

export function EditEventForm({ eventId, defaults }: EditEventFormProps) {
  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex items-center justify-between">
        <Link
          href={`/agenda/${eventId}`}
          aria-label="Volver al evento"
          className="flex items-center justify-center rounded-md focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          <ChevronLeft className="size-6 text-text-primary" />
        </Link>
        <h1 className="font-display text-base font-medium text-text-primary">Editar evento</h1>
        <span aria-hidden="true" className="size-6" />
      </div>

      <EventForm
        action={updateEvent}
        submitLabel="Guardar cambios"
        pendingLabel="Guardando..."
        defaults={defaults}
        hiddenFields={{ eventId }}
      />

      <div className="flex justify-center pt-1">
        <EventDeleteControl eventId={eventId} />
      </div>
    </div>
  );
}
