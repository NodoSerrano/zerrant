/** ZER-108 — membership screening snapshot (Google Form → /solicitar). */

/** Product copy for /solicitar — reference contribution guide (not a DB column). */
export const APORTE_REFERENCIA_TITLE = "Aporte de referencia";

export const APORTE_REFERENCIA_PARAGRAPHS = [
  "Mantener Nodo abierto tiene costos importantes: alquiler, servicios, internet, mantenimiento, herramientas, insumos y otros gastos.",
  "Para participar, contamos con aportes de referencia según la frecuencia de uso:",
  "🎓 Estudiantes: $5.000 por día, con una referencia de $30.000/mes para quienes asisten de forma habitual. Podés venir 1, 2 o más días por semana, de manera flexible.",
  "💼 Trabajadores: $20.000 por día, con posibilidad de acceder a descuentos por mayor cantidad de días o frecuencia de uso.",
  "Estos valores son orientativos y buscamos que la modalidad se adapte a cada persona. No queremos que una situación económica particular sea una barrera para participar, por lo que el aporte final se conversa personalmente con el Site Manager de Nodo.",
] as const;

/** Flattened copy for tests / plain-text surfaces. */
export const APORTE_REFERENCIA_COPY = APORTE_REFERENCIA_PARAGRAPHS.join("\n\n");
export const FRECUENCIA_USO_VALUES = [
  "1_2_mes",
  "1_semana",
  "2_3_semana",
  "4_5_semana",
  "casi_diario",
  "no_se",
] as const;
export type FrecuenciaUso = (typeof FRECUENCIA_USO_VALUES)[number];

export const DURACION_VISITA_VALUES = ["menos_2h", "2_4h", "4_6h", "mas_6h", "depende"] as const;
export type DuracionVisita = (typeof DURACION_VISITA_VALUES)[number];

export const APORTE_ACTITUD_VALUES = [
  "comodo",
  "esfuerzo",
  "preferiria_menos",
  "podria_mas",
  "conversar_particular",
  "no_seguro",
] as const;
export type AporteActitud = (typeof APORTE_ACTITUD_VALUES)[number];

export const SITUACION_ACTUAL_VALUES = [
  "estudio",
  "trabajo",
  "estudio_trabajo",
  "ninguno",
  "otra",
] as const;
export type SituacionActual = (typeof SITUACION_ACTUAL_VALUES)[number];

export const APORTE_MAYOR_VALUES = ["si", "probablemente", "no", "conversarlo"] as const;
export type AporteMayor = (typeof APORTE_MAYOR_VALUES)[number];

/** PostgREST INSERT columns tourists may write (tier_solicitado / estado stay server-side). */
export const MEMBERSHIP_REQUESTS_INSERT_COLUMNS = [
  "profile_id",
  "mensaje",
  "contacto_whatsapp",
  "frecuencia_uso",
  "duracion_visita",
  "aporte_actitud",
  "reunion_disponibilidad",
  "situacion_actual",
  "ocupacion_detalle",
  "entrevista_items",
  "aporte_otro",
  "aporte_mayor",
] as const;

export const MEMBERSHIP_SCREENING_CORE_ERROR =
  "Completá WhatsApp, uso del espacio, aporte y horario de reunión";

export type MembershipScreeningData = {
  contacto_whatsapp: string;
  frecuencia_uso: FrecuenciaUso;
  duracion_visita: DuracionVisita;
  aporte_actitud: AporteActitud;
  reunion_disponibilidad: string;
  situacion_actual: SituacionActual | null;
  ocupacion_detalle: string | null;
  entrevista_items: string | null;
  aporte_otro: string | null;
  aporte_mayor: AporteMayor | null;
  mensaje: string | null;
};

export type ParseMembershipScreeningResult =
  | { ok: true; data: MembershipScreeningData }
  | { ok: false; error: string };

function text(value: FormDataEntryValue | null): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function enumValue<T extends string>(
  value: FormDataEntryValue | null,
  allowed: readonly T[],
): T | null {
  return typeof value === "string" && (allowed as readonly string[]).includes(value)
    ? (value as T)
    : null;
}

export function parseMembershipScreening(formData: FormData): ParseMembershipScreeningResult {
  const contacto_whatsapp = text(formData.get("contacto_whatsapp"));
  const frecuencia_uso = enumValue(formData.get("frecuencia_uso"), FRECUENCIA_USO_VALUES);
  const duracion_visita = enumValue(formData.get("duracion_visita"), DURACION_VISITA_VALUES);
  const aporte_actitud = enumValue(formData.get("aporte_actitud"), APORTE_ACTITUD_VALUES);
  const reunion_disponibilidad = text(formData.get("reunion_disponibilidad"));

  if (
    !contacto_whatsapp ||
    !frecuencia_uso ||
    !duracion_visita ||
    !aporte_actitud ||
    !reunion_disponibilidad
  ) {
    return { ok: false, error: MEMBERSHIP_SCREENING_CORE_ERROR };
  }

  return {
    ok: true,
    data: {
      contacto_whatsapp,
      frecuencia_uso,
      duracion_visita,
      aporte_actitud,
      reunion_disponibilidad,
      situacion_actual: enumValue(formData.get("situacion_actual"), SITUACION_ACTUAL_VALUES),
      ocupacion_detalle: text(formData.get("ocupacion_detalle")),
      entrevista_items: text(formData.get("entrevista_items")),
      aporte_otro: text(formData.get("aporte_otro")),
      aporte_mayor: enumValue(formData.get("aporte_mayor"), APORTE_MAYOR_VALUES),
      mensaje: text(formData.get("mensaje")),
    },
  };
}

/** Human labels for admin detail (Spanish UI). */
export const FRECUENCIA_USO_LABELS: Record<FrecuenciaUso, string> = {
  "1_2_mes": "1–2 veces al mes",
  "1_semana": "Aproximadamente 1 vez por semana",
  "2_3_semana": "2–3 veces por semana",
  "4_5_semana": "4–5 veces por semana",
  casi_diario: "Casi todos los días",
  no_se: "Todavía no lo sé",
};

export const DURACION_VISITA_LABELS: Record<DuracionVisita, string> = {
  menos_2h: "Menos de 2 horas",
  "2_4h": "2–4 horas",
  "4_6h": "4–6 horas",
  mas_6h: "Más de 6 horas",
  depende: "Depende del día",
};

export const APORTE_ACTITUD_LABELS: Record<AporteActitud, string> = {
  comodo: "Me resulta cómodo",
  esfuerzo: "Puedo pagarlo, aunque representa un esfuerzo",
  preferiria_menos: "Preferiría aportar menos",
  podria_mas: "Podría aportar más",
  conversar_particular: "Necesito conversar mi situación particular",
  no_seguro: "Todavía no estoy seguro/a",
};

export const SITUACION_ACTUAL_LABELS: Record<SituacionActual, string> = {
  estudio: "Estudio actualmente",
  trabajo: "Trabajo actualmente",
  estudio_trabajo: "Estudio y trabajo",
  ninguno: "Actualmente no estudio ni trabajo",
  otra: "Otra situación",
};

export const APORTE_MAYOR_LABELS: Record<AporteMayor, string> = {
  si: "Sí",
  probablemente: "Probablemente",
  no: "No",
  conversarlo: "Prefiero conversarlo personalmente",
};
