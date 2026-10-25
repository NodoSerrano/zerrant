import { describe, expect, it } from "vitest";
import {
  computeSkillDiff,
  dedupeSkillNames,
  formatSkillExperience,
  normalizeSkillName,
  parseSkillItems,
  suggestSkills,
} from "./skills";

describe("normalizeSkillName", () => {
  it("trims and collapses internal whitespace", () => {
    expect(normalizeSkillName("  IA   /   LLMs  ")).toBe("IA / LLMs");
  });

  it("returns null for empty or whitespace-only input", () => {
    expect(normalizeSkillName("")).toBeNull();
    expect(normalizeSkillName("   ")).toBeNull();
    expect(normalizeSkillName("\t\n")).toBeNull();
  });
});

describe("dedupeSkillNames", () => {
  it("removes case-insensitive duplicates keeping the first casing", () => {
    expect(dedupeSkillNames(["Solidity", "solidity", "React", "react", "SOLIDITY"])).toEqual([
      "Solidity",
      "React",
    ]);
  });

  it("returns an empty array for empty input", () => {
    expect(dedupeSkillNames([])).toEqual([]);
  });
});

describe("computeSkillDiff", () => {
  it("computes additions and removals", () => {
    expect(computeSkillDiff(["a", "b", "c"], ["b", "c", "d"])).toEqual({
      toAdd: ["d"],
      toRemove: ["a"],
    });
  });

  it("returns empty diffs when the sets are equal", () => {
    expect(computeSkillDiff(["a", "b"], ["a", "b"])).toEqual({ toAdd: [], toRemove: [] });
  });

  it("adds everything when current is empty", () => {
    expect(computeSkillDiff([], ["a", "b"])).toEqual({ toAdd: ["a", "b"], toRemove: [] });
  });

  it("removes everything when target is empty", () => {
    expect(computeSkillDiff(["a", "b"], [])).toEqual({ toAdd: [], toRemove: ["a", "b"] });
  });
});

describe("suggestSkills", () => {
  const catalog = ["Rust", "Solidity", "ZK Proofs", "DevOps", "Matemática"];

  it("lists catalog skills not already selected", () => {
    expect(suggestSkills(catalog, ["solidity"], "")).toEqual([
      "Rust",
      "ZK Proofs",
      "DevOps",
      "Matemática",
    ]);
  });

  it("filters by a case-insensitive substring", () => {
    expect(suggestSkills(catalog, [], "o")).toEqual(["Solidity", "ZK Proofs", "DevOps"]);
  });

  it("returns an empty list when everything is selected", () => {
    expect(suggestSkills(["Rust"], ["rust"], "")).toEqual([]);
  });

  it("preserves catalog order", () => {
    expect(suggestSkills(catalog, [], "")).toEqual(catalog);
  });
});

describe("parseSkillItems (ZER-163)", () => {
  it("parses names with optional level and years, deduping by case", () => {
    const raw = JSON.stringify([
      { nombre: " IA ", nivel: "avanzado", anios_freelance: "3", anios_empresa: 5 },
      { nombre: "ia", nivel: "basico", anios_freelance: 1, anios_empresa: 1 },
      { nombre: "Diseño", nivel: "", anios_freelance: "", anios_empresa: null },
    ]);
    expect(parseSkillItems(raw)).toEqual({
      items: [
        { nombre: "IA", nivel: "avanzado", anios_freelance: 3, anios_empresa: 5 },
        { nombre: "Diseño", nivel: null, anios_freelance: null, anios_empresa: null },
      ],
    });
  });

  it.each([
    ["not JSON", "{"],
    ["not a list", JSON.stringify({ nombre: "IA" })],
    ["an unknown level", JSON.stringify([{ nombre: "IA", nivel: "experto" }])],
    ["years over 60", JSON.stringify([{ nombre: "IA", anios_freelance: 61 }])],
    ["negative years", JSON.stringify([{ nombre: "IA", anios_empresa: -1 }])],
    ["fractional years", JSON.stringify([{ nombre: "IA", anios_empresa: 1.5 }])],
  ])("rejects %s", (_case, raw) => {
    expect(parseSkillItems(raw)).toEqual({ error: "Revisá el nivel y los años de experiencia" });
  });

  it("drops blank names and treats a missing field as an empty list", () => {
    expect(parseSkillItems(JSON.stringify([{ nombre: "  " }]))).toEqual({ items: [] });
    expect(parseSkillItems(null)).toEqual({ items: [] });
  });
});

describe("formatSkillExperience (ZER-163)", () => {
  it("joins level and both kinds of years", () => {
    expect(formatSkillExperience({ nivel: "avanzado", anios_freelance: 3, anios_empresa: 1 })).toBe(
      "Avanzado · 3 años freelance · 1 año en empresa",
    );
  });

  it("leaves out what is not set", () => {
    expect(formatSkillExperience({ nivel: null, anios_freelance: null, anios_empresa: 2 })).toBe(
      "2 años en empresa",
    );
    expect(formatSkillExperience({ nivel: null, anios_freelance: null, anios_empresa: null })).toBe(
      "",
    );
  });
});
