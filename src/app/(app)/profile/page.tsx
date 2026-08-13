import Link from "next/link";
import { Pencil, Mountain } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Avatar } from "@/components/Avatar";
import { TierBadge } from "@/components/TierBadge";
import { RoleChip } from "@/components/RoleChip";
import { displayName } from "@/features/profile/displayName";
import { redirect } from "next/navigation";
import { TouristMenu } from "./TouristMenu";
import { SerranoMenu } from "./SerranoMenu";

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
          <Link
            href="/solicitar"
            className="rounded-pill bg-on-primary h-[46px] flex items-center justify-center w-full"
          >
            <span className="font-display text-[15px] font-semibold text-brand-blue">
              Solicitar ser Serrano
            </span>
          </Link>
        </div>

        <TouristMenu />
      </div>
    );
  }

  const tierLabel = profile.tier.charAt(0).toUpperCase() + profile.tier.slice(1);

  const dispMap: Record<string, string> = {
    disponible: "Disponible",
    ocupado: "Ocupado",
    solo_eventos: "Solo eventos",
  };
  const visMap: Record<string, string> = {
    publica: "Pública",
    privada: "Privada",
  };

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
            <div className="rounded-pill bg-primary/10 px-[10px] py-1">
              <span className="font-body text-xs text-text-muted">{profile.email}</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <RoleChip label={tierLabel} />
          </div>
        </div>
      </div>

      <SerranoMenu
        disponibilidad={profile.disponibilidad ? dispMap[profile.disponibilidad] : null}
        visibilidadTarifa={profile.visibilidad_tarifa ? visMap[profile.visibilidad_tarifa] : null}
      />
    </div>
  );
}
