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

/** Estados a project can be created with: not Terminado nor Pausado, which is what archiving means (ZER-201). */
export const PROJECT_CREATE_ESTADOS = PROJECT_ESTADOS.filter(
  (estado): estado is Exclude<ProjectEstado, "terminado" | "pausado"> =>
    estado !== "terminado" && estado !== "pausado",
);

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
  {
    value: "cerrado",
    label: "Cerrado",
    description: "No acepta gente nueva por ahora",
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
  /** Viewer is project admin — may edit metadata and archive. */
  canEdit: boolean;
  /** Viewer is an approved member — may leave the project (ZER-200). */
  canLeave: boolean;
  /** archivado_en is set: shown as Archivado · Pausado (ZER-201). */
  archived: boolean;
};
