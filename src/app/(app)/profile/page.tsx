import { createClient } from "@/lib/supabase/server";
import { Avatar } from "@/components/Avatar";
import { TierBadge } from "@/components/TierBadge";
import { PlatformAdminBadge } from "@/components/PlatformAdminBadge";
import { displayName } from "@/features/profile/displayName";
import { redirect } from "next/navigation";
import { TouristMenu } from "./TouristMenu";
import { SerranoMenu } from "./SerranoMenu";
import { PendingMembershipCard } from "./PendingMembershipCard";
import { MemberConfirmedNotice } from "@/features/membership/MemberConfirmedNotice";
import { recentMemberConfirmation } from "@/features/membership/member-confirmed";
import { SerSerranoCta } from "@/features/membership/SerSerranoCta";
import { MEMBERSHIP_REQUEST_ACTIVE_ESTADOS } from "@/features/membership/request-state";

export default async function ProfilePage() {
  const supabase = await createClient();
  const now = new Date();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "id, email, nombre, apellido, apodo, nombre_visible, avatar_url, tier, is_platform_admin",
    )
    .eq("id", user.id)
    .single();

  if (!profile) {
    redirect("/onboarding/step1");
  }

  const name = displayName(profile);
  const isTourist = profile.tier === "tourist";

  if (isTourist) {
    // Pending membership: keep tourist shell; only swap the membership CTA card.
    // Read errors fail closed (show CTA shell, never invent pending).
    const { data: pendingRequest, error: pendingError } = await supabase
      .from("membership_requests")
      .select("id, estado")
      .eq("profile_id", user.id)
      .in("estado", MEMBERSHIP_REQUEST_ACTIVE_ESTADOS)
      .limit(1)
      .maybeSingle();

    const activeRequest = pendingError ? null : pendingRequest;

    return (
      <div className="flex flex-col gap-4">
        <h1 className="font-display text-2xl font-bold text-text-primary">Mi perfil</h1>

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
            <div className="flex items-center gap-1.5 flex-wrap">
              <TierBadge tier={profile.tier} />
              {profile.is_platform_admin === true ? <PlatformAdminBadge /> : null}
            </div>
          </div>
        </div>

        {activeRequest ? (
          <PendingMembershipCard estado={activeRequest.estado} />
        ) : (
          <SerSerranoCta />
        )}

        <TouristMenu />
      </div>
    );
  }

  const [{ count: aportesCount }, { count: proyectosCount }, { data: approvedRequest }] =
    await Promise.all([
      supabase
        .from("aportes")
        .select("id", { count: "exact", head: true })
        .eq("profile_id", user.id),
      supabase
        .from("project_members")
        .select("project_id", { count: "exact", head: true })
        .eq("profile_id", user.id)
        .eq("estado", "aprobado"),
      recentMemberConfirmation(supabase, user.id, now),
    ]);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-display text-2xl font-bold text-text-primary">Mi perfil</h1>

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
            <TierBadge tier={profile.tier} />
            {profile.is_platform_admin === true ? <PlatformAdminBadge /> : null}
          </div>
        </div>
      </div>

      {approvedRequest ? <MemberConfirmedNotice /> : null}

      <SerranoMenu
        aportesCount={aportesCount ?? 0}
        proyectosCount={proyectosCount ?? 0}
        isPlatformAdmin={profile.is_platform_admin === true}
      />
    </div>
  );
}
