"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { computeSkillDiff, dedupeSkillNames, normalizeSkillName } from "./skills";

const DB_ERROR = "No pudimos guardar tus habilidades. Probá de nuevo.";

export async function saveProfileSkills(
  _prevState: { error: string } | null,
  formData: FormData,
): Promise<{ error: string } | never> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "No autorizado" };
  }

  const names = dedupeSkillNames(
    formData
      .getAll("skill")
      .map((value) => normalizeSkillName(String(value)))
      .filter((name): name is string => name !== null),
  );

  const { data: catalog, error: catalogError } = await supabase.from("skills").select("id, nombre");

  if (catalogError) {
    console.error("[saveProfileSkills] lectura del catálogo falló", catalogError);
    return { error: DB_ERROR };
  }

  const idByName = new Map<string, string>();
  for (const skill of catalog ?? []) {
    idByName.set(skill.nombre.toLocaleLowerCase(), skill.id);
  }

  const targetIds = names
    .map((name) => idByName.get(name.toLocaleLowerCase()))
    .filter((id): id is string => Boolean(id));

  const { data: current, error: currentError } = await supabase
    .from("profile_skills")
    .select("skill_id")
    .eq("profile_id", user.id);

  if (currentError) {
    console.error("[saveProfileSkills] lectura de skills actuales falló", currentError);
    return { error: DB_ERROR };
  }

  const currentIds = (current ?? []).map((row) => row.skill_id);
  const { toAdd, toRemove } = computeSkillDiff(currentIds, targetIds);

  if (toRemove.length > 0) {
    const { error } = await supabase
      .from("profile_skills")
      .delete()
      .eq("profile_id", user.id)
      .in("skill_id", toRemove);

    if (error) {
      console.error("[saveProfileSkills] delete falló", error);
      return { error: DB_ERROR };
    }
  }

  if (toAdd.length > 0) {
    const { error } = await supabase.from("profile_skills").upsert(
      toAdd.map((skill_id) => ({ profile_id: user.id, skill_id })),
      { onConflict: "profile_id,skill_id", ignoreDuplicates: true },
    );

    if (error) {
      console.error("[saveProfileSkills] insert falló", error);
      return { error: DB_ERROR };
    }
  }

  revalidatePath("/", "layout");
  redirect("/profile");
}
