"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { dedupeSkillNames, normalizeSkillName } from "./skills";

const DB_ERROR = "No pudimos guardar tus habilidades. Probá de nuevo.";
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type SkillActionState = { error?: string; success?: string } | null;

async function memberContext() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("tier, is_platform_admin")
    .eq("id", user.id)
    .single();
  if (!profile || profile.tier === "tourist") return null;

  return { supabase, isAdmin: profile.is_platform_admin === true };
}

/** Replaces the caller's skills; a member skill is only its name (ZER-216). */
export async function saveProfileSkills(
  _prevState: { error: string } | null,
  formData: FormData,
): Promise<{ error: string } | never> {
  const context = await memberContext();
  if (!context) return { error: "No autorizado" };
  const { supabase } = context;

  const names = dedupeSkillNames(
    formData
      .getAll("skill")
      .map((value) => normalizeSkillName(String(value)))
      .filter((name): name is string => name !== null),
  );

  // Only approved skills can sit on a profile; pending proposals wait for an admin.
  const { data: catalog, error: catalogError } = await supabase
    .from("skills")
    .select("id, nombre")
    .eq("estado", "aprobada");

  if (catalogError) {
    console.error("[saveProfileSkills] lectura del catálogo falló", catalogError);
    return { error: DB_ERROR };
  }

  const idByName = new Map<string, string>();
  for (const skill of catalog ?? []) {
    idByName.set(skill.nombre.toLocaleLowerCase(), skill.id);
  }

  const skillIds = names.flatMap((name) => idByName.get(name.toLocaleLowerCase()) ?? []);

  const { data, error: rpcError } = await supabase.rpc("save_profile_skills", {
    p_skill_ids: skillIds,
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

/** Members propose a skill; it joins the catalog once an admin approves it. */
export async function proposeSkill(
  _prevState: SkillActionState,
  formData: FormData,
): Promise<SkillActionState> {
  const context = await memberContext();
  if (!context) return { error: "No autorizado" };

  const nombre = normalizeSkillName(String(formData.get("propuesta") ?? ""));
  if (!nombre) return { error: "Escribí el nombre de la habilidad" };

  const { data, error } = await context.supabase.rpc("propose_skill", { p_nombre: nombre });
  if (error) {
    console.error("[proposeSkill] rpc falló", error);
    return { error: "No pudimos enviar la propuesta. Probá de nuevo." };
  }
  if (data?.error) return { error: data.error };

  revalidatePath("/profile/habilidades");
  if (!data?.existing) {
    return { success: `Propusiste «${data?.nombre ?? nombre}». Un admin la va a revisar.` };
  }
  return data.estado === "aprobada"
    ? { success: `«${data.nombre}» ya está en el catálogo: agregala desde las sugerencias.` }
    : { success: `«${data.nombre}» ya está esperando la revisión de un admin.` };
}

/** Admins approve (into the catalog and the proposer's profile) or reject a proposal. */
export async function reviewSkill(
  _prevState: SkillActionState,
  formData: FormData,
): Promise<SkillActionState> {
  const context = await memberContext();
  if (!context?.isAdmin) return { error: "Solo un admin puede revisar habilidades" };

  const skillId = formData.get("skillId");
  const decision = formData.get("decision");
  if (
    typeof skillId !== "string" ||
    !UUID_RE.test(skillId) ||
    (decision !== "aprobar" && decision !== "rechazar")
  ) {
    return { error: "Pedido inválido" };
  }

  const { data, error } = await context.supabase.rpc("review_skill", {
    p_skill_id: skillId,
    p_aprobar: decision === "aprobar",
  });
  if (error) {
    console.error("[reviewSkill] rpc falló", error);
    return { error: "No pudimos guardar la revisión. Probá de nuevo." };
  }
  if (data?.error) return { error: data.error };

  revalidatePath("/admin/habilidades");
  revalidatePath("/profile/habilidades");
  return { success: decision === "aprobar" ? "Habilidad aprobada" : "Propuesta rechazada" };
}
