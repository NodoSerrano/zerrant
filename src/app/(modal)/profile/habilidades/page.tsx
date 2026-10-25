import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EditSkills } from "@/features/plantel/EditSkills";
import type { SkillItem } from "@/features/plantel/skills";

export const dynamic = "force-dynamic";

export default async function HabilidadesPage() {
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

  const [{ data: skillAssignments }, { data: skills }] = await Promise.all([
    supabase
      .from("profile_skills")
      .select("nivel, anios_freelance, anios_empresa, skills(nombre)")
      .eq("profile_id", user.id)
      .order("created_at"),
    // RLS returns the approved catalog plus the caller's own proposals (all of
    // them for admins), so split them here.
    supabase.from("skills").select("nombre, estado, propuesta_por").order("nombre"),
  ]);

  const initialSkills: SkillItem[] = (skillAssignments ?? []).flatMap((assignment) =>
    assignment.skills?.nombre
      ? [
          {
            nombre: assignment.skills.nombre,
            nivel: assignment.nivel,
            anios_freelance: assignment.anios_freelance,
            anios_empresa: assignment.anios_empresa,
          },
        ]
      : [],
  );

  const catalog = (skills ?? []).filter((s) => s.estado === "aprobada").map((s) => s.nombre);
  const pendingProposals = (skills ?? [])
    .filter((s) => s.estado === "pendiente" && s.propuesta_por === user.id)
    .map((s) => s.nombre);

  return (
    <EditSkills
      initialSkills={initialSkills}
      catalog={catalog}
      pendingProposals={pendingProposals}
    />
  );
}
