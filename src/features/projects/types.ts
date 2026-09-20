import {
  PROJECT_ESTADOS,
  PROJECT_INGRESOS,
  PROJECT_MEMBER_ESTADOS,
  PROJECT_MEMBER_ROLES,
  type ProjectEstado,
  type ProjectIngreso,
  type ProjectMemberEstado,
  type ProjectMemberRol,
} from "@/lib/db/projects-schema";
import type { JoinAffordance } from "./membership";

export {
  PROJECT_ESTADOS,
  PROJECT_INGRESOS,
  PROJECT_MEMBER_ESTADOS,
  PROJECT_MEMBER_ROLES,
  type ProjectEstado,
  type ProjectIngreso,
  type ProjectMemberEstado,
  type ProjectMemberRol,
};

export const PROJECT_ESTADO_OPTIONS = [
  { value: "idea", label: "Idea" },
  { value: "en_curso", label: "En curso" },
  { value: "pausado", label: "Pausado" },
  { value: "terminado", label: "Terminado" },
] as const satisfies ReadonlyArray<{ value: ProjectEstado; label: string }>;

export const PROJECT_INGRESO_OPTIONS = [
  {
    value: "abierto",
    label: "Abierto",
    description: "Cualquier serrano se une al toque",
  },
  {
    value: "aprobacion",
    label: "Por aprobación",
    description: "Vos aprobás cada ingreso",
  },
] as const satisfies ReadonlyArray<{
  value: ProjectIngreso;
  label: string;
  description: string;
}>;

export type ProjectDetailMember = {
  profileId: string;
  name: string;
  avatarUrl: string | null;
  rol: ProjectMemberRol;
  isCreator: boolean;
};

export type ProjectDetailViewModel = {
  id: string;
  nombre: string;
  descripcion: string | null;
  estado: ProjectEstado | string;
  ingreso: ProjectIngreso | string;
  members: ProjectDetailMember[];
  affordance: JoinAffordance;
  showRequestsQueue: boolean;
  /** Viewer is project admin — may promote aprobado miembros. */
  canPromoteMembers: boolean;
};
