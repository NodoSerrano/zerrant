import Link from "next/link";
import { ChevronLeft, FolderOpen } from "lucide-react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/EmptyState";
import { ProjectCard } from "@/components/ProjectCard";

export const dynamic = "force-dynamic";

type MembershipProject = {
  id: string;
  nombre: string;
  descripcion: string | null;
  estado: string;
  ingreso: string;
};

type MembershipRow = {
  project_id: string;
  projects: MembershipProject | MembershipProject[] | null;
};

function unwrapProject(row: MembershipRow): MembershipProject | null {
  const project = Array.isArray(row.projects) ? row.projects[0] : row.projects;
  if (!project?.id || !project.nombre) return null;
  return project;
}

export default async function MisProyectosPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("tier")
    .eq("id", user.id)
    .single();

  if (!profile) {
    redirect("/onboarding/step1");
  }

  if (profile.tier === "tourist") {
    redirect("/profile");
  }

  const { data: rows } = await supabase
    .from("project_members")
    .select("project_id, projects:project_id(id, nombre, descripcion, estado, ingreso)")
    .eq("profile_id", user.id)
    .eq("estado", "aprobado")
    .order("created_at", { ascending: false });

  const projects = ((rows ?? []) as MembershipRow[])
    .map(unwrapProject)
    .filter((project): project is MembershipProject => project !== null);
  const total = projects.length;

  return (
    <div className="flex flex-col gap-4 pb-[90px]">
      <div className="flex items-center gap-3">
        <Link href="/profile" className="shrink-0 text-text-primary" aria-label="Volver al perfil">
          <ChevronLeft size={24} />
        </Link>
        <h1 className="font-display text-base font-medium text-text-primary">Mis proyectos</h1>
      </div>

      {total === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title="No hay proyectos"
          subtitle="Cuando te sumes a un proyecto aprobado, va a aparecer acá."
        />
      ) : (
        <>
          <div className="rounded-[20px] bg-surface-inset p-4 flex gap-3">
            <div className="flex flex-col gap-0.5 flex-1 min-w-0">
              <span className="font-display text-2xl font-bold text-text-primary">{total}</span>
              <span className="font-body text-xs text-text-muted">proyectos en total</span>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                href={`/nodo/projects/${project.id}`}
                name={project.nombre}
                description={project.descripcion}
                estado={project.estado}
                ingreso={project.ingreso}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
