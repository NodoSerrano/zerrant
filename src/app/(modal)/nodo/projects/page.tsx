import Link from "next/link";
import { ChevronLeft, FolderOpen, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/EmptyState";
import { NodoTabs } from "@/components/NodoTabs";
import { ProjectCard } from "@/components/ProjectCard";
import { cn } from "@/lib/utils";

type MemberProfile = {
  nombre: string | null;
  apellido: string | null;
  apodo: string | null;
  nombre_visible: string | null;
  avatar_url: string | null;
};

type ProjectMemberRow = {
  estado: string;
  profiles: MemberProfile | MemberProfile[] | null;
};

type ProjectRow = {
  id: string;
  nombre: string;
  descripcion: string | null;
  estado: string;
  ingreso: string;
  project_members: ProjectMemberRow[] | null;
};

function memberDisplayName(profile: MemberProfile | null | undefined): string {
  if (!profile) return "?";
  if (profile.nombre_visible?.trim()) return profile.nombre_visible.trim();
  if (profile.apodo?.trim()) return profile.apodo.trim();
  const full = [profile.nombre, profile.apellido].filter(Boolean).join(" ").trim();
  return full || "?";
}

function normalizeMembers(raw: ProjectMemberRow[] | null | undefined) {
  const approved = (raw ?? []).filter((m) => m.estado === "aprobado");
  const members = approved.map((row) => {
    const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
    return {
      name: memberDisplayName(profile),
      src: profile?.avatar_url ?? null,
    };
  });
  return { members, memberCount: members.length };
}

export default async function ProjectsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <p className="text-text-secondary">Iniciá sesión para ver los proyectos.</p>;
  }

  const { data: projects } = await supabase
    .from("projects")
    .select(
      "id, nombre, descripcion, estado, ingreso, project_members(estado, profiles:profile_id(nombre, apellido, apodo, nombre_visible, avatar_url))",
    )
    .order("created_at", { ascending: false });

  const { data: profile } = await supabase
    .from("profiles")
    .select("tier")
    .eq("id", user.id)
    .single();
  const canCreate = profile && profile.tier !== "tourist";

  const rows = (projects ?? []) as ProjectRow[];

  return (
    <div className="flex flex-col gap-5 relative">
      <div className="flex items-center justify-between w-full">
        <Link
          href="/"
          aria-label="Volver a Inicio"
          className="flex items-center justify-center shrink-0"
        >
          <ChevronLeft size={24} className="text-text-primary" />
        </Link>
        <h1 className="font-display text-2xl font-bold text-text-primary">Nodo</h1>
        <span aria-hidden="true" className="size-6 shrink-0" />
      </div>

      <div className="flex flex-col gap-1">
        <p className="font-body text-[13px] text-text-secondary">
          Tareas y proyectos de la comunidad
        </p>
        <NodoTabs active="proyectos" />
      </div>

      {!rows.length ? (
        <EmptyState
          title="Sin proyectos todavía"
          icon={FolderOpen}
          subtitle={
            canCreate
              ? "Creá el primero y sumá gente para hacerlo realidad."
              : "Todavía no hay proyectos publicados en el Nodo."
          }
          href={canCreate ? "/nodo/projects/new" : undefined}
          actionLabel={canCreate ? "Crear proyecto" : undefined}
        />
      ) : (
        <div className="flex flex-col gap-3">
          {rows.map((project) => {
            const { members, memberCount } = normalizeMembers(project.project_members);
            return (
              <ProjectCard
                key={project.id}
                href={`/nodo/projects/${project.id}`}
                name={project.nombre}
                description={project.descripcion}
                estado={project.estado}
                ingreso={project.ingreso}
                members={members}
                memberCount={memberCount}
              />
            );
          })}
        </div>
      )}

      {canCreate && rows.length > 0 ? (
        <Link
          href="/nodo/projects/new"
          className={cn(
            "fixed bottom-6 right-5 z-40",
            "size-14 rounded-full",
            "bg-linear-to-br from-brand-green to-brand-blue",
            "shadow-[0_4px_14px_rgba(26,22,20,0.25)]",
            "flex items-center justify-center",
            "active:scale-95 hover:brightness-110 transition-all",
          )}
          aria-label="Crear proyecto"
        >
          <Plus className="size-6 text-on-primary" strokeWidth={2.5} />
        </Link>
      ) : null}
    </div>
  );
}
