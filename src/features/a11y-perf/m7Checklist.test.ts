import { describe, expect, it } from "vitest";
import { M7_A11Y_PERF_CHECKLIST, checklistSummary } from "./m7Checklist";

describe("M7 a11y+perf checklist (ZER-104)", () => {
  it("covers a11y and perf with only pass/n-a items (bounded evidence)", () => {
    expect(M7_A11Y_PERF_CHECKLIST.length).toBeGreaterThanOrEqual(6);
    expect(M7_A11Y_PERF_CHECKLIST.some((i) => i.area === "a11y")).toBe(true);
    expect(M7_A11Y_PERF_CHECKLIST.some((i) => i.area === "perf")).toBe(true);
    for (const item of M7_A11Y_PERF_CHECKLIST) {
      expect(["pass", "n/a"]).toContain(item.status);
      expect(item.evidence.length).toBeGreaterThan(0);
    }
  });

  it("summarizes a full pass for the M7 surface set", () => {
    const { pass, total } = checklistSummary();
    expect(pass).toBe(total);
  });
});
