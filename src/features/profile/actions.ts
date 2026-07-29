"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  AVATAR_BUCKET,
  avatarObjectPath,
  avatarPathFromPublicUrl,
  sniffImageType,
  validateAvatarFile,
} from "./avatar";
import { ensureWebSafeImage } from "./avatar-convert";
import type { ProfileUpdate } from "./types";

/** Lo que se le muestra al usuario cuando Postgres falla: nunca el mensaje del motor. */
const DB_ERROR = "No pudimos guardar tus datos. Probá de nuevo.";

const NOMBRE_VISIBLE_VALUES = ["apodo", "nombre_apellido", "apellido_nombre"] as const;

function text(value: FormDataEntryValue | null): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

/** `YYYY-MM-DD` real, no futura y no absurda. El input `type=date` puede degradar a texto libre. */
function isValidBirthDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    return false;
  }

  return date.getTime() <= Date.now() && date.getUTCFullYear() >= 1900;
}

function nombreVisible(value: FormDataEntryValue | null): ProfileUpdate["nombre_visible"] | null {
  return NOMBRE_VISIBLE_VALUES.includes(value as (typeof NOMBRE_VISIBLE_VALUES)[number])
    ? (value as ProfileUpdate["nombre_visible"])
    : null;
}

/** Los datos que el gate de onboarding exige antes de dejar salir. */
async function step1Data(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data } = await supabase
    .from("profiles")
    .select("nombre, apellido, fecha_nacimiento")
    .eq("id", userId)
    .single();

  return data;
}

export async function saveOnboardingStep1(
  _prevState: { error: string } | null,
  formData: FormData,
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "No autorizado" };
  }

  const nombre = text(formData.get("nombre"));
  const apellido = text(formData.get("apellido"));
  const fechaNacimiento = text(formData.get("fecha_nacimiento"));

  // Estos tres son los que el gate de onboarding mira para dejarte salir, así que
  // el server los exige aunque el browser ya valide los `required`.
  if (!nombre || !apellido || !fechaNacimiento) {
    return { error: "Completá nombre, apellido y fecha de nacimiento" };
  }

  if (!isValidBirthDate(fechaNacimiento)) {
    return { error: "Ingresá una fecha de nacimiento válida" };
  }

  const update: ProfileUpdate = {
    nombre,
    apellido,
    apodo: text(formData.get("apodo")),
    fecha_nacimiento: fechaNacimiento,
  };

  // La columna es NOT NULL con default: sólo la pisamos si el form manda un valor
  // del enum (hoy se elige en editar perfil, no en el onboarding).
  const visible = nombreVisible(formData.get("nombre_visible"));
  if (visible) {
    update.nombre_visible = visible;
  }

  const { error } = await supabase.from("profiles").update(update).eq("id", user.id);

  if (error) {
    console.error("[saveOnboardingStep1] update falló", error);
    return { error: DB_ERROR };
  }

  revalidatePath("/", "layout");
  redirect("/onboarding/step2");
}

export async function saveOnboardingStep2(
  _prevState: { error: string } | null,
  formData: FormData,
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "No autorizado" };
  }

  // El paso 2 no puede cerrar el onboarding sin los datos obligatorios del paso 1:
  // entrar directo por URL dejaría un perfil "completo" con nombre y apellido en null.
  const step1 = await step1Data(supabase, user.id);
  if (!step1?.nombre || !step1?.apellido || !step1?.fecha_nacimiento) {
    redirect("/onboarding/step1");
  }

  const update: ProfileUpdate = {
    bio: text(formData.get("bio")),
    contacto_telegram: text(formData.get("contacto_telegram")),
    sitio_url: text(formData.get("sitio_url")),
    // Cierra el onboarding: es el único dato que prueba haber pasado por el paso 2,
    // porque sus campos son todos opcionales.
    onboarding_completado_en: new Date().toISOString(),
  };

  const { error } = await supabase.from("profiles").update(update).eq("id", user.id);

  if (error) {
    console.error("[saveOnboardingStep2] update falló", error);
    return { error: DB_ERROR };
  }

  revalidatePath("/", "layout");
  redirect("/profile");
}

export type AvatarUploadState = { error?: string; avatarUrl?: string };

/**
 * A diferencia del resto de las actions de este archivo, ésta no redirige:
 * devuelve la URL para que onboarding y editar-perfil puedan mostrar el preview.
 */
export async function uploadAvatar(
  _prevState: AvatarUploadState | null,
  formData: FormData,
): Promise<AvatarUploadState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "No autorizado" };
  }

  const file = formData.get("avatar");

  const validationError = validateAvatarFile(file);
  if (validationError) {
    return { error: validationError };
  }

  const original = new Uint8Array(await (file as File).arrayBuffer());

  // El mime que declara el browser no es confiable: mandamos los bytes.
  const sniffed = sniffImageType(original);
  if (!sniffed) {
    return { error: "El archivo no es una imagen válida" };
  }

  let image: { bytes: Uint8Array; mime: string };
  try {
    image = await ensureWebSafeImage(original, sniffed);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "No pudimos procesar la imagen" };
  }

  const path = avatarObjectPath(user.id, image.mime);

  const { error: uploadError } = await supabase.storage
    .from(AVATAR_BUCKET)
    .upload(path, image.bytes, {
      contentType: image.mime,
      upsert: false,
      cacheControl: "31536000",
    });

  if (uploadError) {
    console.error("[uploadAvatar] la subida a Storage falló", uploadError);
    return { error: "No pudimos guardar la imagen. Probá de nuevo." };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path);

  const { data: previous } = await supabase
    .from("profiles")
    .select("avatar_url")
    .eq("id", user.id)
    .single();

  const { error: dbError } = await supabase
    .from("profiles")
    .update({ avatar_url: publicUrl })
    .eq("id", user.id);

  if (dbError) {
    // No dejamos el objeto huérfano si el perfil no llegó a apuntarlo.
    await supabase.storage.from(AVATAR_BUCKET).remove([path]);
    console.error("[uploadAvatar] no se pudo guardar avatar_url", dbError);
    return { error: DB_ERROR };
  }

  const previousPath = avatarPathFromPublicUrl(previous?.avatar_url ?? null);
  if (previousPath && previousPath !== path) {
    await supabase.storage.from(AVATAR_BUCKET).remove([previousPath]);
  }

  revalidatePath("/", "layout");

  return { avatarUrl: publicUrl };
}

export async function updateProfile(_prevState: { error: string } | null, formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "No autorizado" };
  }

  const update: ProfileUpdate = {
    nombre: (formData.get("nombre") as string) || null,
    apellido: (formData.get("apellido") as string) || null,
    apodo: (formData.get("apodo") as string) || null,
    nombre_visible: formData.get("nombre_visible") as ProfileUpdate["nombre_visible"],
    fecha_nacimiento: (formData.get("fecha_nacimiento") as string) || null,
    bio: (formData.get("bio") as string) || null,
    contacto_telegram: (formData.get("contacto_telegram") as string) || null,
    sitio_url: (formData.get("sitio_url") as string) || null,
    disponibilidad: formData.get("disponibilidad") as ProfileUpdate["disponibilidad"],
    visibilidad_tarifa: formData.get("visibilidad_tarifa") as ProfileUpdate["visibilidad_tarifa"],
  };

  const tarifa = formData.get("tarifa_hora") as string;
  if (tarifa) {
    update.tarifa_hora = Number(tarifa);
  }

  const { error } = await supabase.from("profiles").update(update).eq("id", user.id);

  if (error) {
    console.error("[updateProfile] update falló", error);
    return { error: DB_ERROR };
  }

  const roleIds = formData.getAll("roles") as string[];

  if (roleIds.length > 0) {
    const { data: validRoles } = await supabase.from("roles").select("id").in("id", roleIds);

    if (!validRoles || validRoles.length !== roleIds.length) {
      return { error: DB_ERROR };
    }
  }

  const { data: currentRoles } = await supabase
    .from("profile_roles")
    .select("role_id, confirmado")
    .eq("profile_id", user.id);

  const currentRoleIds = new Set((currentRoles ?? []).map((r) => r.role_id));
  const submittedRoleIds = new Set(roleIds);

  const toDelete = (currentRoles ?? [])
    .filter((r) => !r.confirmado && !submittedRoleIds.has(r.role_id))
    .map((r) => r.role_id);

  if (toDelete.length > 0) {
    const { error: deleteError } = await supabase
      .from("profile_roles")
      .delete()
      .eq("profile_id", user.id)
      .in("role_id", toDelete);

    if (deleteError) {
      console.error("[updateProfile] delete roles falló", deleteError);
    }
  }

  const toInsert = roleIds.filter((rid) => !currentRoleIds.has(rid));

  if (toInsert.length > 0) {
    const { error: insertError } = await supabase
      .from("profile_roles")
      .insert(toInsert.map((roleId) => ({ profile_id: user.id, role_id: roleId })));

    if (insertError) {
      console.error("[updateProfile] insert roles falló", insertError);
    }
  }

  revalidatePath("/", "layout");
  redirect("/profile");
}
