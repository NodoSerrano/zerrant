type MemberAccessInput = {
  profile: { tier?: string | null; is_platform_admin?: boolean | null } | null;
  userId: string | null;
};

/**
 * Proyectos y Tareas are members-only (ZER-107). The Actividad tab and the /nodo gate ask
 * this same question from the same cached profile read, so they cannot disagree (ZER-206).
 * Platform admins count as members. An unreadable profile soft-allows, like the onboarding
 * gate: RLS still decides what the lists return.
 */
export function hasMemberAccess({ profile, userId }: MemberAccessInput): boolean {
  if (!userId) return false;
  if (!profile) return true;
  return profile.tier !== "tourist" || Boolean(profile.is_platform_admin);
}
