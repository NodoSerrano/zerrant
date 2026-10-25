// Profile availability presentation (ZER-210). Lives next to profile types so
// plantel/profile screens share one map when the chip is shown again. Same
// traffic-light idea as task urgency: green = free, orange = partial, red = busy.

export const DISPONIBILIDAD_CONFIG = {
  disponible: { label: "Disponible", color: "text-brand-green" },
  solo_eventos: { label: "Solo eventos", color: "text-warm-orange" },
  ocupado: { label: "Ocupado", color: "text-warm-red" },
} as const;

export type DisponibilidadConfig =
  (typeof DISPONIBILIDAD_CONFIG)[keyof typeof DISPONIBILIDAD_CONFIG];

export function getDisponibilidad(value: string): DisponibilidadConfig {
  return (
    DISPONIBILIDAD_CONFIG[value as keyof typeof DISPONIBILIDAD_CONFIG] ??
    DISPONIBILIDAD_CONFIG.ocupado
  );
}
