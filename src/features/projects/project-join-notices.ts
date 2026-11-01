/**
 * ZER-202 — pure helpers for join decision notices on Inicio.
 * Persistence lives on project_members (decidido_*, aviso_visto_en, motivo_rechazo).
 */

export type RawProjectJoinNoticeRow = {
  project_id: string;
  profile_id: string;
  estado: string;
  motivo_rechazo: string | null;
  decidido_en: string | null;
  decidido_por: string | null;
  aviso_visto_en: string | null;
  projects?: { id: string; nombre: string } | { id: string; nombre: string }[] | null;
};

export type ProjectJoinNoticeViewModel = {
  projectId: string;
  projectName: string;
  kind: "aprobada" | "rechazada";
  message: string;
  href: string;
};

function projectOf(row: RawProjectJoinNoticeRow): { id: string; nombre: string } | null {
  if (Array.isArray(row.projects)) return row.projects[0] ?? null;
  return row.projects ?? null;
}

/**
 * Rows the viewer should see on Inicio as undismissed join outcomes.
 * - Only aprobado/rechazado with a decision timestamp and no dismiss.
 * - Skip self-join spam: aprobado without decidido_por (or decidido_por === profile).
 */
export function toProjectJoinNotices(
  rows: RawProjectJoinNoticeRow[] | null | undefined,
  viewerProfileId: string,
): ProjectJoinNoticeViewModel[] {
  return (rows ?? [])
    .filter((row) => {
      if (row.profile_id !== viewerProfileId) return false;
      if (row.aviso_visto_en) return false;
      if (!row.decidido_en) return false;
      if (row.estado !== "aprobado" && row.estado !== "rechazado") return false;
      if (row.estado === "aprobado") {
        if (!row.decidido_por || row.decidido_por === viewerProfileId) return false;
      }
      if (row.estado === "rechazado" && !row.motivo_rechazo?.trim()) return false;
      return true;
    })
    .map((row) => {
      const project = projectOf(row);
      const projectId = row.project_id || project?.id || "";
      const projectName = project?.nombre?.trim() || "un proyecto";
      const href = `/nodo/projects/${projectId}`;
      if (row.estado === "rechazado") {
        const motivo = row.motivo_rechazo!.trim();
        return {
          projectId,
          projectName,
          kind: "rechazada" as const,
          message: `No entraste a ${projectName}: ${motivo}`,
          href,
        };
      }
      return {
        projectId,
        projectName,
        kind: "aprobada" as const,
        message: `Te sumaron a ${projectName}`,
        href,
      };
    });
}
