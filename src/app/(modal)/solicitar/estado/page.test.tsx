import { render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { UnirmeInput } from "@/features/membership/pipeline";

const mocks = vi.hoisted(() => ({
  load: vi.fn(),
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
}));

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn().mockResolvedValue({}) }));
vi.mock("@/features/membership/pipeline-server", () => ({ loadMembershipPipeline: mocks.load }));
vi.mock("next/navigation", () => ({ redirect: (u: string) => mocks.redirect(u) }));

import EstadoPage from "./page";

const onboarded: UnirmeInput = {
  hasSession: true,
  emailConfirmed: true,
  profile: {
    nombre: "Ana",
    apellido: "Paz",
    fecha_nacimiento: "1990-01-01",
    onboarding_completado_en: "2026-10-01T00:00:00Z",
    tier: "tourist",
  },
  request: { estado: "pendiente_coordinacion" },
  profileError: false,
  requestError: false,
};

async function renderWith(input: UnirmeInput) {
  mocks.load.mockResolvedValue(input);
  render(await EstadoPage());
}

function stepStatuses() {
  return screen
    .getAllByRole("listitem")
    .map((li) => [li.getAttribute("data-step"), li.getAttribute("data-status")]);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("/solicitar/estado (Pencil 1.10)", () => {
  it("shows the title, the 2.7b card and the eight-step timeline for an active request", async () => {
    await renderWith(onboarded);

    expect(screen.getByRole("heading", { name: "Tu camino a Serrano" })).toBeInTheDocument();
    expect(screen.getByText("Seguí en qué paso está tu solicitud.")).toBeInTheDocument();
    expect(screen.getByText("Pendiente de coordinación")).toBeInTheDocument();
    expect(stepStatuses()).toEqual([
      ["registro", "done"],
      ["verificacion", "done"],
      ["perfil", "done"],
      ["solicitud", "done"],
      ["horario", "current"],
      ["entrevista", "pending"],
      ["resolucion", "pending"],
      ["miembro", "pending"],
    ]);
    const current = screen.getAllByRole("listitem")[4];
    expect(within(current).getByText("Ahora")).toBeInTheDocument();
    expect(current).toHaveAttribute("aria-current", "step");
  });

  it("marks an unconfirmed email as non-blocking", async () => {
    await renderWith({ ...onboarded, emailConfirmed: false });
    const verif = screen.getAllByRole("listitem")[1];

    expect(verif).toHaveAttribute("data-status", "pending");
    expect(within(verif).getByText("Pendiente · no bloquea")).toBeInTheDocument();
  });

  it("offers Ir a mi perfil and a close link to the profile", async () => {
    await renderWith(onboarded);

    expect(screen.getByRole("link", { name: "Ir a mi perfil" })).toHaveAttribute(
      "href",
      "/profile",
    );
    expect(screen.getByRole("link", { name: "Cerrar" })).toHaveAttribute("href", "/profile");
  });

  it("shows the reprogramación card on Horario", async () => {
    await renderWith({ ...onboarded, request: { estado: "reprogramacion" } });

    expect(screen.getByText("Reprogramación requerida")).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")[4]).toHaveAttribute("data-status", "current");
  });

  it("celebrates aprobado with every step done and Entrar a Nodo", async () => {
    await renderWith({ ...onboarded, request: { estado: "aprobado" } });

    expect(screen.getByText("Aprobado como miembro")).toBeInTheDocument();
    expect(
      screen.getByText(
        "¡Ya sos Serrano! Desde ahora aparecés en el plantel y podés sumarte a eventos y proyectos.",
      ),
    ).toBeInTheDocument();
    expect(stepStatuses().every(([, s]) => s === "done")).toBe(true);
    expect(screen.getByRole("link", { name: "Entrar a Nodo" })).toHaveAttribute("href", "/");
  });

  it("treats a non-tourist without request as member", async () => {
    await renderWith({
      ...onboarded,
      request: null,
      profile: { ...onboarded.profile!, tier: "standard" },
    });

    expect(screen.getByText("Aprobado como miembro")).toBeInTheDocument();
  });

  it("shows a member as approved even if an old request was cerrada", async () => {
    await renderWith({
      ...onboarded,
      request: { estado: "cerrada" },
      profile: { ...onboarded.profile!, tier: "standard" },
    });

    expect(screen.getByText("Aprobado como miembro")).toBeInTheDocument();
    expect(screen.queryByText("Solicitud cerrada")).not.toBeInTheDocument();
  });

  it("#3 keeps the close button inside the top bar, with air above it (no negative margin)", async () => {
    await renderWith(onboarded);
    const close = screen.getByRole("link", { name: "Cerrar" });

    expect(close).toHaveClass("size-11");
    expect(close.className).not.toMatch(/(^|\s)-m[ty]?-/);
  });

  it("puts the close button at the start of the top bar, like Pencil 1.10", async () => {
    await renderWith(onboarded);

    expect(screen.getByRole("link", { name: "Cerrar" }).parentElement).toHaveClass("justify-start");
  });

  describe("cerrada (ZER-180)", () => {
    beforeEach(() => {
      vi.useFakeTimers({ toFake: ["Date"] });
      vi.setSystemTime(new Date("2026-10-26T15:00:00.000Z"));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("says from when they can apply again and does not offer it yet", async () => {
      await renderWith({
        ...onboarded,
        request: {
          estado: "cerrada",
          cerradaEn: "2026-10-20T15:00:00.000Z",
          reaperturaHabilitadaEn: null,
        },
      });

      expect(screen.getByText("Solicitud cerrada")).toBeInTheDocument();
      expect(
        screen.getByText(
          "Tu solicitud se cerró. Podés enviar una nueva desde el 19 de noviembre. Si creés que es un error, hablá con un admin de Nodo.",
        ),
      ).toBeInTheDocument();
      expect(stepStatuses().map(([, s]) => s)).toEqual([
        "done",
        "done",
        "done",
        "done",
        "pending",
        "pending",
        "pending",
        "pending",
      ]);
      expect(screen.queryByRole("link", { name: "Volver a solicitar" })).not.toBeInTheDocument();
    });

    it("offers Volver a solicitar once it is allowed", async () => {
      await renderWith({
        ...onboarded,
        request: {
          estado: "cerrada",
          cerradaEn: "2026-10-25T15:00:00.000Z",
          reaperturaHabilitadaEn: "2026-10-26T10:00:00.000Z",
        },
      });

      expect(
        screen.getByText("Tu solicitud se cerró. Ya podés enviar una nueva."),
      ).toBeInTheDocument();
      expect(screen.getByRole("link", { name: "Volver a solicitar" })).toHaveAttribute(
        "href",
        "/solicitar",
      );
    });
  });

  it("sends a tourist without any request to /solicitar", async () => {
    await expect(renderWith({ ...onboarded, request: null })).rejects.toThrow(
      "NEXT_REDIRECT:/solicitar",
    );
  });

  it("sends a visitor without session to login carrying next", async () => {
    await expect(
      renderWith({ ...onboarded, hasSession: false, profile: null, request: null }),
    ).rejects.toThrow("NEXT_REDIRECT:/auth/login?next=%2Fsolicitar%2Festado");
  });

  it.each([
    ["profile", { profileError: true }],
    ["request", { requestError: true }],
  ])("falls back to /profile on a %s read error (never invents progress)", async (_l, ov) => {
    await expect(renderWith({ ...onboarded, ...ov, request: null })).rejects.toThrow(
      "NEXT_REDIRECT:/profile",
    );
  });
});
