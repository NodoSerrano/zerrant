import { describe, expect, it } from "vitest";
import { buildSerranoMemberDetail } from "./transform";

const profile = {
  id: "p1",
  nombre: "Nóbel",
  apellido: "Dam",
  apodo: null,
  nombre_visible: "nombre_apellido" as const,
  avatar_url: null,
  tier: "standard" as const,
  bio: "Construyo infraestructura.",
  contacto_telegram: "@nobel",
};

const roles = ["Infra", "Charlas"];
const skills = ["Solidity"];

describe("buildSerranoMemberDetail", () => {
  it("computes the visible name", () => {
    const result = buildSerranoMemberDetail(profile, roles, skills, {});
    expect(result.name).toBe("Nóbel Dam");
  });

  it("maps avatar, tier, bio, roles and skills without availability or a rate", () => {
    const result = buildSerranoMemberDetail(profile, roles, skills, {});
    expect(result.avatarUrl).toBeNull();
    expect(result.tier).toBe("standard");
    expect(result.bio).toBe("Construyo infraestructura.");
    expect(result.roles).toEqual(["Infra", "Charlas"]);
    expect(result.skills).toEqual(["Solidity"]);
    expect(result).not.toHaveProperty("disponibilidad");
    expect(result).not.toHaveProperty("tarifaHora");
  });

  it("maps is_platform_admin onto isPlatformAdmin", () => {
    const withAdmin = buildSerranoMemberDetail(
      { ...profile, is_platform_admin: true },
      roles,
      skills,
      {},
    );
    expect(withAdmin.isPlatformAdmin).toBe(true);

    const withoutAdmin = buildSerranoMemberDetail(profile, roles, skills, {});
    expect(withoutAdmin.isPlatformAdmin).toBe(false);
  });

  it("normalizes the telegram handle to a t.me deep link", () => {
    const result = buildSerranoMemberDetail(profile, roles, skills, {});
    expect(result.telegramHref).toBe("https://t.me/nobel");
  });

  it("nulls telegramHref when no handle is set", () => {
    const result = buildSerranoMemberDetail(
      { ...profile, contacto_telegram: null },
      roles,
      skills,
      {},
    );
    expect(result.telegramHref).toBeNull();
  });

  it("includes member aportes when provided", () => {
    const aportes = [
      {
        id: "a1",
        tipo: "donacion",
        descripcion: "Donó un proyector",
        monto: null,
        fecha: "2026-07-12",
      },
    ];
    const result = buildSerranoMemberDetail(profile, roles, skills, { aportes });
    expect(result.aportes).toEqual(aportes);
  });

  it("defaults aportes to an empty list when omitted", () => {
    const result = buildSerranoMemberDetail(profile, roles, skills, {});
    expect(result.aportes).toEqual([]);
  });

  it("includes member proyectos when provided", () => {
    const proyectos = [
      { id: "proj-1", nombre: "Nodo hub" },
      { id: "proj-2", nombre: "Taller ZK" },
    ];
    const result = buildSerranoMemberDetail(profile, roles, skills, { proyectos });
    expect(result.proyectos).toEqual(proyectos);
  });

  it("defaults proyectos to an empty list when omitted", () => {
    const result = buildSerranoMemberDetail(profile, roles, skills, {});
    expect(result.proyectos).toEqual([]);
  });
});
