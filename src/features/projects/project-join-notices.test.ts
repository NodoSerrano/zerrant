import { describe, expect, it } from "vitest";
import { toProjectJoinNotices, type RawProjectJoinNoticeRow } from "./project-join-notices";

const viewer = "viewer-1";

function row(overrides: Partial<RawProjectJoinNoticeRow> = {}): RawProjectJoinNoticeRow {
  return {
    project_id: "proj-1",
    profile_id: viewer,
    estado: "aprobado",
    motivo_rechazo: null,
    decidido_en: "2026-10-20T12:00:00Z",
    decidido_por: "admin-1",
    aviso_visto_en: null,
    projects: { id: "proj-1", nombre: "Huerta comun" },
    ...overrides,
  };
}

describe("toProjectJoinNotices", () => {
  it("maps approved decisions to Inicio copy with project link", () => {
    const notices = toProjectJoinNotices([row()], viewer);
    expect(notices).toEqual([
      {
        projectId: "proj-1",
        projectName: "Huerta comun",
        kind: "aprobada",
        message: "Te sumaron a Huerta comun",
        href: "/nodo/projects/proj-1",
      },
    ]);
  });

  it("maps rejected decisions including the rejection reason", () => {
    const notices = toProjectJoinNotices(
      [
        row({
          estado: "rechazado",
          motivo_rechazo: "El cupo ya está lleno",
          decidido_por: "admin-1",
        }),
      ],
      viewer,
    );
    expect(notices).toEqual([
      {
        projectId: "proj-1",
        projectName: "Huerta comun",
        kind: "rechazada",
        message: "No entraste a Huerta comun: El cupo ya está lleno",
        href: "/nodo/projects/proj-1",
      },
    ]);
  });

  it("hides notices already dismissed (aviso_visto_en set)", () => {
    const notices = toProjectJoinNotices([row({ aviso_visto_en: "2026-10-21T10:00:00Z" })], viewer);
    expect(notices).toEqual([]);
  });

  it("hides approved self-join spam without an admin decision", () => {
    expect(toProjectJoinNotices([row({ decidido_por: null })], viewer)).toEqual([]);
    expect(toProjectJoinNotices([row({ decidido_por: viewer })], viewer)).toEqual([]);
  });

  it("hides rows without decidido_en or non-decision estados", () => {
    expect(toProjectJoinNotices([row({ decidido_en: null })], viewer)).toEqual([]);
    expect(toProjectJoinNotices([row({ estado: "pendiente" })], viewer)).toEqual([]);
  });

  it("hides rejected rows without a non-empty motivo", () => {
    expect(
      toProjectJoinNotices([row({ estado: "rechazado", motivo_rechazo: "  " })], viewer),
    ).toEqual([]);
  });

  it("ignores rows that do not belong to the viewer", () => {
    expect(toProjectJoinNotices([row({ profile_id: "someone-else" })], viewer)).toEqual([]);
  });
});
