"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { dedupeSkillNames, normalizeSkillName } from "./skills";

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

  const { data: profile } = await supabase
    .from("profiles")
    .select("tier")
    .eq("id", user.id)
    .single();

  if (!profile || profile.tier === "tourist") {
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

  const { data, error: rpcError } = await supabase.rpc("sync_profile_skills", {
    p_skill_ids: targetIds,
  });

  if (rpcError) {
    console.error("[saveProfileSkills] rpc falló", rpcError);
    return { error: DB_ERROR };
  }

  if (data?.error) {
    return { error: data.error };
  }

  revalidatePath("/profile");
  revalidatePath("/plantel");
  redirect("/profile");
}
