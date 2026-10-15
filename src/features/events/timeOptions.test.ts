import { describe, expect, it } from "vitest";
import {
  clampEnd,
  formatDuration,
  formatHm,
  isHourDisabled,
  isMinuteDisabled,
  minuteChoices,
  parseHm,
} from "./timeOptions";

describe("timeOptions", () => {
  it("parses and formats 24h wall clock", () => {
    expect(parseHm("19:00")).toEqual({ hour: 19, minute: 0 });
    expect(parseHm("9:00")).toBeNull();
    expect(formatHm(9, 5)).toBe("09:05");
  });

  it("formats a same-day duration in Spanish", () => {
    expect(formatDuration("18:30", "19:30")).toBe("1 h");
    expect(formatDuration("19:00", "21:15")).toBe("2 h 15 min");
    expect(formatDuration("19:00", "19:45")).toBe("45 min");
    expect(formatDuration("19:00", "19:00")).toBe("0 min");
    expect(formatDuration("19:00", "")).toBeNull();
  });

  it("allows an end equal to the start and rejects an earlier one", () => {
    expect(clampEnd("19:00", "19:00")).toBe("19:00");
    expect(clampEnd("19:00", "21:00")).toBe("21:00");
    expect(clampEnd("22:00", "21:00")).toBe("22:00");
    expect(clampEnd("19:00", "")).toBe("");
  });

  it("keeps an off-grid minute so edit does not drop it", () => {
    expect(minuteChoices(7)).toEqual([0, 7, 15, 30, 45]);
    expect(minuteChoices(0)).toEqual([0, 15, 30, 45]);
  });

  it("disables end choices strictly before the start", () => {
    const minutes = [0, 15, 30, 45];
    expect(isHourDisabled(18, minutes, "19:00", true)).toBe(true);
    expect(isHourDisabled(19, minutes, "19:30", true)).toBe(false);
    expect(isMinuteDisabled(19, 0, "19:30", true)).toBe(true);
    expect(isMinuteDisabled(19, 30, "19:30", true)).toBe(false);
    expect(isHourDisabled(18, minutes, "19:00", false)).toBe(false);
  });
});
