import type {
  ProjectIngreso,
  ProjectMemberEstado,
  ProjectMemberRol,
} from "@/lib/db/projects-schema";

export type ViewerMembership = {
  estado: ProjectMemberEstado;
  rol: ProjectMemberRol;
};

export type JoinAffordance =
  | { kind: "join"; label: "Unirme" | "Solicitar unirme" }
  | { kind: "pending"; label: "Solicitud pendiente" }
  /** ingreso cerrado: the project does not take people (ZER-151). */
  | { kind: "closed"; label: "Cerrado" }
  | { kind: "none" };

export function resolveJoinAffordance({
  ingreso,
  viewerMembership,
}: {
  ingreso: ProjectIngreso | string;
  viewerMembership: ViewerMembership | null;
}): JoinAffordance {
  if (viewerMembership?.estado === "aprobado") {
    return { kind: "none" };
  }

  if (viewerMembership?.estado === "pendiente") {
    return { kind: "pending", label: "Solicitud pendiente" };
  }

  if (ingreso === "cerrado") {
    return { kind: "closed", label: "Cerrado" };
  }

  if (ingreso === "aprobacion") {
    return { kind: "join", label: "Solicitar unirme" };
  }

  return { kind: "join", label: "Unirme" };
}

export function isProjectAdmin({
  viewerMembership,
}: {
  viewerMembership: ViewerMembership | null;
}): boolean {
  return viewerMembership?.estado === "aprobado" && viewerMembership.rol === "admin";
}
