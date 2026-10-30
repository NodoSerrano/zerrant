import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { InterviewSlotPicker } from "@/features/membership/InterviewSlotPicker";
import { isBookableInterviewEstado } from "@/features/membership/interview-slots";
import { formatDayKey, formatEventTimeRange } from "@/features/events/day";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function EntrevistaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/login");
  }

  const { data: request } = await supabase
    .from("membership_requests")
    .select("id, estado")
    .eq("profile_id", user.id)
    .in("estado", [
      "pendiente_coordinacion",
      "entrevista_solicitada",
      "entrevista_coordinada",
      "reprogramacion",
      "entrevista_realizada",
    ])
    .limit(1)
    .maybeSingle();

  if (!request) {
    redirect("/solicitar");
  }

  const { data: booking } = await supabase
    .from("interview_bookings")
    .select("id, interview_slots(starts_at, ends_at)")
    .eq("request_id", request.id)
    .maybeSingle();

  const slotEmbed = booking?.interview_slots;
  const bookedSlot = Array.isArray(slotEmbed) ? slotEmbed[0] : slotEmbed;

  const { data: availability } = await supabase
    .from("interview_slot_availability")
    .select("id, starts_at, ends_at, booked")
    .eq("booked", false)
    .gt("starts_at", new Date().toISOString())
    .order("starts_at", { ascending: true });

  const openSlots = (availability ?? []).flatMap((row) =>
    row.id && row.starts_at && row.ends_at
      ? [{ id: row.id, starts_at: row.starts_at, ends_at: row.ends_at }]
      : [],
  );

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <Link
          href="/profile"
          aria-label="Volver al perfil"
          className="-ml-2.5 inline-flex size-11 shrink-0 items-center justify-center"
        >
          <ChevronLeft className="size-6 text-text-primary" />
        </Link>
        <h1 className="font-display text-[22px] font-bold text-text-primary">
          Horario de entrevista
        </h1>
      </div>
      {bookedSlot ? (
        <p className="font-body text-[14px] text-text-secondary leading-relaxed">
          Reservaste {formatDayKey(new Date(bookedSlot.starts_at))} ·{" "}
          {formatEventTimeRange(bookedSlot.starts_at, bookedSlot.ends_at)}. Si necesitás cambiarlo,
          un admin te va a reprogramar.
        </p>
      ) : isBookableInterviewEstado(request.estado) ? (
        <InterviewSlotPicker slots={openSlots} />
      ) : (
        <p className="font-body text-[14px] text-text-secondary">
          Este estado ya no admite una reserva nueva.
        </p>
      )}
    </div>
  );
}
