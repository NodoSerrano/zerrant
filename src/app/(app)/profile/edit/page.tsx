import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { EditProfileForm } from "./EditProfileForm";

export const dynamic = "force-dynamic";

export default async function EditProfilePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "nombre, apellido, apodo, nombre_visible, fecha_nacimiento, bio, contacto_telegram, sitio_url, disponibilidad, visibilidad_tarifa, tarifa_hora, avatar_url",
    )
    .eq("id", user.id)
    .single();

  if (!profile) {
    redirect("/onboarding/step1");
  }

  return <EditProfileForm defaults={profile} />;
}
