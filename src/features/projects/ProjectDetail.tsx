import Link from "next/link";
import { ChevronLeft, Lock } from "lucide-react";
import { Avatar } from "@/components/Avatar";
import { PrimaryButton } from "@/components/PrimaryButton";
import {
  getProjectEstadoBadge,
  getProjectIngresoLabel,
  isProjectIngresoApproval,
} from "@/features/projects/projectDisplay";
import { cn } from "@/lib/utils";
import type { ProjectDetailViewModel } from "./types";

export function ProjectDetail({ project }: { project: ProjectDetailViewModel }) {
  const badge = getProjectEstadoBadge(project.estado);
  const ingresoLabel = getProjectIngresoLabel(project.ingreso);
  const approval = isProjectIngresoApproval(project.ingreso);
  const memberCount = project.members.length;

  return (
    <div className="flex w-full flex-col gap-[18px]">
      <div className="flex items-center justify-between w-full">
        <Link
          href="/nodo/projects"
          aria-label="Volver a proyectos"
          className="flex items-center justify-center"
        >
          <ChevronLeft size={24} className="text-text-primary" />
        </Link>
        <span className="font-display text-base font-medium text-text-primary">Proyecto</span>
        {/* Spacer keeps the title optically centered (Pencil shows ellipsis; dead affordance out). */}
        <span aria-hidden="true" className="size-[22px]" />
      </div>

      <div className="flex flex-col gap-2.5 w-full">
        <h1 className="font-display text-2xl font-bold text-text-primary w-full">
          {project.nombre}
        </h1>
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={cn(
              "rounded-pill px-[11px] py-[5px] font-display text-xs font-semibold",
              badge.bg,
              badge.text,
            )}
          >
            {badge.label}
          </span>
          <span className="inline-flex items-center gap-[5px] rounded-pill bg-surface-inset px-[11px] py-[5px]">
            {approval ? <Lock size={13} className="text-text-muted" aria-hidden="true" /> : null}
            <span className="font-body text-xs text-text-secondary">{ingresoLabel}</span>
          </span>
        </div>
      </div>

      {project.descripcion?.trim() ? (
        <p className="font-body text-sm leading-normal text-text-secondary w-full">
          {project.descripcion}
        </p>
      ) : null}

      <section className="flex flex-col gap-2.5 w-full">
        <div className="flex items-center justify-between w-full">
          <h2 className="font-display text-[17px] font-medium text-text-primary">Miembros</h2>
          <span className="font-body text-sm text-text-muted">{memberCount}</span>
        </div>

        <ul className="flex flex-col gap-2.5 w-full list-none p-0 m-0">
          {project.members.map((member) => (
            <li
              key={member.profileId}
              className="flex items-center gap-3 w-full rounded-[18px] bg-surface border border-border px-3 py-3.5"
            >
              <Avatar
                name={member.name}
                src={member.avatarUrl}
                size="sm"
                className="size-10 text-lg"
              />
              <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                <span className="font-display text-[15px] font-medium text-text-primary truncate">
                  {member.name}
                </span>
                <span className="font-body text-xs text-text-muted">
                  {member.isCreator ? "Creó el proyecto" : "Miembro"}
                </span>
              </div>
              {member.rol === "admin" ? (
                <span className="shrink-0 rounded-pill bg-blue-raw/20 px-2.5 py-1 font-display text-[11px] font-semibold text-brand-blue">
                  Admin
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      </section>

      {project.showRequestsQueue ? (
        <Link
          href={`/nodo/projects/${project.id}/requests`}
          className="font-display text-sm font-semibold text-brand-green underline-offset-2 hover:underline self-start"
        >
          Solicitudes de ingreso
        </Link>
      ) : null}

      {project.affordance.kind === "join" ? (
        <PrimaryButton type="button" className="w-full" disabled>
          {project.affordance.label}
        </PrimaryButton>
      ) : null}

      {project.affordance.kind === "pending" ? (
        <p className="font-body text-sm text-text-muted text-center w-full">
          {project.affordance.label}
        </p>
      ) : null}
    </div>
  );
}
