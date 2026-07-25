import { createClient } from "@/lib/supabase/server";
import { Avatar } from "@/components/Avatar";
import { TierBadge } from "@/components/TierBadge";
import { PrimaryButton } from "@/components/PrimaryButton";
import { SecondaryButton } from "@/components/SecondaryButton";
import { displayName } from "@/features/profile/displayName";
import { TouristProfile } from "@/features/profile/tourist-profile";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function ProfilePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();

  if (!profile) {
    redirect("/onboarding/step1");
  }

  const name = displayName(profile);
  const isTourist = profile.tier === "tourist";

  if (isTourist) {
    return (
      <TouristProfile name={name || "Usuario"} avatarUrl={profile.avatar_url} email={user.email ?? ""} />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-text-primary">Perfil</h1>
          {isReadOnly && (
            <p className="text-xs text-warm-yellow bg-warm-yellow/10 rounded-md px-2 py-0.5 mt-1 inline-block">
              Modo lectura — Tourist
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-col items-center gap-4 py-4">
        <Avatar name={name || "Usuario"} src={profile.avatar_url} size="lg" />
        <div className="text-center">
          <h2 className="font-display text-xl font-bold text-text-primary">
            {name || "Sin nombre"}
          </h2>
          {profile.apodo && profile.nombre_visible !== "apodo" && (
            <p className="text-sm text-text-muted">@{profile.apodo}</p>
          )}
          <div className="mt-2">
            <TierBadge tier={profile.tier} />
          </div>
        </div>

        {!isReadOnly && (
          <Link href="/profile/edit">
            <SecondaryButton size="sm">Editar perfil</SecondaryButton>
          </Link>
        )}
      </div>

      {profile.bio && (
        <section>
          <h3 className="font-display text-sm font-semibold text-text-secondary mb-2">Bio</h3>
          <p className="text-sm text-text-primary leading-relaxed">{profile.bio}</p>
        </section>
      )}

      <section className="grid grid-cols-2 gap-3">
        {profile.nombre && <ProfileField label="Nombre" value={profile.nombre} />}
        {profile.apellido && <ProfileField label="Apellido" value={profile.apellido} />}
        {profile.fecha_nacimiento && (
          <ProfileField label="Nacimiento" value={profile.fecha_nacimiento} />
        )}
        {profile.nombre_visible && (
          <ProfileField
            label="Visible como"
            value={
              profile.nombre_visible === "apodo"
                ? "Apodo"
                : profile.nombre_visible === "nombre_apellido"
                  ? "Nombre Apellido"
                  : "Apellido Nombre"
            }
          />
        )}
      </section>

      {(profile.contacto_telegram || profile.sitio_url) && (
        <section>
          <h3 className="font-display text-sm font-semibold text-text-secondary mb-2">Contacto</h3>
          <div className="flex flex-col gap-2">
            {profile.contacto_telegram && (
              <ProfileField label="Telegram" value={profile.contacto_telegram} />
            )}
            {profile.sitio_url && <ProfileField label="Sitio" value={profile.sitio_url} />}
          </div>
        </section>
      )}

      <div className="flex flex-col gap-3 pt-4">
        <Link href="/">
          <PrimaryButton className="w-full">Ir al inicio</PrimaryButton>
        </Link>
      </div>
    </div>
  );
}

function ProfileField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-surface border border-border p-3">
      <p className="text-xs text-text-muted">{label}</p>
      <p className="text-sm text-text-primary font-medium mt-0.5">{value}</p>
    </div>
  );
}
