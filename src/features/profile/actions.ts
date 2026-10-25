"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { isMembershipFlow } from "@/features/membership/flow-cookie";
import { resolveUnirmeTarget } from "@/features/membership/pipeline";
import { loadMembershipPipeline } from "@/features/membership/pipeline-server";
import {
  AVATAR_BUCKET,
  AVATAR_MAX_BYTES,
  AVATAR_TOO_LARGE_ERROR,
  avatarObjectPath,
  avatarPathFromPublicUrl,
  sniffImageType,
  validateAvatarFile,
} from "./avatar";
import { ensureWebSafeImage } from "./avatar-convert";
import { isValidBirthDate } from "./birthdate";
import { formatPersonName } from "./person-name";
import type { ProfileUpdate } from "./types";

/** What the user sees when Postgres fails: never the engine's message. */
const DB_ERROR = "No pudimos guardar tus datos. Probá de nuevo.";

const NOMBRE_VISIBLE_VALUES = ["apodo", "nombre_apellido", "apellido_nombre"] as const;

// Each action owns the fields its form actually renders: anything not listed is
// ignored even if it arrives in the FormData.
const STEP1_FIELDS = [
  "nombre",
  "apellido",
  "apodo",
  "fecha_nacimiento",
  "nombre_visible",
  "bio",
  "contacto_telegram",
  "sitio_url",
] as const;
const EDIT_PROFILE_FIELDS = [
  "nombre",
  "apellido",
  "apodo",
  "nombre_visible",
  "fecha_nacimiento",
] as const;

function text(value: FormDataEntryValue | null): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
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
  | "sitio_url";

type ProfileTextField =
  | "nombre"
  | "apellido"
  | "apodo"
  | "fecha_nacimiento"
  | "bio"
  | "contacto_telegram"
  | "sitio_url";

/**
 * Single source of truth for the profile update object: both actions below
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

  /** Nombre/apellido: trim then legible casing (particles preserved). */
  const assignPersonName = (field: "nombre" | "apellido", key: string): void => {
    if (!owns(field)) {
      return;
    }
    const raw = formData.get(key);
    if (raw !== null) {
      const t = text(raw);
      update[field] = t ? formatPersonName(t) : t;
    }
  };

  assignPersonName("nombre", "nombre");
  assignPersonName("apellido", "apellido");
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

  // nombre_visible is NOT NULL with a default: only overwrite it when the
  // form sends a recognized value. Absent, blank or unknown => omitted.
  if (owns("nombre_visible")) {
    const nombreVisible = enumValue(formData.get("nombre_visible"), NOMBRE_VISIBLE_VALUES);
    if (nombreVisible) {
      update.nombre_visible = nombreVisible;
    }
  }

  return { update };
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

  // nombre, apellido and fecha_nacimiento are what the gate requires before
  // the interview. Optional fields may be omitted; they must not block close.
  if (!result.update.nombre || !result.update.apellido || !result.update.fecha_nacimiento) {
    return { error: "Completá nombre, apellido y fecha de nacimiento" };
  }

  const update: ProfileUpdate = {
    ...result.update,
    onboarding_completado_en: new Date().toISOString(),
  };

  const { error } = await supabase.from("profiles").update(update).eq("id", user.id);

  if (error) {
    console.error("[saveOnboardingStep1] update falló", error);
    return { error: DB_ERROR };
  }

  revalidatePath("/", "layout");
  // Entered through /unirme: continue to the next pipeline step instead of the
  // tourist profile (ZER-136). Resolved here, never via /unirme, so the
  // browser URL matches the screen and its forms post to the right route (bug-375).
  if (isMembershipFlow(await cookies())) {
    redirect(resolveUnirmeTarget(await loadMembershipPipeline(supabase)));
  }
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

  // HEIC→JPEG can grow the file: re-check against the bucket limit so Storage
  // never answers with a generic failure.
  if (image.bytes.byteLength > AVATAR_MAX_BYTES) {
    return { error: AVATAR_TOO_LARGE_ERROR };
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
  // Only ever clean up inside the user's own folder, whatever avatar_url says.
  if (previousPath?.startsWith(`${user.id}/`) && previousPath !== path) {
    await supabase.storage.from(AVATAR_BUCKET).remove([previousPath]);
  }

  revalidatePath("/", "layout");

  return { avatarUrl: publicUrl };
}

export type AvatarRemoveState = { error?: string; avatarUrl?: null };

/**
 * Takes the photo off the profile so it shows the initials again (ZER-212).
 * Clears avatar_url first: if that fails the photo stays, file included.
 */
export async function removeAvatar(
  _prevState: AvatarRemoveState | null,
  _formData: FormData,
): Promise<AvatarRemoveState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "No autorizado" };
  }

  const { data: previous } = await supabase
    .from("profiles")
    .select("avatar_url")
    .eq("id", user.id)
    .single();

  const { error: dbError } = await supabase
    .from("profiles")
    .update({ avatar_url: null })
    .eq("id", user.id);

  if (dbError) {
    console.error("[removeAvatar] no se pudo limpiar avatar_url", dbError);
    return { error: "No pudimos quitar la foto. Probá de nuevo." };
  }

  const previousPath = avatarPathFromPublicUrl(previous?.avatar_url ?? null);
  // Only ever clean up inside the user's own folder, whatever avatar_url says.
  if (previousPath?.startsWith(`${user.id}/`)) {
    await supabase.storage.from(AVATAR_BUCKET).remove([previousPath]);
  }

  revalidatePath("/", "layout");

  return { avatarUrl: null };
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
