import {
  isOnboardingComplete,
  isStep1Complete,
  type OnboardingGateProfile,
} from "@/features/profile/onboarding-gate";
import type { MembershipRequestEstado } from "./request-state";

/**
 * ZER-136 membership pipeline: the visible progress of "Quiero ser Serrano".
 * Pure UI decisions over ZER-143 states (read-only contract); authorization
 * stays in RLS.
 */

export type PipelineStepKey =
  | "registro"
  | "verificacion"
  | "perfil"
  | "solicitud"
  | "horario"
  | "entrevista"
  | "resolucion"
  | "miembro";

export const MEMBERSHIP_PIPELINE_STEPS: readonly { key: PipelineStepKey; label: string }[] = [
  { key: "registro", label: "Registro" },
  { key: "verificacion", label: "Verificación" },
  { key: "perfil", label: "Perfil" },
  { key: "solicitud", label: "Solicitud" },
  { key: "horario", label: "Horario" },
  { key: "entrevista", label: "Entrevista" },
  { key: "resolucion", label: "Resolución" },
  { key: "miembro", label: "Miembro" },
];

export type PipelineStepStatus = "done" | "current" | "pending";

export type PipelineInput = {
  hasSession: boolean;
  emailConfirmed: boolean;
  profile: OnboardingGateProfile | null;
  /** Latest request of the user (active one, else most recent), any state. */
  request: { estado: MembershipRequestEstado } | null;
};

export type PipelineProgress = {
  /** 1-based index of the step the user is on. */
  current: number;
  steps: { key: PipelineStepKey; label: string; status: PipelineStepStatus }[];
  halted?: "cerrada";
};

const PAST_HORARIO: ReadonlySet<MembershipRequestEstado> = new Set([
  "entrevista_coordinada",
  "entrevista_realizada",
  "aprobado",
]);
const PAST_ENTREVISTA: ReadonlySet<MembershipRequestEstado> = new Set([
  "entrevista_realizada",
  "aprobado",
]);

function isMember(input: PipelineInput): boolean {
  const tier = input.profile?.tier;
  return (Boolean(tier) && tier !== "tourist") || input.request?.estado === "aprobado";
}

function doneFlags(input: PipelineInput): Record<PipelineStepKey, boolean> {
  const estado = input.request?.estado;
  const member = isMember(input);
  return {
    registro: input.hasSession,
    verificacion: input.hasSession && input.emailConfirmed,
    perfil: member || (input.hasSession && isStep1Complete(input.profile)),
    solicitud: member || (input.hasSession && input.request !== null),
    horario: member || (estado !== undefined && PAST_HORARIO.has(estado)),
    entrevista: member || (estado !== undefined && PAST_ENTREVISTA.has(estado)),
    resolucion: member,
    miembro: member,
  };
}

export function membershipPipelineStep(input: PipelineInput): PipelineProgress {
  const done = doneFlags(input);
  const halted = input.request?.estado === "cerrada" && !isMember(input);

  // Verificación never blocks (ZER-135 owns enforcement): skip it when
  // looking for the first unfinished step.
  const blocking = MEMBERSHIP_PIPELINE_STEPS.findIndex(
    (s) => s.key !== "verificacion" && !done[s.key],
  );
  const current = halted
    ? MEMBERSHIP_PIPELINE_STEPS.findIndex((s) => s.key === "solicitud") + 1
    : blocking === -1
      ? MEMBERSHIP_PIPELINE_STEPS.length
      : blocking + 1;

  const steps = MEMBERSHIP_PIPELINE_STEPS.map((step, i) => {
    let status: PipelineStepStatus;
    if (done[step.key]) status = "done";
    else if (!halted && i + 1 === current) status = "current";
    else status = "pending";
    return { ...step, status };
  });

  return halted ? { current, steps, halted: "cerrada" } : { current, steps };
}

export type UnirmeInput = PipelineInput & {
  /** Infra failure reading the profile (not "no rows"). */
  profileError: boolean;
  /** Infra failure reading the requests. */
  requestError: boolean;
};

export const UNIRME_PATH = "/unirme";
export const MEMBERSHIP_STATUS_PATH = "/solicitar/estado";

/**
 * Where `/unirme` sends the user. Never returns `/unirme` itself, so the deep
 * link cannot loop. Infra read errors soft-allow to "/" like the onboarding gate.
 */
export function resolveUnirmeTarget(input: UnirmeInput): string {
  if (!input.hasSession) return `/auth/signup?next=${encodeURIComponent(UNIRME_PATH)}`;
  if (input.profileError) return "/";
  if (!isStep1Complete(input.profile) || !isOnboardingComplete(input.profile)) {
    return "/onboarding/step1";
  }
  if (isMember(input)) return MEMBERSHIP_STATUS_PATH;
  if (input.requestError) return "/";
  // Any request, including cerrada: no re-application for now (AC8, ZER-180).
  if (input.request) return MEMBERSHIP_STATUS_PATH;
  return "/solicitar";
}

/**
 * Progress for a fixed flow screen (onboarding steps, /solicitar, enviado):
 * the screen defines the current step and everything before it is done,
 * except Verificación, which reflects the real email state but never blocks.
 */
export function screenProgress(
  step: PipelineStepKey,
  { emailConfirmed }: { emailConfirmed: boolean },
): PipelineProgress {
  const current = MEMBERSHIP_PIPELINE_STEPS.findIndex((s) => s.key === step) + 1;
  const steps = MEMBERSHIP_PIPELINE_STEPS.map((s, i) => {
    let status: PipelineStepStatus;
    if (i + 1 === current) status = "current";
    else if (i + 1 > current) status = "pending";
    else if (s.key === "verificacion" && !emailConfirmed) status = "pending";
    else status = "done";
    return { ...s, status };
  });
  return { current, steps };
}
