import { describe, expect, it } from "vitest";
import { computeSkillDiff, dedupeSkillNames, normalizeSkillName, suggestSkills } from "./skills";

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
