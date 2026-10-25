/**
 * ZER-166 — Donaciones del Nodo (extends M6 aportes with approval workflow).
 * Product: regalo | por un tiempo → DB donacion | prestamo. No estimated value.
 */

import { APORTE_TIPOS, type AporteTipo } from "./aportes-schema";

/** UI-facing donation kinds (product package). */
export const DONACION_TIPOS_UI = ["regalo", "por_un_tiempo"] as const;
export type DonacionTipoUi = (typeof DONACION_TIPOS_UI)[number];

/** Approval workflow states. null on row = legacy M6 ledger (no queue). */
export const APORTE_ESTADOS = ["pendiente", "aprobado", "rechazado"] as const;
export type AporteEstado = (typeof APORTE_ESTADOS)[number];

export const DONACION_TIPO_TO_APORTE: Record<DonacionTipoUi, AporteTipo> = {
  regalo: "donacion",
  por_un_tiempo: "prestamo",
};

export const APORTE_TIPO_TO_DONACION_UI: Partial<Record<AporteTipo, DonacionTipoUi>> = {
  donacion: "regalo",
  prestamo: "por_un_tiempo",
};

export const DONACION_TIPO_UI_LABELS: Record<DonacionTipoUi, string> = {
  regalo: "Regalo",
  por_un_tiempo: "Por un tiempo",
};

/** Filename fragment every ZER-166 migration must include. */
export const DONACIONES_MIGRATION_NAME_FRAGMENT = "zer166_donaciones";

/** Columns donation insert may set (beyond M6 baseline; ZER-166 base). */
export const DONACION_INSERT_EXTRA_COLUMNS = ["titulo", "estado", "imagen_path"] as const;

/** Optional loan range columns (ZER-166 follow-up). */
export const DONACION_PRESTAMO_FECHA_COLUMNS = ["prestamo_desde", "prestamo_hasta"] as const;

/** Follow-up migration fragment for optional loan dates. */
export const DONACIONES_PRESTAMO_FECHAS_MIGRATION_FRAGMENT = "zer166_prestamo_fechas";

/**
 * Hardening: INSERT WITH CHECK must only allow estado null (M6 ledger)
 * or 'pendiente' (donation queue). Never aprobado/rechazado from the client.
 */
export const DONACIONES_INSERT_ESTADO_GUARD_MIGRATION_FRAGMENT = "zer166_insert_estado_guard";

/** Insert-time estados a client may set (RPC-only for aprobado/rechazado). */
export const DONACION_INSERT_ALLOWED_ESTADOS = [null, "pendiente"] as const;

/** Formats optional loan range for list meta (es short dates). */
export function formatPrestamoRango(
  desde: string | null | undefined,
  hasta: string | null | undefined,
  formatFecha: (iso: string) => string,
): string | null {
  if (!desde && !hasta) return null;
  if (desde && hasta) return `${formatFecha(desde)} → ${formatFecha(hasta)}`;
  if (desde) return `desde ${formatFecha(desde)}`;
  return `hasta ${formatFecha(hasta!)}`;
}

/** Approval metadata — only via security definer RPC, not direct grants. */
export const DONACION_APPROVAL_COLUMNS = [
  "estado",
  "aprobado_por",
  "aprobado_en",
  "notas_admin",
] as const;

export const DONACION_STORAGE_BUCKET = "donaciones";

export function isDonacionTipoUi(value: string): value is DonacionTipoUi {
  return (DONACION_TIPOS_UI as readonly string[]).includes(value);
}

export function mapDonacionTipoToAporte(ui: DonacionTipoUi): AporteTipo {
  return DONACION_TIPO_TO_APORTE[ui];
}

export function isDonationAporteTipo(tipo: string): boolean {
  return tipo === "donacion" || tipo === "prestamo";
}

/** M6 ledger still uses the full nine-value enum. */
export function assertM6TiposIntact(): readonly AporteTipo[] {
  return APORTE_TIPOS;
}

/**
 * Community list visibility for a non-admin serrano row.
 * Ledger (estado null) stays visible; donations need aprobado; own rows always.
 */
export function canSerranoSeeAporteRow(args: {
  estado: AporteEstado | null;
  profileId: string;
  viewerId: string;
  isPlatformAdmin: boolean;
  viewerIsTourist: boolean;
}): boolean {
  if (args.viewerIsTourist) return false;
  if (args.isPlatformAdmin) return true;
  if (args.profileId === args.viewerId) return true;
  if (args.estado === null) return true;
  return args.estado === "aprobado";
}

export function canOwnerEditDonacion(args: {
  estado: AporteEstado | null;
  isPlatformAdmin: boolean;
}): boolean {
  if (args.isPlatformAdmin) return true;
  return args.estado === null || args.estado === "pendiente";
}
