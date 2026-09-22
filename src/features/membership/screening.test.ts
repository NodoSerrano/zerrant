import { describe, expect, it } from "vitest";
import {
  APORTE_ACTITUD_VALUES,
  APORTE_MAYOR_VALUES,
  DURACION_VISITA_VALUES,
  FRECUENCIA_USO_VALUES,
  MEMBERSHIP_REQUESTS_INSERT_COLUMNS,
  SITUACION_ACTUAL_VALUES,
  parseMembershipScreening,
} from "./screening";

function fd(entries: Record<string, string>): FormData {
  const form = new FormData();
  for (const [key, value] of Object.entries(entries)) {
    form.set(key, value);
  }
  return form;
}

const validCore = {
  contacto_whatsapp: "+54 9 11 1234-5678",
  frecuencia_uso: "1_semana",
  duracion_visita: "2_4h",
  aporte_actitud: "comodo",
  reunion_disponibilidad: "Martes o jueves después de las 18",
} as const;

describe("membership screening enums", () => {
  it("locks frequency options aligned to the Google Form", () => {
    expect([...FRECUENCIA_USO_VALUES]).toEqual([
      "1_2_mes",
      "1_semana",
      "2_3_semana",
      "4_5_semana",
      "casi_diario",
      "no_se",
    ]);
  });

  it("locks duration options", () => {
    expect([...DURACION_VISITA_VALUES]).toEqual(["menos_2h", "2_4h", "4_6h", "mas_6h", "depende"]);
  });

  it("locks aporte actitud options", () => {
    expect([...APORTE_ACTITUD_VALUES]).toEqual([
      "comodo",
      "esfuerzo",
      "preferiria_menos",
      "podria_mas",
      "conversar_particular",
      "no_seguro",
    ]);
  });

  it("locks optional situacion and aporte_mayor options", () => {
    expect([...SITUACION_ACTUAL_VALUES]).toEqual([
      "estudio",
      "trabajo",
      "estudio_trabajo",
      "ninguno",
      "otra",
    ]);
    expect([...APORTE_MAYOR_VALUES]).toEqual(["si", "probablemente", "no", "conversarlo"]);
  });
});

describe("parseMembershipScreening", () => {
  it("accepts core-only payload and nulls optional extras", () => {
    const result = parseMembershipScreening(fd({ ...validCore }));
    expect(result).toEqual({
      ok: true,
      data: {
        contacto_whatsapp: "+54 9 11 1234-5678",
        frecuencia_uso: "1_semana",
        duracion_visita: "2_4h",
        aporte_actitud: "comodo",
        reunion_disponibilidad: "Martes o jueves después de las 18",
        situacion_actual: null,
        ocupacion_detalle: null,
        entrevista_items: null,
        aporte_otro: null,
        aporte_mayor: null,
        mensaje: null,
      },
    });
  });

  it("trims text fields and keeps optional enums when valid", () => {
    const result = parseMembershipScreening(
      fd({
        ...validCore,
        contacto_whatsapp: "  1122334455  ",
        reunion_disponibilidad: "  lunes AM  ",
        situacion_actual: "estudio_trabajo",
        ocupacion_detalle: "  Diseño + frontend  ",
        entrevista_items: "  espacio, aporte, roles  ",
        aporte_otro: "  charlas  ",
        aporte_mayor: "probablemente",
        mensaje: "  me copa el nodo  ",
      }),
    );
    expect(result).toEqual({
      ok: true,
      data: {
        contacto_whatsapp: "1122334455",
        frecuencia_uso: "1_semana",
        duracion_visita: "2_4h",
        aporte_actitud: "comodo",
        reunion_disponibilidad: "lunes AM",
        situacion_actual: "estudio_trabajo",
        ocupacion_detalle: "Diseño + frontend",
        entrevista_items: "espacio, aporte, roles",
        aporte_otro: "charlas",
        aporte_mayor: "probablemente",
        mensaje: "me copa el nodo",
      },
    });
  });

  it("rejects missing core fields without inventing defaults", () => {
    const result = parseMembershipScreening(fd({ frecuencia_uso: "1_semana" }));
    expect(result).toEqual({
      ok: false,
      error: "Completá WhatsApp, uso del espacio, aporte y horario de reunión",
    });
  });

  it("rejects blank whatsapp or reunion text", () => {
    expect(
      parseMembershipScreening(
        fd({
          ...validCore,
          contacto_whatsapp: "   ",
        }),
      ),
    ).toEqual({
      ok: false,
      error: "Completá WhatsApp, uso del espacio, aporte y horario de reunión",
    });
  });

  it("rejects unknown enum values on core fields", () => {
    const result = parseMembershipScreening(
      fd({
        ...validCore,
        frecuencia_uso: "todos_los_dias",
      }),
    );
    expect(result).toEqual({
      ok: false,
      error: "Completá WhatsApp, uso del espacio, aporte y horario de reunión",
    });
  });

  it("ignores invalid optional enums instead of failing the whole form", () => {
    const result = parseMembershipScreening(
      fd({
        ...validCore,
        situacion_actual: "freelancer",
        aporte_mayor: "tal_vez",
      }),
    );
    expect(result).toMatchObject({
      ok: true,
      data: {
        situacion_actual: null,
        aporte_mayor: null,
      },
    });
  });
});

describe("membership_requests insert grant contract", () => {
  it("lists screening columns tourists may insert (tier_solicitado stays off)", () => {
    expect([...MEMBERSHIP_REQUESTS_INSERT_COLUMNS]).toEqual([
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
    ]);
    expect(MEMBERSHIP_REQUESTS_INSERT_COLUMNS).not.toContain("tier_solicitado");
    expect(MEMBERSHIP_REQUESTS_INSERT_COLUMNS).not.toContain("estado");
  });
});
