import { describe, expect, it } from "vitest";
import { filterSerranos, availableRoles, availableSkills } from "./filter";
import type { PlantelFilters, SerranoMember } from "./types";

function member(overrides: Partial<SerranoMember> = {}): SerranoMember {
  return {
    id: "p1",
    name: "Nóbel Dam",
    nombre: "Nóbel",
    apellido: "Dam",
    apodo: null,
    avatarUrl: null,
    tier: "standard",
    disponibilidad: "disponible",
    roles: ["Infra"],
    skills: ["Solidity", "IA"],
    ...overrides,
  };
}

const members: SerranoMember[] = [
  member(),
  member({
    id: "p2",
    name: "Ada Lovelace",
    nombre: "Ada",
    apellido: "Lovelace",
    tier: "founder",
    disponibilidad: "ocupado",
    roles: ["Tesorería"],
    skills: ["Diseño"],
  }),
  member({
    id: "p3",
    name: "Alan Turing",
    nombre: "Alan",
    apellido: "Turing",
    apodo: "turing",
    disponibilidad: "solo_eventos",
    roles: ["Charlas", "Infra"],
    skills: [],
  }),
];

function filters(overrides: Partial<PlantelFilters> = {}): PlantelFilters {
  return { q: "", soloDisponibles: false, rol: null, skill: null, ...overrides };
}

describe("filterSerranos", () => {
  it("returns all members when no filters are set", () => {
    expect(filterSerranos(members, filters())).toHaveLength(3);
  });

  it("filters by visible name (case-insensitive substring)", () => {
    expect(filterSerranos(members, filters({ q: "ada" }))).toEqual([members[1]]);
  });

  it("filters by apodo", () => {
    expect(filterSerranos(members, filters({ q: "turing" }))).toEqual([members[2]]);
  });

  it("filters by apellido", () => {
    expect(filterSerranos(members, filters({ q: "lovelace" }))).toEqual([members[1]]);
  });

  it("filters by skill name", () => {
    expect(filterSerranos(members, filters({ q: "solidity" }))).toEqual([members[0]]);
  });

  it("trims and ignores empty query", () => {
    expect(filterSerranos(members, filters({ q: "   " }))).toHaveLength(3);
  });

  it("filters by disponibilidad when soloDisponibles is true", () => {
    expect(filterSerranos(members, filters({ soloDisponibles: true }))).toEqual([members[0]]);
  });

  it("filters by role (case-insensitive exact)", () => {
    expect(filterSerranos(members, filters({ rol: "infra" }))).toEqual([members[0], members[2]]);
  });

  it("filters by skill (case-insensitive exact)", () => {
    expect(filterSerranos(members, filters({ skill: "diseño" }))).toEqual([members[1]]);
  });

  it("combines search + role + disponibilidad filters", () => {
    const result = filterSerranos(
      members,
      filters({ q: "a", rol: "infra", soloDisponibles: true }),
    );
    expect(result).toEqual([members[0]]);
  });

  it("returns empty array when nothing matches", () => {
    expect(filterSerranos(members, filters({ q: "zzz" }))).toEqual([]);
  });
});

describe("availableRoles", () => {
  it("returns unique roles sorted alphabetically", () => {
    expect(availableRoles(members)).toEqual(["Charlas", "Infra", "Tesorería"]);
  });

  it("returns empty array for no members", () => {
    expect(availableRoles([])).toEqual([]);
  });
});

describe("availableSkills", () => {
  it("returns unique skills sorted alphabetically", () => {
    expect(availableSkills(members)).toEqual(["Diseño", "IA", "Solidity"]);
  });

  it("returns empty array for no members", () => {
    expect(availableSkills([])).toEqual([]);
  });
});
