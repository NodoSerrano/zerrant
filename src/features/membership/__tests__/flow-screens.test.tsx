import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { screenProgress } from "@/features/membership/pipeline";

const mocks = vi.hoisted(() => ({
  getFlowProgress: vi.fn(),
  getOnboardingGateProfile: vi.fn(),
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
}));

vi.mock("@/features/membership/flow-progress", () => ({ getFlowProgress: mocks.getFlowProgress }));
vi.mock("@/features/profile/onboarding-gate-server", () => ({
  getOnboardingGateProfile: mocks.getOnboardingGateProfile,
}));
vi.mock("@/features/profile/actions", () => ({
  saveOnboardingStep1: vi.fn(),
  uploadAvatar: vi.fn(),
}));
vi.mock("@/features/membership/actions", () => ({ createMembershipRequest: vi.fn() }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ back: vi.fn(), push: vi.fn() }),
  redirect: (url: string) => mocks.redirect(url),
}));

import { Step1Form } from "@/app/(onboarding)/onboarding/step1/Step1Form";
import { SolicitarForm } from "@/app/(modal)/solicitar/SolicitarForm";
import { EnviadoConfirmation } from "@/app/(modal)/solicitar/enviado/EnviadoConfirmation";
import OnboardingStep1 from "@/app/(onboarding)/onboarding/step1/page";
import OnboardingStep2 from "@/app/(onboarding)/onboarding/step2/page";

const perfil = screenProgress("perfil", { emailConfirmed: true });

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getOnboardingGateProfile.mockResolvedValue({ profile: null, error: null, userId: "u1" });
});

describe("flow screens show the pipeline (Pencil 1.5m/1.6m/1.7m/1.9m)", () => {
  it("Step1Form swaps 'Paso 1 de 2' for the pipeline progress in the flow", () => {
    render(<Step1Form progress={perfil} />);

    expect(screen.getByRole("progressbar")).toHaveAttribute(
      "aria-valuetext",
      "Paso 3 de 8: Perfil",
    );
    expect(screen.queryByText("Paso 1 de 2")).not.toBeInTheDocument();
  });

  it("Step1Form keeps 'Paso 1 de 2' outside the flow", () => {
    render(<Step1Form />);

    expect(screen.getByText("Paso 1 de 2")).toBeInTheDocument();
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
  });

  it("SolicitarForm shows Solicitud next to its back button in the flow", () => {
    render(<SolicitarForm progress={screenProgress("solicitud", { emailConfirmed: true })} />);

    expect(screen.getByRole("button", { name: "Volver" })).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toHaveAttribute(
      "aria-valuetext",
      "Paso 4 de 8: Solicitud",
    );
  });

  it("SolicitarForm has no pipeline progress outside the flow", () => {
    render(<SolicitarForm />);
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
  });

  it("Enviado continues to the status page in the flow", () => {
    render(<EnviadoConfirmation progress={screenProgress("horario", { emailConfirmed: true })} />);

    expect(screen.getByRole("progressbar")).toHaveAttribute(
      "aria-valuetext",
      "Paso 5 de 8: Horario",
    );
    expect(screen.getByRole("link", { name: "Ver mi proceso" })).toHaveAttribute(
      "href",
      "/solicitar/estado",
    );
    expect(screen.queryByText("Volver al inicio")).not.toBeInTheDocument();
  });

  it("Enviado keeps 'Volver al inicio' outside the flow", () => {
    render(<EnviadoConfirmation />);

    expect(screen.getByRole("link", { name: "Volver al inicio" })).toHaveAttribute("href", "/");
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
  });
});

describe("pages wire the flow progress", () => {
  it("step1 page asks for Perfil and forwards it", async () => {
    mocks.getFlowProgress.mockResolvedValue(perfil);
    render(await OnboardingStep1());

    expect(mocks.getFlowProgress).toHaveBeenCalledWith("perfil");
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });

  it("step2 page redirects to the single profile screen", async () => {
    await expect(OnboardingStep2()).rejects.toThrow("NEXT_REDIRECT:/onboarding/step1");
    expect(mocks.getFlowProgress).not.toHaveBeenCalled();
  });

  it("pages render the tourist version when the flow is off", async () => {
    mocks.getFlowProgress.mockResolvedValue(null);
    render(await OnboardingStep1());

    expect(screen.getByText("Paso 1 de 2")).toBeInTheDocument();
  });
});

describe("re-verification at 375px (bug-375 #2, #3, #4)", () => {
  it("#2 Enviado: the stepper sits in the normal flow above the centered content, never overlaid", () => {
    render(<EnviadoConfirmation progress={screenProgress("horario", { emailConfirmed: true })} />);
    const bar = screen.getByRole("progressbar");
    const stepper = bar.parentElement!;
    const circle = document.querySelector(".lucide-check")!.closest("div")!;

    expect(stepper.className).not.toMatch(/\babsolute\b/);
    const centered = circle.closest(".justify-center.flex-1");
    expect(centered).not.toBeNull();
    expect(centered!.contains(stepper)).toBe(false);
  });

  it("#2 Enviado: fills the modal slot and leaves a gap under the stepper", () => {
    const { container } = render(
      <EnviadoConfirmation progress={screenProgress("horario", { emailConfirmed: true })} />,
    );
    const root = container.firstElementChild as HTMLElement;

    expect(root).toHaveClass("flex-1", "flex-col");
    expect(root.className).toMatch(/\bgap-/);
  });
});
