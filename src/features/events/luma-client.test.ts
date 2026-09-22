import { afterEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_LUMA_CALENDAR_ID, fetchLumaCalendarEvents } from "./luma-client";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("fetchLumaCalendarEvents", () => {
  it("defaults to the Nodo landing calendar id", () => {
    expect(DEFAULT_LUMA_CALENDAR_ID).toBe("cal-7uziZDmq9SFGggQ");
  });

  it("returns normalized events from the public calendar API", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        entries: [
          {
            event: {
              api_id: "evt-1",
              name: "Meetup",
              start_at: "2026-09-24T21:00:00.000Z",
              end_at: "2026-09-24T22:00:00.000Z",
              url: "abc123",
              geo_address_info: { short_address: "Hub" },
            },
          },
        ],
        has_more: false,
      }),
    });

    const result = await fetchLumaCalendarEvents({ fetchImpl: fetchMock });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.events[0]?.title).toBe("Meetup");
    expect(result.events[0]?.href).toBe("https://luma.com/abc123");
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining(`calendar_api_id=${DEFAULT_LUMA_CALENDAR_ID}`),
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("returns ok:false on network/HTTP failure without throwing", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 500, json: async () => ({}) });
    const result = await fetchLumaCalendarEvents({ fetchImpl: fetchMock });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toMatch(/500|Luma/i);
  });

  it("returns ok:false when fetch throws", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error("offline"));
    const result = await fetchLumaCalendarEvents({ fetchImpl: fetchMock });
    expect(result.ok).toBe(false);
  });
});
