import { MoreHorizontal, Settings, ShoppingCart, SprayCan, Wrench } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { TaskCategoria } from "./types";

// Task presentation in a single place. The hub, the card and the detail must
// agree: if each screen builds its own index, they drift apart without
// anyone noticing.

export const CATEGORIA_LABELS: Record<NonNullable<TaskCategoria>, string> = {
  reparacion: "Reparación",
  limpieza: "Limpieza",
  compra: "Compra",
  mantenimiento: "Mantenimiento",
  otro: "Otro",
};

export const CATEGORIA_ICONS: Record<NonNullable<TaskCategoria>, LucideIcon> = {
  reparacion: Wrench,
  limpieza: SprayCan,
  compra: ShoppingCart,
  mantenimiento: Settings,
  otro: MoreHorizontal,
};

// TaskCard receives the label already translated, not the enum. This index is
// derived from the enum-keyed map instead of being written separately, so
// there aren't two lists that can drift apart.
export const categoriaIconByLabel: Record<string, LucideIcon> = Object.fromEntries(
  (Object.keys(CATEGORIA_LABELS) as NonNullable<TaskCategoria>[]).map((c) => [
    CATEGORIA_LABELS[c],
    CATEGORIA_ICONS[c],
  ]),
);

export function getCategoriaLabel(categoria: string): string {
  return CATEGORIA_LABELS[categoria as NonNullable<TaskCategoria>] ?? CATEGORIA_LABELS.otro;
}

export function getCategoriaIcon(categoria: string): LucideIcon {
  return CATEGORIA_ICONS[categoria as NonNullable<TaskCategoria>] ?? MoreHorizontal;
}

// `abierta` comes verbatim from Pencil frame `dyDLm`. The other four are
// derived from the design system: Pencil only designed the open-state chip.
export const ESTADO_BADGE = {
  abierta: { label: "Abierta", bg: "bg-blue-raw/20", text: "text-brand-blue" },
  tomada: { label: "Tomada", bg: "bg-coral/20", text: "text-coral" },
  hecha: { label: "Hecha", bg: "bg-mint-raw/20", text: "text-brand-mint" },
  verificada: { label: "Verificada", bg: "bg-brand-green/20", text: "text-brand-green" },
  cancelada: { label: "Cancelada", bg: "bg-surface-inset", text: "text-text-muted" },
} as const;

export type EstadoBadge = (typeof ESTADO_BADGE)[keyof typeof ESTADO_BADGE];

export function getEstadoBadge(estado: string): EstadoBadge {
  return ESTADO_BADGE[estado as keyof typeof ESTADO_BADGE] ?? ESTADO_BADGE.abierta;
}

export const URGENCIA_CONFIG = {
  alta: { label: "Urgencia alta", color: "text-warm-orange" },
  media: { label: "Urgencia media", color: "text-warm-yellow" },
  baja: { label: "Urgencia baja", color: "text-text-muted" },
} as const;

export type UrgenciaConfig = (typeof URGENCIA_CONFIG)[keyof typeof URGENCIA_CONFIG];

export function getUrgencia(urgencia: string): UrgenciaConfig {
  return URGENCIA_CONFIG[urgencia as keyof typeof URGENCIA_CONFIG] ?? URGENCIA_CONFIG.media;
}
