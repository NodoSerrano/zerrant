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
  | { kind: "join"; label: "Unirse" | "Solicitar ingreso" }
  | { kind: "pending"; label: "Solicitud pendiente" }
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

  if (ingreso === "aprobacion") {
    return { kind: "join", label: "Solicitar ingreso" };
  }

  return { kind: "join", label: "Unirse" };
}

export function isProjectAdmin({
  viewerMembership,
}: {
  viewerMembership: ViewerMembership | null;
}): boolean {
  return viewerMembership?.estado === "aprobado" && viewerMembership.rol === "admin";
}
