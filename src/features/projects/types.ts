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
