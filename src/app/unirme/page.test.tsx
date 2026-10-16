import { existsSync } from "node:fs";
import { join } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";
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

import UnirmePage from "./page";

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
  request: null,
  profileError: false,
  requestError: false,
};

beforeEach(() => vi.clearAllMocks());

describe("/unirme page (regression bug-375)", () => {
  it("is a page, not a route handler: server actions that redirect here must land on a real URL", () => {
    expect(existsSync(join(__dirname, "route.ts"))).toBe(false);
  });

  it("redirects an onboarded tourist to /solicitar", async () => {
    mocks.load.mockResolvedValue(onboarded);
    await expect(UnirmePage()).rejects.toThrow("NEXT_REDIRECT:/solicitar");
  });

  it("redirects a visitor without session to signup carrying next", async () => {
    mocks.load.mockResolvedValue({ ...onboarded, hasSession: false, profile: null });
    await expect(UnirmePage()).rejects.toThrow("NEXT_REDIRECT:/auth/signup?next=%2Funirme");
  });

  it("sends a cerrada request to the status page", async () => {
    mocks.load.mockResolvedValue({ ...onboarded, request: { estado: "cerrada" } });
    await expect(UnirmePage()).rejects.toThrow("NEXT_REDIRECT:/solicitar/estado");
  });
});
