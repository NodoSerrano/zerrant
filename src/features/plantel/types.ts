export type SerranoTier = "scholar" | "standard" | "founder";

export type Disponibilidad = "disponible" | "ocupado" | "solo_eventos";

export type SerranoMember = {
  id: string;
  name: string;
  nombre: string | null;
  apellido: string | null;
  apodo: string | null;
  avatarUrl: string | null;
  tier: SerranoTier;
  disponibilidad: Disponibilidad | null;
  roles: string[];
  skills: string[];
};

export type PlantelFilters = {
  q: string;
  soloDisponibles: boolean;
  rol: string | null;
  skill: string | null;
};

export type SerranoMemberDetail = {
  id: string;
  name: string;
  avatarUrl: string | null;
  tier: SerranoTier;
  disponibilidad: Disponibilidad | null;
  roles: string[];
  skills: string[];
  bio: string | null;
  tarifaHora: number | null;
  telegramHref: string | null;
};
