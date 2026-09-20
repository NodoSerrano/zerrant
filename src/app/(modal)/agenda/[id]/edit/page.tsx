import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { eventFormDefaultsFromRow } from "@/features/events/day";
import { EditEventForm } from "./EditEventForm";

export const dynamic = "force-dynamic";

const EVENT_SELECT = "id, titulo, descripcion, lugar, inicio, fin, creado_por";

export default async function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: event } = await supabase
    .from("events")
    .select(EVENT_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (!event) notFound();

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_platform_admin")
    .eq("id", user.id)
    .maybeSingle();

  const isCreator = event.creado_por === user.id;
  const isPlatformAdmin = profile?.is_platform_admin === true;

  // UX only — RLS still rejects unauthorized update/delete on direct POST.
  if (!isCreator && !isPlatformAdmin) {
    redirect(`/agenda/${id}`);
  }

  return <EditEventForm eventId={event.id} defaults={eventFormDefaultsFromRow(event)} />;
}
