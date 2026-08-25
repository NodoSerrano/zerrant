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

/** What the user sees when Postgres fails: never the engine's message. */
const DB_ERROR = "No pudimos guardar tus datos. Probá de nuevo.";

const NOMBRE_VISIBLE_VALUES = ["apodo", "nombre_apellido", "apellido_nombre"] as const;

function text(value: FormDataEntryValue | null): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

/** A real `YYYY-MM-DD`, not in the future and not absurd. The `type=date` input can degrade to free text. */
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

/** The data the onboarding gate requires before letting the user out. */
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

  // These three are what the onboarding gate checks before letting the user
  // out, so the server requires them even though the browser already validates
  // the `required` attributes.
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

  // The column is NOT NULL with a default: only overwrite it if the form sends
  // an enum value (today it's chosen in profile edit, not in onboarding).
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

  // Step 2 cannot close onboarding without step 1's required data: entering
  // directly by URL would leave a "complete" profile with null first and last name.
  const step1 = await step1Data(supabase, user.id);
  if (!step1?.nombre || !step1?.apellido || !step1?.fecha_nacimiento) {
    redirect("/onboarding/step1");
  }

  const update: ProfileUpdate = {
    bio: text(formData.get("bio")),
    contacto_telegram: text(formData.get("contacto_telegram")),
    sitio_url: text(formData.get("sitio_url")),
    // Closes onboarding: it's the only piece of data proving step 2 was
    // visited, because all of its fields are optional.
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
 * Unlike the other actions in this file, this one doesn't redirect:
 * it returns the URL so onboarding and profile edit can show the preview.
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

  // The mime the browser declares is not trustworthy: we send the bytes.
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
    // Don't leave an orphaned object if the profile never came to point at it.
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

  revalidatePath("/", "layout");
  redirect("/profile");
}
