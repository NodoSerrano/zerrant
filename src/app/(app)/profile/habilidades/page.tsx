import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EditSkills } from "@/features/plantel/EditSkills";

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

  const [{ data: skillAssignments }, { data: catalog }] = await Promise.all([
    supabase
      .from("profile_skills")
      .select("skills(nombre)")
      .eq("profile_id", user.id)
      .order("created_at"),
    supabase.from("skills").select("nombre").order("nombre"),
  ]);

  const initialSkills = (skillAssignments ?? [])
    .map((assignment) => assignment.skills?.nombre)
    .filter((name): name is string => Boolean(name));

  const catalogNames = (catalog ?? []).map((skill) => skill.nombre);

  return <EditSkills initialSkills={initialSkills} catalog={catalogNames} />;
}
