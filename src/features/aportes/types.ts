import type { LucideIcon } from "lucide-react";
import {
  Gift,
  HandCoins,
  Mic,
  Sparkles,
  Wrench,
  ClipboardList,
  Leaf,
  MoreHorizontal,
  Wallet,
} from "lucide-react";
import { APORTE_TIPOS, type AporteTipo } from "@/lib/db/aportes-schema";

export type { AporteTipo };
export { APORTE_TIPOS };

/** Accented Spanish labels for the nine unaccented enum values (frame 3.4 / 4.6). */
export const APORTE_TIPO_LABELS: Record<AporteTipo, string> = {
  economico: "Económico",
  donacion: "Donación",
  prestamo: "Préstamo",
  charla: "Charla",
  actividad: "Actividad",
  mantenimiento: "Mantenimiento",
  administracion: "Administración",
  yerba: "Yerba",
  otro: "Otro",
};

export const APORTE_TIPO_OPTIONS = APORTE_TIPOS.map((value) => ({
  value,
  label: APORTE_TIPO_LABELS[value],
}));

export const APORTE_TIPO_ICONS: Record<AporteTipo, LucideIcon> = {
  economico: Wallet,
  donacion: Gift,
  prestamo: HandCoins,
  charla: Mic,
  actividad: Sparkles,
  mantenimiento: Wrench,
  administracion: ClipboardList,
  yerba: Leaf,
  otro: MoreHorizontal,
};

/** Soft icon-well fills aligned with Pencil AporteItem overrides. */
export const APORTE_TIPO_ICON_WELL: Record<AporteTipo, string> = {
  economico: "bg-brand-blue/10 text-brand-blue",
  donacion: "bg-brand-green/10 text-brand-green",
  prestamo: "bg-brand-green/10 text-brand-green",
  charla: "bg-brand-violet/10 text-brand-violet",
  actividad: "bg-warm-orange/10 text-warm-orange",
  mantenimiento: "bg-warm-orange/10 text-warm-orange",
  administracion: "bg-brand-blue/10 text-brand-blue",
  yerba: "bg-brand-green/10 text-brand-green",
  otro: "bg-surface-inset text-text-muted",
};

export function aporteTipoLabel(tipo: string): string {
  if ((APORTE_TIPOS as readonly string[]).includes(tipo)) {
    return APORTE_TIPO_LABELS[tipo as AporteTipo];
  }
  return tipo;
}

export function aporteTipoIcon(tipo: string): LucideIcon {
  if ((APORTE_TIPOS as readonly string[]).includes(tipo)) {
    return APORTE_TIPO_ICONS[tipo as AporteTipo];
  }
  return MoreHorizontal;
}

export function aporteTipoIconWell(tipo: string): string {
  if ((APORTE_TIPOS as readonly string[]).includes(tipo)) {
    return APORTE_TIPO_ICON_WELL[tipo as AporteTipo];
  }
  return APORTE_TIPO_ICON_WELL.otro;
}

export type AporteListItem = {
  id: string;
  tipo: string;
  descripcion: string;
  monto: number | null;
  fecha: string;
};

const MONTH_SHORT_ES = [
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "ago",
  "sep",
  "oct",
  "nov",
  "dic",
] as const;

/** Formats a `date` column (YYYY-MM-DD) like Pencil meta: `12 jul 2026`. */
export function formatAporteFecha(fecha: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(fecha);
  if (!m) return fecha;
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return fecha;
  return `${day} ${MONTH_SHORT_ES[month - 1]} ${year}`;
}

export function formatAporteMonto(monto: number): string {
  const formatted = new Intl.NumberFormat("es-AR", {
    maximumFractionDigits: 0,
  }).format(monto);
  return `$${formatted}`;
}

export function buildAporteMeta(tipo: string, fecha: string, monto: number | null): string {
  const parts = [aporteTipoLabel(tipo), formatAporteFecha(fecha)];
  if (monto !== null) {
    parts.push(formatAporteMonto(monto));
  }
  return parts.join(" · ");
}
