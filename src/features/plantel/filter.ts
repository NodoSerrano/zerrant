import type { PlantelFilters, SerranoMember } from "./types";

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function matchesQuery(member: SerranoMember, q: string): boolean {
  const needle = normalize(q);
  if (!needle) return true;
  const fields = [member.name, member.nombre, member.apellido, member.apodo, ...member.skills];
  return fields.some((field) => Boolean(field) && field!.toLowerCase().includes(needle));
}

export function filterSerranos(members: SerranoMember[], filters: PlantelFilters): SerranoMember[] {
  const rol = normalize(filters.rol ?? "");
  const skill = normalize(filters.skill ?? "");

  return members.filter((member) => {
    if (!matchesQuery(member, filters.q)) return false;
    if (filters.soloDisponibles && member.disponibilidad !== "disponible") return false;
    if (rol && !member.roles.some((item) => item.toLowerCase() === rol)) return false;
    if (skill && !member.skills.some((item) => item.toLowerCase() === skill)) return false;
    return true;
  });
}

export function availableRoles(members: SerranoMember[]): string[] {
  return Array.from(new Set(members.flatMap((member) => member.roles))).sort((a, b) =>
    a.localeCompare(b),
  );
}

export function availableSkills(members: SerranoMember[]): string[] {
  return Array.from(new Set(members.flatMap((member) => member.skills))).sort((a, b) =>
    a.localeCompare(b),
  );
}
