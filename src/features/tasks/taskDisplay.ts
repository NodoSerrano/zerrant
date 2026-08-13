import { MoreHorizontal, Settings, ShoppingCart, SprayCan, Wrench } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { TaskCategoria } from "./types";

// Presentación de las tareas en un solo lugar. El hub, la tarjeta y el detalle
// tienen que coincidir: si cada pantalla arma su propio índice, se
// desincronizan sin que nadie se entere.

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

// TaskCard recibe la etiqueta ya traducida, no el enum. Este índice se deriva
// del mapa por enum en vez de escribirse aparte, así no hay dos listas que
// puedan quedar distintas.
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

// `abierta` sale exacto del frame `dyDLm` de Pencil. Los otros cuatro se
// derivan del design system: Pencil sólo diseñó el chip del estado abierto.
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
