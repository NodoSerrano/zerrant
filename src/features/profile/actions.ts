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
const DISPONIBILIDAD_VALUES = ["disponible", "ocupado", "solo_eventos"] as const;
const VISIBILIDAD_TARIFA_VALUES = ["publica", "privada"] as const;

// Each action owns the fields its form actually renders: anything not listed is
// ignored even if it arrives in the FormData.
const STEP1_FIELDS = ["nombre", "apellido", "apodo", "fecha_nacimiento", "nombre_visible"] as const;
const STEP2_FIELDS = ["bio", "contacto_telegram", "sitio_url"] as const;
const EDIT_PROFILE_FIELDS = [
  "nombre",
  "apellido",
  "apodo",
  "nombre_visible",
  "fecha_nacimiento",
  "disponibilidad",
  "tarifa_hora",
  "visibilidad_tarifa",
] as const;

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

/** The one guard the three NOT NULL enum columns share: unknown or blank values are dropped. */
function enumValue<T extends string>(
  value: FormDataEntryValue | null,
  allowed: readonly T[],
): T | null {
  return typeof value === "string" && (allowed as readonly string[]).includes(value)
    ? (value as T)
    : null;
}

type ProfileField =
  | "nombre"
  | "apellido"
  | "apodo"
  | "fecha_nacimiento"
  | "nombre_visible"
  | "bio"
  | "contacto_telegram"
  | "sitio_url"
  | "disponibilidad"
  | "tarifa_hora"
  | "visibilidad_tarifa";

type ProfileTextField =
  | "nombre"
  | "apellido"
  | "apodo"
  | "fecha_nacimiento"
  | "bio"
  | "contacto_telegram"
  | "sitio_url";

/**
 * Single source of truth for the profile update object: all three actions below
 * build their `update` with this helper. `fields` is the ownership allowlist: a
 * field not listed is never read from the FormData, no matter what it contains.
 */
function buildProfileUpdate(
  formData: FormData,
  fields: readonly ProfileField[],
): { update: ProfileUpdate } | { error: string } {
  const update: ProfileUpdate = {};
  const owns = (field: ProfileField): boolean => fields.includes(field);

  /** Absent field: leave the column untouched. Present field: trim it (blank => null). */
  const assignText = (field: ProfileTextField, key: string): void => {
    if (!owns(field)) {
      return;
    }
    const raw = formData.get(key);
    if (raw !== null) {
      update[field] = text(raw);
    }
  };

  assignText("nombre", "nombre");
  assignText("apellido", "apellido");
  assignText("apodo", "apodo");
  assignText("fecha_nacimiento", "fecha_nacimiento");
  assignText("bio", "bio");
  assignText("contacto_telegram", "contacto_telegram");
  assignText("sitio_url", "sitio_url");

  // These three are the required columns. They are only enforced when the form
  // actually sent them: a present-but-blank value is what the gate can't accept.
  if (
    (owns("nombre") && formData.get("nombre") !== null && !update.nombre) ||
    (owns("apellido") && formData.get("apellido") !== null && !update.apellido) ||
    (owns("fecha_nacimiento") &&
      formData.get("fecha_nacimiento") !== null &&
      !update.fecha_nacimiento)
  ) {
    return { error: "Completá nombre, apellido y fecha de nacimiento" };
  }

  if (
    owns("fecha_nacimiento") &&
    update.fecha_nacimiento &&
    !isValidBirthDate(update.fecha_nacimiento)
  ) {
    return { error: "Ingresá una fecha de nacimiento válida" };
  }

  // The enum columns are NOT NULL with a default: only overwrite them when the
  // form sends a recognized value. Absent, blank or unknown => omitted.
  if (owns("nombre_visible")) {
    const nombreVisible = enumValue(formData.get("nombre_visible"), NOMBRE_VISIBLE_VALUES);
    if (nombreVisible) {
      update.nombre_visible = nombreVisible;
    }
  }

  if (owns("disponibilidad")) {
    const disponibilidad = enumValue(formData.get("disponibilidad"), DISPONIBILIDAD_VALUES);
    if (disponibilidad) {
      update.disponibilidad = disponibilidad;
    }
  }

  if (owns("visibilidad_tarifa")) {
    const visibilidadTarifa = enumValue(
      formData.get("visibilidad_tarifa"),
      VISIBILIDAD_TARIFA_VALUES,
    );
    if (visibilidadTarifa) {
      update.visibilidad_tarifa = visibilidadTarifa;
    }
  }

  if (owns("tarifa_hora")) {
    const tarifa = formData.get("tarifa_hora");
    if (tarifa !== null) {
      const trimmed = text(tarifa);
      if (trimmed === null) {
        update.tarifa_hora = null;
      } else {
        // A rate is a plain decimal: no sign, exponent or hex that Number() would accept.
        if (!/^\d+(\.\d+)?$/.test(trimmed)) {
          return { error: "Ingresá una tarifa por hora válida" };
        }
        update.tarifa_hora = Number(trimmed);
      }
    }
  }

  return { update };
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

  const result = buildProfileUpdate(formData, STEP1_FIELDS);
  if ("error" in result) {
    return result;
  }

  const { update } = result;

  // Step 1's three fields are what the onboarding gate checks before letting
  // the user out, so this step requires them even when the form omits them.
  if (!update.nombre || !update.apellido || !update.fecha_nacimiento) {
    return { error: "Completá nombre, apellido y fecha de nacimiento" };
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

  const result = buildProfileUpdate(formData, STEP2_FIELDS);
  if ("error" in result) {
    return result;
  }

  const update: ProfileUpdate = {
    ...result.update,
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

  const result = buildProfileUpdate(formData, EDIT_PROFILE_FIELDS);
  if ("error" in result) {
    return result;
  }

  const { update } = result;

  const { error } = await supabase.from("profiles").update(update).eq("id", user.id);

  if (error) {
    console.error("[updateProfile] update falló", error);
    return { error: DB_ERROR };
  }

  revalidatePath("/", "layout");
  redirect("/profile");
}
