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
  disponibilidad: "disponible" as const,
  bio: "Construyo infraestructura.",
  contacto_telegram: "@nobel",
  tarifa_hora: 40,
  visibilidad_tarifa: "privada" as const,
};

const roles = ["Infra", "Charlas"];
const skills = ["Solidity"];

describe("buildSerranoMemberDetail", () => {
  it("computes the visible name", () => {
    const result = buildSerranoMemberDetail(profile, roles, skills, {
      isSelf: false,
      isAdmin: false,
    });
    expect(result.name).toBe("Nóbel Dam");
  });

  it("maps avatar, tier, disponibilidad, bio, roles and skills", () => {
    const result = buildSerranoMemberDetail(profile, roles, skills, {
      isSelf: false,
      isAdmin: false,
    });
    expect(result.avatarUrl).toBeNull();
    expect(result.tier).toBe("standard");
    expect(result.disponibilidad).toBe("disponible");
    expect(result.bio).toBe("Construyo infraestructura.");
    expect(result.roles).toEqual(["Infra", "Charlas"]);
    expect(result.skills).toEqual(["Solidity"]);
  });

  it("normalizes the telegram handle to a t.me deep link", () => {
    const result = buildSerranoMemberDetail(profile, roles, skills, {
      isSelf: false,
      isAdmin: false,
    });
    expect(result.telegramHref).toBe("https://t.me/nobel");
  });

  it("nulls telegramHref when no handle is set", () => {
    const result = buildSerranoMemberDetail(
      { ...profile, contacto_telegram: null },
      roles,
      skills,
      { isSelf: false, isAdmin: false },
    );
    expect(result.telegramHref).toBeNull();
  });

  it("strips tarifaHora for a third-party serrano when visibilidad is privada", () => {
    const result = buildSerranoMemberDetail(profile, roles, skills, {
      isSelf: false,
      isAdmin: false,
    });
    expect(result.tarifaHora).toBeNull();
  });

  it("keeps tarifaHora for self", () => {
    const result = buildSerranoMemberDetail(profile, roles, skills, {
      isSelf: true,
      isAdmin: false,
    });
    expect(result.tarifaHora).toBe(40);
  });

  it("keeps tarifaHora for admin", () => {
    const result = buildSerranoMemberDetail(profile, roles, skills, {
      isSelf: false,
      isAdmin: true,
    });
    expect(result.tarifaHora).toBe(40);
  });

  it("keeps tarifaHora for any serrano when visibilidad is publica", () => {
    const result = buildSerranoMemberDetail(
      { ...profile, visibilidad_tarifa: "publica" },
      roles,
      skills,
      { isSelf: false, isAdmin: false },
    );
    expect(result.tarifaHora).toBe(40);
  });

  it("nulls tarifaHora when the profile has no rate", () => {
    const result = buildSerranoMemberDetail({ ...profile, tarifa_hora: null }, roles, skills, {
      isSelf: true,
      isAdmin: false,
    });
    expect(result.tarifaHora).toBeNull();
  });
});
