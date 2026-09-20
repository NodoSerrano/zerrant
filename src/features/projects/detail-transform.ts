import type { ProjectMemberRol } from "@/lib/db/projects-schema";
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

export function memberDisplayName(profile: RawProfile | null | undefined): string {
  if (!profile) return "?";
  if (profile.nombre_visible?.trim()) return profile.nombre_visible.trim();
  if (profile.apodo?.trim()) return profile.apodo.trim();
  const full = [profile.nombre, profile.apellido].filter(Boolean).join(" ").trim();
  return full || "?";
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
