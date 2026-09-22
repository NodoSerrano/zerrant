import {
  normalizeLumaCalendarEntries,
  type AgendaListItem,
} from "@/features/events/luma-normalize";

/** Calendar id used by nodo-serrano-landing Events iframe. */
export const DEFAULT_LUMA_CALENDAR_ID = "cal-7uziZDmq9SFGggQ";

const LUMA_GET_ITEMS = "https://api.lu.ma/calendar/get-items";

export type FetchLumaResult = { ok: true; events: AgendaListItem[] } | { ok: false; error: string };

export type FetchLumaOptions = {
  calendarId?: string;
  fetchImpl?: typeof fetch;
  /** Abort / timeout signal */
  signal?: AbortSignal;
};

function resolveCalendarId(explicit?: string): string {
  const fromEnv = typeof process !== "undefined" ? process.env.LUMA_CALENDAR_ID?.trim() : undefined;
  return explicit?.trim() || fromEnv || DEFAULT_LUMA_CALENDAR_ID;
}

/**
 * Server-side fetch of the public Luma calendar feed (no API key).
 * Same calendar the landing embeds: DEFAULT_LUMA_CALENDAR_ID.
 */
export async function fetchLumaCalendarEvents(
  options: FetchLumaOptions = {},
): Promise<FetchLumaResult> {
  const calendarId = resolveCalendarId(options.calendarId);
  const fetchImpl = options.fetchImpl ?? fetch;
  const url = `${LUMA_GET_ITEMS}?calendar_api_id=${encodeURIComponent(calendarId)}&period=future`;

  try {
    const res = await fetchImpl(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        // Luma sometimes behaves better with a UA; keep deterministic for servers.
        "User-Agent": "nodo-serrano-app/1.0 (+luma-calendar)",
      },
      signal: options.signal,
      // Avoid Next caching stale community calendar forever in prod.
      cache: "no-store",
    } as RequestInit);

    if (!res.ok) {
      return { ok: false, error: `Luma calendar request failed (${res.status})` };
    }

    const body = (await res.json()) as { entries?: unknown };
    const entries = Array.isArray(body.entries) ? body.entries : [];
    return { ok: true, events: normalizeLumaCalendarEntries(entries) };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Luma calendar request failed";
    return { ok: false, error: message };
  }
}
