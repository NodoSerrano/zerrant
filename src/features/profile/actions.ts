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

function text(value: FormDataEntryValue | null): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
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

  const update: ProfileUpdate = {
    nombre,
    apellido,
    apodo: text(formData.get("apodo")),
    fecha_nacimiento: fechaNacimiento,
  };

  // La columna es NOT NULL con default: sólo la pisamos si el form la manda
  // (hoy se elige en editar perfil, no en el onboarding).
  const nombreVisible = formData.get("nombre_visible");
  if (nombreVisible !== null) {
    update.nombre_visible = nombreVisible as ProfileUpdate["nombre_visible"];
  }

  const { error } = await supabase.from("profiles").update(update).eq("id", user.id);

  if (error) {
    return { error: error.message };
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

  const update: ProfileUpdate = {
    bio: (formData.get("bio") as string) || null,
    contacto_telegram: (formData.get("contacto_telegram") as string) || null,
    sitio_url: (formData.get("sitio_url") as string) || null,
  };

  const { error } = await supabase.from("profiles").update(update).eq("id", user.id);

  if (error) {
    return { error: error.message };
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
    return { error: uploadError.message };
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
    return { error: dbError.message };
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
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  redirect("/profile");
}
