import type { Disponibilidad, SerranoMember, SerranoTier } from "./types";

type ProfileRow = {
  id: string;
  nombre: string | null;
  apellido: string | null;
  apodo: string | null;
  nombre_visible: "apodo" | "nombre_apellido" | "apellido_nombre";
  avatar_url: string | null;
  tier: "tourist" | "scholar" | "standard" | "founder";
  disponibilidad: Disponibilidad | null;
};

type RoleAssignment = { profile_id: string; roles: { nombre: string } | null };
type SkillAssignment = { profile_id: string; skills: { nombre: string } | null };

const AVAILABILITY_LABELS: Record<Disponibilidad, string> = {
  disponible: "Disponible",
  ocupado: "Ocupado",
  solo_eventos: "Solo eventos",
};

export function availabilityLabel(disponibilidad: Disponibilidad | null): string | null {
  if (!disponibilidad) return null;
  return AVAILABILITY_LABELS[disponibilidad];
}

function visibleName(profile: ProfileRow): string {
  switch (profile.nombre_visible) {
    case "apodo":
      if (profile.apodo) return profile.apodo;
      return [profile.nombre, profile.apellido].filter(Boolean).join(" ");
    case "apellido_nombre":
      return [profile.apellido, profile.nombre].filter(Boolean).join(" ");
    case "nombre_apellido":
    default:
      return [profile.nombre, profile.apellido].filter(Boolean).join(" ");
  }
}

export function buildSerranoMembers(
  profiles: ProfileRow[],
  roleAssignments: RoleAssignment[],
  skillAssignments: SkillAssignment[],
): SerranoMember[] {
  const rolesByProfile = new Map<string, string[]>();
  for (const assignment of roleAssignments) {
    if (!assignment.roles?.nombre) continue;
    const roles = rolesByProfile.get(assignment.profile_id) ?? [];
    roles.push(assignment.roles.nombre);
    rolesByProfile.set(assignment.profile_id, roles);
  }

  const skillsByProfile = new Map<string, string[]>();
  for (const assignment of skillAssignments) {
    if (!assignment.skills?.nombre) continue;
    const skills = skillsByProfile.get(assignment.profile_id) ?? [];
    skills.push(assignment.skills.nombre);
    skillsByProfile.set(assignment.profile_id, skills);
  }

  return profiles
    .filter((profile) => profile.tier !== "tourist")
    .map((profile) => ({
      id: profile.id,
      name: visibleName(profile),
      nombre: profile.nombre,
      apellido: profile.apellido,
      apodo: profile.apodo,
      avatarUrl: profile.avatar_url,
      tier: profile.tier as SerranoTier,
      disponibilidad: profile.disponibilidad,
      roles: rolesByProfile.get(profile.id) ?? [],
      skills: skillsByProfile.get(profile.id) ?? [],
    }));
}
