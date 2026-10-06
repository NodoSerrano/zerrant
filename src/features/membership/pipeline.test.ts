import { describe, expect, it } from "vitest";
import {
  MEMBERSHIP_PIPELINE_STEPS,
  membershipPipelineStep,
  resolveUnirmeTarget,
  screenProgress,
  type PipelineInput,
} from "./pipeline";
import { MEMBERSHIP_REQUEST_ESTADOS, type MembershipRequestEstado } from "./request-state";

const step1Profile = {
  nombre: "Ana",
  apellido: "Paz",
  fecha_nacimiento: "1990-01-01",
  onboarding_completado_en: null,
  tier: "tourist",
};
const onboardedProfile = { ...step1Profile, onboarding_completado_en: "2026-10-01T00:00:00Z" };

const base: PipelineInput = {
  hasSession: true,
  emailConfirmed: true,
  profile: onboardedProfile,
  request: null,
};

function withEstado(estado: MembershipRequestEstado): PipelineInput {
  return { ...base, request: { estado } };
}

function statuses(input: PipelineInput) {
  return membershipPipelineStep(input).steps.map((s) => s.status);
}

describe("MEMBERSHIP_PIPELINE_STEPS", () => {
  it("lists the eight visible steps in order with Spanish labels", () => {
    expect(MEMBERSHIP_PIPELINE_STEPS.map((s) => s.label)).toEqual([
      "Registro",
      "Verificación",
      "Perfil",
      "Solicitud",
      "Horario",
      "Entrevista",
      "Resolución",
      "Miembro",
    ]);
  });
});

describe("membershipPipelineStep", () => {
  it("starts at Registro without a session", () => {
    const r = membershipPipelineStep({ ...base, hasSession: false, profile: null });
    expect(r.current).toBe(1);
    expect(r.steps[0].status).toBe("current");
    expect(r.steps.slice(1).every((s) => s.status === "pending")).toBe(true);
  });

  it("is at Perfil with a session and no step1 data", () => {
    const r = membershipPipelineStep({ ...base, profile: null });
    expect(r.current).toBe(3);
    expect(statuses({ ...base, profile: null }).slice(0, 3)).toEqual(["done", "done", "current"]);
  });

  it("does not block on an unconfirmed email: Verificación stays pending, flow advances", () => {
    const input = { ...base, emailConfirmed: false, profile: null };
    const r = membershipPipelineStep(input);
    expect(r.current).toBe(3);
    expect(r.steps[1].status).toBe("pending");
  });

  it("treats step2 as optional: step1 complete is enough to reach Solicitud", () => {
    const r = membershipPipelineStep({ ...base, profile: step1Profile });
    expect(r.current).toBe(4);
    expect(r.steps[2].status).toBe("done");
  });

  it("is at Solicitud for an onboarded tourist without a request", () => {
    expect(membershipPipelineStep(base).current).toBe(4);
  });

  it.each<[MembershipRequestEstado, number]>([
    ["pendiente_coordinacion", 5],
    ["entrevista_solicitada", 5],
    ["reprogramacion", 5],
    ["entrevista_coordinada", 6],
    ["entrevista_realizada", 7],
  ])("maps %s to step %i", (estado, current) => {
    const r = membershipPipelineStep(withEstado(estado));
    expect(r.current).toBe(current);
    expect(r.halted).toBeUndefined();
    expect(r.steps[current - 1].status).toBe("current");
    expect(r.steps.slice(0, current - 1).every((s) => s.status === "done")).toBe(true);
    expect(r.steps.slice(current).every((s) => s.status === "pending")).toBe(true);
  });

  it("marks every step done when aprobado", () => {
    const r = membershipPipelineStep(withEstado("aprobado"));
    expect(r.current).toBe(8);
    expect(r.steps.every((s) => s.status === "done")).toBe(true);
  });

  it("treats a non-tourist tier as member even without a request", () => {
    const r = membershipPipelineStep({
      ...base,
      profile: { ...onboardedProfile, tier: "standard" },
    });
    expect(r.current).toBe(8);
    expect(r.steps.every((s) => s.status === "done")).toBe(true);
  });

  it("halts on cerrada after Solicitud", () => {
    const r = membershipPipelineStep(withEstado("cerrada"));
    expect(r.halted).toBe("cerrada");
    expect(r.current).toBe(4);
    expect(statuses(withEstado("cerrada"))).toEqual([
      "done",
      "done",
      "done",
      "done",
      "pending",
      "pending",
      "pending",
      "pending",
    ]);
  });

  it("covers every ZER-143 state without throwing", () => {
    for (const estado of MEMBERSHIP_REQUEST_ESTADOS) {
      expect(() => membershipPipelineStep(withEstado(estado))).not.toThrow();
    }
  });
});

describe("resolveUnirmeTarget", () => {
  const ok = { profileError: false, requestError: false };

  it("sends a visitor without session to signup carrying /unirme", () => {
    expect(resolveUnirmeTarget({ ...base, ...ok, hasSession: false, profile: null })).toBe(
      "/auth/signup?next=%2Funirme",
    );
  });

  it("soft-allows to / when the profile read fails", () => {
    expect(resolveUnirmeTarget({ ...base, ...ok, profileError: true, profile: null })).toBe("/");
  });

  it("sends a user without step1 data to step1", () => {
    expect(resolveUnirmeTarget({ ...base, ...ok, profile: null })).toBe("/onboarding/step1");
  });

  it("sends a user with step1 but onboarding open to step2", () => {
    expect(resolveUnirmeTarget({ ...base, ...ok, profile: step1Profile })).toBe(
      "/onboarding/step2",
    );
  });

  it("sends an onboarded tourist without requests to /solicitar", () => {
    expect(resolveUnirmeTarget({ ...base, ...ok })).toBe("/solicitar");
  });

  it("soft-allows to / when the request read fails", () => {
    expect(resolveUnirmeTarget({ ...base, ...ok, requestError: true })).toBe("/");
  });

  it.each(MEMBERSHIP_REQUEST_ESTADOS)(
    "sends a user with a %s request to the status page",
    (estado) => {
      expect(resolveUnirmeTarget({ ...withEstado(estado), ...ok })).toBe("/solicitar/estado");
    },
  );

  it("sends a member to the status page", () => {
    expect(
      resolveUnirmeTarget({ ...base, ...ok, profile: { ...onboardedProfile, tier: "standard" } }),
    ).toBe("/solicitar/estado");
  });

  it("never resolves to /unirme itself", () => {
    const inputs = [
      { ...base, ...ok, hasSession: false, profile: null },
      { ...base, ...ok, profile: null },
      { ...base, ...ok },
      { ...withEstado("cerrada"), ...ok },
    ];
    for (const input of inputs) {
      expect(resolveUnirmeTarget(input).startsWith("/unirme")).toBe(false);
    }
  });
});

describe("screenProgress", () => {
  it("places the onboarding screens on Perfil, with everything before it done", () => {
    const r = screenProgress("perfil", { emailConfirmed: true });
    expect(r.current).toBe(3);
    expect(r.steps.map((s) => s.status)).toEqual([
      "done",
      "done",
      "current",
      "pending",
      "pending",
      "pending",
      "pending",
      "pending",
    ]);
  });

  it("keeps Verificación pending (non-blocking) when the email is unconfirmed", () => {
    const r = screenProgress("solicitud", { emailConfirmed: false });
    expect(r.current).toBe(4);
    expect(r.steps[1].status).toBe("pending");
    expect(r.steps[2].status).toBe("done");
  });

  it("places the sent screen on Horario", () => {
    expect(screenProgress("horario", { emailConfirmed: true }).current).toBe(5);
  });
});
