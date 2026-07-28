import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { relativeTime } from "./time";

describe("relativeTime", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-28T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns 'ahora' for less than a minute ago", () => {
    expect(relativeTime("2026-07-28T11:59:30Z")).toBe("ahora");
  });

  it("returns 'hace 1 min' for one minute ago", () => {
    expect(relativeTime("2026-07-28T11:59:00Z")).toBe("hace 1 min");
  });

  it("returns 'hace 5 min' for five minutes ago", () => {
    expect(relativeTime("2026-07-28T11:55:00Z")).toBe("hace 5 min");
  });

  it("returns 'hace 1 hora' for 61 minutes ago", () => {
    expect(relativeTime("2026-07-28T10:59:00Z")).toBe("hace 1 hora");
  });

  it("returns 'hace 3 horas' for three hours ago", () => {
    expect(relativeTime("2026-07-28T09:00:00Z")).toBe("hace 3 horas");
  });

  it("returns 'hace 1 dia' for 25 hours ago", () => {
    expect(relativeTime("2026-07-27T11:00:00Z")).toBe("hace 1 dia");
  });

  it("returns 'hace 5 dias' for five days ago", () => {
    expect(relativeTime("2026-07-23T12:00:00Z")).toBe("hace 5 dias");
  });

  it("returns 'hace 1 mes' for 35 days ago", () => {
    expect(relativeTime("2026-06-23T12:00:00Z")).toBe("hace 1 mes");
  });

  it("returns 'hace 3 meses' for three months ago", () => {
    expect(relativeTime("2026-04-28T12:00:00Z")).toBe("hace 3 meses");
  });

  it("returns 'hace 1 año' for 400 days ago", () => {
    expect(relativeTime("2025-06-23T12:00:00Z")).toBe("hace 1 año");
  });

  it("returns 'hace 2 años' for two years ago", () => {
    expect(relativeTime("2024-07-28T12:00:00Z")).toBe("hace 2 años");
  });
});
