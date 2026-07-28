import { Pencil, Mountain } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Avatar } from "@/components/Avatar";
import { TierBadge } from "@/components/TierBadge";
import { PrimaryButton } from "@/components/PrimaryButton";
import { SecondaryButton } from "@/components/SecondaryButton";
import { displayName } from "@/features/profile/displayName";
import Link from "next/link";
import { redirect } from "next/navigation";
import { TouristMenu } from "./TouristMenu";

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
      <div className="flex flex-col gap-4 pt-2 px-5 pb-5">
        <div className="flex justify-between items-center">
          <h1 className="font-display text-2xl font-bold text-text-primary">Mi perfil</h1>
          <Pencil size={20} className="text-text-secondary" />
        </div>

        <div className="rounded-[24px] bg-surface border border-border p-4 flex items-center gap-3.5">
          <Avatar
            name={name || "Usuario"}
            src={profile.avatar_url}
            size="lg"
            className="size-[60px]"
          />
          <div className="flex flex-col gap-1.5 min-w-0">
            <span className="font-display text-lg font-bold text-text-primary truncate">
              {name || "Sin nombre"}
            </span>
            <div className="flex items-center gap-2">
              <div className="rounded-pill bg-text-muted/20 px-[10px] py-1">
                <span className="font-body text-xs text-text-muted">{profile.email}</span>
              </div>
            </div>
            <TierBadge tier={profile.tier} />
          </div>
        </div>

        <div className="rounded-[22px] bg-gradient-to-br from-brand-mint to-brand-blue p-[18px] flex flex-col gap-3">
          <div className="flex items-center gap-2.5">
            <Mountain size={22} className="text-on-primary shrink-0" />
            <span className="font-display text-[17px] font-bold text-on-primary">
              Todavía sos Tourist
            </span>
          </div>

          <p className="font-body text-[13px] text-on-primary/[0.88] leading-relaxed">
            Sumate como Serrano para aparecer en el plantel, crear eventos y participar de los
            proyectos.
          </p>

          <div className="rounded-pill bg-on-primary h-[46px] flex items-center justify-center w-full">
            <span className="font-display text-[15px] font-semibold text-brand-blue">
              Solicitar ser Serrano
            </span>
          </div>
        </div>

        <TouristMenu />
      </div>
    );
  }

  const isReadOnly = isTourist;

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
