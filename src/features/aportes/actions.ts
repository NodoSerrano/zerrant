"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { APORTE_TIPOS, type AporteTipo } from "./types";

const CREATE_ERROR = "No pudimos registrar el aporte. Probá de nuevo.";
const CREATE_REJECTED = "No pudimos registrar el aporte.";
const INVALID_TIPO = "Revisá el tipo de aporte.";
const INVALID_DESCRIPCION = "La descripción no puede estar vacía.";
const INVALID_FECHA = "Indicá la fecha del aporte.";
const INVALID_MONTO = "El monto tiene que ser un número.";

function trimmed(value: FormDataEntryValue | null): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function oneOf<T extends string>(
  value: FormDataEntryValue | null,
  allowed: readonly T[],
): T | null {
  return typeof value === "string" && (allowed as readonly string[]).includes(value)
    ? (value as T)
    : null;
}

/** Empty/whitespace → null. Never Number("") === 0. */
function parseOptionalMonto(value: FormDataEntryValue | null): number | null | { error: string } {
  if (value == null) return null;
  if (typeof value !== "string") return { error: INVALID_MONTO };
  const raw = value.trim();
  if (!raw) return null;
  const n = Number(raw);
  if (!Number.isFinite(n)) return { error: INVALID_MONTO };
  return n;
}

export async function createAporte(
  _prevState: { error: string } | null,
  formData: FormData,
): Promise<{ error: string } | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "No autorizado" };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("tier, is_platform_admin")
    .eq("id", user.id)
    .single();

  const tipo = oneOf(formData.get("tipo"), APORTE_TIPOS);
  if (!tipo) {
    return { error: INVALID_TIPO };
  }

  const descripcion = trimmed(formData.get("descripcion"));
  if (!descripcion) {
    return { error: INVALID_DESCRIPCION };
  }

  const fecha = trimmed(formData.get("fecha"));
  if (!fecha) {
    return { error: INVALID_FECHA };
  }

  const montoParsed = parseOptionalMonto(formData.get("monto"));
  if (montoParsed && typeof montoParsed === "object" && "error" in montoParsed) {
    return montoParsed;
  }
  const monto = montoParsed as number | null;

  // Self-load by default. Admin may pass another profile_id; RLS is the authority.
  const requestedProfileId = trimmed(formData.get("profile_id"));
  const profileId = profile?.is_platform_admin && requestedProfileId ? requestedProfileId : user.id;

  void (tipo satisfies AporteTipo);

  const { data, error } = await supabase
    .from("aportes")
    .insert({
      profile_id: profileId,
      registrado_por: user.id,
      tipo,
      descripcion,
      fecha,
      monto,
    })
    .select("id");

  if (error) {
    return { error: CREATE_ERROR };
  }

  if (!data || data.length === 0) {
    return { error: CREATE_REJECTED };
  }

  revalidatePath("/profile/aportes");
  revalidatePath("/plantel", "layout");
  redirect("/profile/aportes");
}
