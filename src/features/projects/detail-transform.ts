import type { ProjectMemberRol } from "@/lib/db/projects-schema";
import { displayName } from "@/features/profile/displayName";
import type { NombreVisible } from "@/features/profile/types";
import type { ProjectDetailMember } from "./types";

export type RawProfile = {
  id?: string | null;
  nombre: string | null;
  apellido: string | null;
  apodo: string | null;
  nombre_visible: string | null;
  avatar_url: string | null;
};

export type RawProjectMember = {
  profile_id: string;
  estado: string;
  rol: string;
  profiles: RawProfile | RawProfile[] | null;
};

const NOMBRE_VISIBLE_VALUES = new Set<NombreVisible>([
  "nombre_apellido",
  "apellido_nombre",
  "apodo",
]);

function asNombreVisible(value: string | null | undefined): NombreVisible {
  if (value && NOMBRE_VISIBLE_VALUES.has(value as NombreVisible)) {
    return value as NombreVisible;
  }
  return "nombre_apellido";
}

export function memberDisplayName(profile: RawProfile | null | undefined): string {
  if (!profile) return "?";
  const name = displayName({
    nombre: profile.nombre,
    apellido: profile.apellido,
    apodo: profile.apodo,
    nombre_visible: asNombreVisible(profile.nombre_visible),
  }).trim();
  return name || "?";
}

/** Keep only aprobado rows — pendiente is the join queue, never membership. */
export function toApprovedProjectMembers(
  rows: RawProjectMember[] | null | undefined,
  creadoPor: string | null,
): ProjectDetailMember[] {
  return (rows ?? [])
    .filter((row) => row.estado === "aprobado")
    .map((row) => {
      const profile = Array.isArray(row.profiles) ? (row.profiles[0] ?? null) : row.profiles;
      const profileId = row.profile_id || profile?.id || "";
      return {
        profileId,
        name: memberDisplayName(profile),
        avatarUrl: profile?.avatar_url ?? null,
        rol: (row.rol === "admin" ? "admin" : "miembro") as ProjectMemberRol,
        isCreator: Boolean(creadoPor && profileId === creadoPor),
      };
    });
}
