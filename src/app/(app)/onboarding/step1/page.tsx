import { createClient } from "@/lib/supabase/server";
import { Step1Form } from "./Step1Form";

export const dynamic = "force-dynamic";

export default async function OnboardingStep1() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // El gate del proxy ya garantiza sesión; esto es sólo para prellenar.
  const { data: profile } = user
    ? await supabase
        .from("profiles")
        .select("nombre, apellido, apodo, fecha_nacimiento, avatar_url")
        .eq("id", user.id)
        .single()
    : { data: null };

  return (
    <Step1Form
      defaults={{
        nombre: profile?.nombre,
        apellido: profile?.apellido,
        apodo: profile?.apodo,
        fecha_nacimiento: profile?.fecha_nacimiento,
      }}
      avatarUrl={profile?.avatar_url}
    />
  );
}
