import type { ProjectEstado, ProjectIngreso } from "@/lib/db/projects-schema";

export const PROJECT_ESTADO_BADGE = {
  idea: { label: "Idea", bg: "bg-blue-raw/20", text: "text-brand-blue" },
  en_curso: { label: "En curso", bg: "bg-brand-green/20", text: "text-brand-green" },
  pausado: { label: "Pausado", bg: "bg-surface-inset", text: "text-text-muted" },
  terminado: { label: "Terminado", bg: "bg-mint-raw/20", text: "text-brand-mint" },
} as const satisfies Record<ProjectEstado, { label: string; bg: string; text: string }>;

export type ProjectEstadoBadge = (typeof PROJECT_ESTADO_BADGE)[keyof typeof PROJECT_ESTADO_BADGE];

export function getProjectEstadoBadge(estado: string): ProjectEstadoBadge {
  return PROJECT_ESTADO_BADGE[estado as ProjectEstado] ?? PROJECT_ESTADO_BADGE.idea;
}

export const PROJECT_INGRESO_LABEL = {
  abierto: "Abierto",
  aprobacion: "Por aprobación",
} as const satisfies Record<ProjectIngreso, string>;

export function getProjectIngresoLabel(ingreso: string): string {
  return PROJECT_INGRESO_LABEL[ingreso as ProjectIngreso] ?? PROJECT_INGRESO_LABEL.abierto;
}

export function isProjectIngresoApproval(ingreso: string): boolean {
  return ingreso === "aprobacion";
}
