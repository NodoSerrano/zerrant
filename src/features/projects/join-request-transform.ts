import { memberDisplayName, type RawProfile } from "./detail-transform";

export type RawJoinRequestRow = {
  profile_id: string;
  estado: string;
  created_at?: string | null;
  profiles: RawProfile | RawProfile[] | null;
};

export type JoinRequestViewModel = {
  profileId: string;
  name: string;
  avatarUrl: string | null;
  subtitle: string | null;
  createdAt: string | null;
};

function profileOf(row: RawJoinRequestRow): RawProfile | null {
  if (Array.isArray(row.profiles)) return row.profiles[0] ?? null;
  return row.profiles;
}

/** Only pendiente rows belong on the join-request queue. */
export function toJoinRequestQueue(
  rows: RawJoinRequestRow[] | null | undefined,
): JoinRequestViewModel[] {
  return (rows ?? [])
    .filter((row) => row.estado === "pendiente")
    .map((row) => {
      const profile = profileOf(row);
      const profileId = row.profile_id || profile?.id || "";
      return {
        profileId,
        name: memberDisplayName(profile),
        avatarUrl: profile?.avatar_url ?? null,
        subtitle: null,
        createdAt: row.created_at ?? null,
      };
    });
}

export function joinRequestCountLabel(count: number): string {
  if (count === 1) return "1 pedido para unirse al proyecto";
  return `${count} pedidos para unirse al proyecto`;
}

export function joinRequestMetaLabel(createdAt: string | null | undefined): string {
  if (!createdAt) return "Quiere unirse";
  return `Quiere unirse · ${timeAgo(createdAt)}`;
}

function timeAgo(date: string): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (Number.isNaN(seconds) || seconds < 60) return "ahora";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours} ${hours === 1 ? "hora" : "horas"}`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `hace ${days} ${days === 1 ? "día" : "días"}`;
  const weeks = Math.floor(days / 7);
  return `hace ${weeks} ${weeks === 1 ? "semana" : "semanas"}`;
}
