import { APORTE_TIPOS, type AporteTipo } from "@/lib/db/aportes-schema";

export type { AporteTipo };
export { APORTE_TIPOS };

/** Accented Spanish labels live here; stored enum values stay unaccented. */
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
