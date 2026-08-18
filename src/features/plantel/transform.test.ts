import { describe, expect, it } from "vitest";
import { buildSerranoMembers, availabilityLabel } from "./transform";

const profiles = [
  {
    id: "p1",
    nombre: "Nóbel",
    apellido: "Dam",
    apodo: null,
    nombre_visible: "nombre_apellido" as const,
    avatar_url: null,
    tier: "standard" as const,
    disponibilidad: "disponible" as const,
  },
  {
    id: "p2",
    nombre: "Ada",
    apellido: "Lovelace",
    apodo: "ada",
    nombre_visible: "apodo" as const,
    avatar_url: "https://x/ada.png",
    tier: "founder" as const,
    disponibilidad: "ocupado" as const,
  },
  {
    id: "p3",
    nombre: "Tourist",
    apellido: "Guy",
    apodo: null,
    nombre_visible: "apellido_nombre" as const,
    avatar_url: null,
    tier: "tourist" as const,
    disponibilidad: null,
  },
];

const roleAssignments = [
  { profile_id: "p1", roles: { nombre: "Infra" } },
  { profile_id: "p2", roles: { nombre: "Tesorería" } },
  { profile_id: "p2", roles: null },
];

const skillAssignments = [
  { profile_id: "p1", skills: { nombre: "Solidity" } },
  { profile_id: "p1", skills: { nombre: "IA" } },
];

describe("buildSerranoMembers", () => {
  it("excludes tourists", () => {
    const result = buildSerranoMembers(profiles, roleAssignments, skillAssignments);
    expect(result.map((m) => m.id)).toEqual(["p1", "p2"]);
  });

  it("computes name via nombre_visible=nombre_apellido", () => {
    const result = buildSerranoMembers(profiles, roleAssignments, skillAssignments);
    expect(result[0].name).toBe("Nóbel Dam");
  });

  it("computes name via nombre_visible=apodo", () => {
    const result = buildSerranoMembers(profiles, roleAssignments, skillAssignments);
    expect(result[1].name).toBe("ada");
  });

  it("joins roles and skills per profile, ignoring null embeds", () => {
    const result = buildSerranoMembers(profiles, roleAssignments, skillAssignments);
    expect(result[0].roles).toEqual(["Infra"]);
    expect(result[0].skills).toEqual(["Solidity", "IA"]);
    expect(result[1].roles).toEqual(["Tesorería"]);
    expect(result[1].skills).toEqual([]);
  });

  it("maps avatar_url and disponibilidad", () => {
    const result = buildSerranoMembers(profiles, roleAssignments, skillAssignments);
    expect(result[0].avatarUrl).toBeNull();
    expect(result[0].disponibilidad).toBe("disponible");
    expect(result[1].avatarUrl).toBe("https://x/ada.png");
  });
});

describe("availabilityLabel", () => {
  it("maps the three states and null", () => {
    expect(availabilityLabel("disponible")).toBe("Disponible");
    expect(availabilityLabel("ocupado")).toBe("Ocupado");
    expect(availabilityLabel("solo_eventos")).toBe("Solo eventos");
    expect(availabilityLabel(null)).toBeNull();
  });
});
