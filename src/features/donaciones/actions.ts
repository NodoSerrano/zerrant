"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  DONACION_STORAGE_BUCKET,
  isDonacionTipoUi,
  mapDonacionTipoToAporte,
  type DonacionTipoUi,
} from "@/lib/db/donaciones-schema";

const CREATE_ERROR = "No pudimos registrar la donación. Probá de nuevo.";
const CREATE_REJECTED = "No pudimos registrar la donación.";
const INVALID_TITULO = "Indicá un título para la donación.";
const INVALID_TIPO = "Revisá el tipo de donación.";
const INVALID_FECHA = "Indicá la fecha de la donación.";
const INVALID_PRESTAMO_RANGO = "La fecha desde no puede ser posterior a la fecha hasta.";
const TOURIST_BLOCKED = "Solo miembros pueden registrar donaciones.";
const UNAUTH = "No autorizado";
const ADMIN_ONLY_APPROVE = "Solo un admin puede aprobar donaciones";
const ADMIN_ONLY_REJECT = "Solo un admin puede rechazar donaciones";
const INVALID_ID = "Donación inválida";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const IMAGE_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

function trimmed(value: FormDataEntryValue | null): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function todayISODate(): string {
  return new Date().toISOString().slice(0, 10);
}

function extForMime(mime: string): string {
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  return "jpg";
}

function optionalISODate(value: FormDataEntryValue | null): string | null {
  const raw = trimmed(value);
  if (!raw) return null;
  return ISO_DATE_RE.test(raw) ? raw : null;
}

/**
 * Client-side image validation errors are hard-fail.
 * Storage upload failures soft-fail: path null + uploadFailed so create can continue.
 */
async function optionalImagePath(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  file: FormDataEntryValue | null,
): Promise<{ path: string | null; uploadFailed: boolean } | { error: string }> {
  if (file == null || !(file instanceof File) || file.size === 0) {
    return { path: null, uploadFailed: false };
  }
  if (!IMAGE_MIME.has(file.type)) {
    return { error: "Formato de imagen no permitido. Usá JPG, PNG o WebP." };
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return { error: "La imagen no puede superar los 5 MB." };
  }
  const path = `${userId}/${crypto.randomUUID()}.${extForMime(file.type)}`;
  const { error } = await supabase.storage.from(DONACION_STORAGE_BUCKET).upload(path, file, {
    contentType: file.type,
    upsert: false,
  });
  if (error) {
    console.warn("[donaciones] storage upload failed:", error.message);
    return { path: null, uploadFailed: true };
  }
  return { path, uploadFailed: false };
}

export async function createDonacion(
  _prevState: { error: string } | null,
  formData: FormData,
): Promise<{ error: string } | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: UNAUTH };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("tier, is_platform_admin")
    .eq("id", user.id)
    .single();

  if (!profile || profile.tier === "tourist") {
    return { error: TOURIST_BLOCKED };
  }

  const titulo = trimmed(formData.get("titulo"));
  if (!titulo) {
    return { error: INVALID_TITULO };
  }

  const tipoRaw = formData.get("tipo_ui");
  if (typeof tipoRaw !== "string" || !isDonacionTipoUi(tipoRaw)) {
    return { error: INVALID_TIPO };
  }
  const tipoUi = tipoRaw as DonacionTipoUi;
  const tipo = mapDonacionTipoToAporte(tipoUi);

  const descripcion = trimmed(formData.get("descripcion"));
  const fecha = trimmed(formData.get("fecha")) ?? todayISODate();
  if (!fecha) {
    return { error: INVALID_FECHA };
  }

  let prestamoDesde: string | null = null;
  let prestamoHasta: string | null = null;
  if (tipoUi === "por_un_tiempo") {
    prestamoDesde = optionalISODate(formData.get("prestamo_desde"));
    prestamoHasta = optionalISODate(formData.get("prestamo_hasta"));
    if (prestamoDesde && prestamoHasta && prestamoDesde > prestamoHasta) {
      return { error: INVALID_PRESTAMO_RANGO };
    }
  }

  const imageResult = await optionalImagePath(supabase, user.id, formData.get("imagen"));
  if ("error" in imageResult) {
    return imageResult;
  }

  const { data, error } = await supabase
    .from("aportes")
    .insert({
      profile_id: user.id,
      registrado_por: user.id,
      tipo,
      titulo,
      descripcion,
      fecha,
      monto: null,
      estado: "pendiente",
      imagen_path: imageResult.path,
      prestamo_desde: prestamoDesde,
      prestamo_hasta: prestamoHasta,
    })
    .select("id");

  if (error) {
    return { error: CREATE_ERROR };
  }

  if (!data || data.length === 0) {
    return { error: CREATE_REJECTED };
  }

  revalidatePath("/donaciones");
  revalidatePath("/admin/donaciones");
  revalidatePath("/profile");
  redirect(imageResult.uploadFailed ? "/donaciones?aviso=imagen" : "/donaciones");
}

export async function approveDonacion(
  _prevState: { error: string } | null,
  formData: FormData,
): Promise<{ error: string } | null> {
  return processDonacionDecision("approve", formData);
}

export async function rejectDonacion(
  _prevState: { error: string } | null,
  formData: FormData,
): Promise<{ error: string } | null> {
  return processDonacionDecision("reject", formData);
}

async function processDonacionDecision(
  kind: "approve" | "reject",
  formData: FormData,
): Promise<{ error: string } | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: UNAUTH };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_platform_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_platform_admin) {
    return { error: kind === "approve" ? ADMIN_ONLY_APPROVE : ADMIN_ONLY_REJECT };
  }

  const aporteId = trimmed(formData.get("aporte_id"));
  if (!aporteId || !UUID_RE.test(aporteId)) {
    return { error: INVALID_ID };
  }

  const notas = trimmed(formData.get("notas"));

  const { data, error } = await supabase.rpc(
    kind === "approve" ? "approve_aporte_donacion" : "reject_aporte_donacion",
    {
      p_aporte_id: aporteId,
      p_notas: notas,
    },
  );

  if (error) {
    return {
      error:
        kind === "approve" ? "No pudimos aprobar la donación." : "No pudimos rechazar la donación.",
    };
  }

  if (data && typeof data === "object" && "error" in data && data.error) {
    return { error: String(data.error) };
  }

  revalidatePath("/admin/donaciones");
  revalidatePath("/donaciones");
  redirect("/admin/donaciones");
}
