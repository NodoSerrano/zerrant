import { describe, expect, it } from "vitest";
import { TASKS_BLOCKED_TIER, canOperateTasks, isTasksBlockedTier } from "./tier-guards";

describe("tier-guards (ZER-58)", () => {
  it("exports tourist as the single blocked tier constant", () => {
    expect(TASKS_BLOCKED_TIER).toBe("tourist");
  });

  it("isTasksBlockedTier is true only for tourist", () => {
    expect(isTasksBlockedTier("tourist")).toBe(true);
    expect(isTasksBlockedTier("standard")).toBe(false);
    expect(isTasksBlockedTier("scholar")).toBe(false);
    expect(isTasksBlockedTier("founder")).toBe(false);
  });

  it("isTasksBlockedTier is false for null, undefined, and empty string", () => {
    // Equality-only helper: missing profile stays at call sites (!profile).
    expect(isTasksBlockedTier(null)).toBe(false);
    expect(isTasksBlockedTier(undefined)).toBe(false);
    expect(isTasksBlockedTier("")).toBe(false);
  });

  it("canOperateTasks is false for tourist, null, undefined, and empty", () => {
    expect(canOperateTasks("tourist")).toBe(false);
    expect(canOperateTasks(null)).toBe(false);
    expect(canOperateTasks(undefined)).toBe(false);
    expect(canOperateTasks("")).toBe(false);
  });

  it("canOperateTasks is true for standard, scholar, and founder", () => {
    expect(canOperateTasks("standard")).toBe(true);
    expect(canOperateTasks("scholar")).toBe(true);
    expect(canOperateTasks("founder")).toBe(true);
  });
});
