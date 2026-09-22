import { formatDayKey } from "@/features/events/day";

export type AgendaListItemSource = "internal" | "luma";

export type AgendaListItem = {
  id: string;
  title: string;
  inicio: string;
  fin: string | null;
  place: string | null;
  href: string;
  source: AgendaListItemSource;
  /** Public cover image URL when available (Luma); null for internal events without media. */
  coverUrl: string | null;
};

type LumaGeo = {
  short_address?: string | null;
  address?: string | null;
  city?: string | null;
};

type LumaEventPayload = {
  api_id?: string | null;
  name?: string | null;
  start_at?: string | null;
  end_at?: string | null;
  url?: string | null;
  cover_url?: string | null;
  social_image_url?: string | null;
  geo_address_info?: LumaGeo | null;
};

export type LumaCalendarEntry = {
  api_id?: string | null;
  start_at?: string | null;
  event?: LumaEventPayload | null;
};

export function lumaEventPublicUrl(urlOrSlug: string): string {
  const trimmed = urlOrSlug.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://luma.com/${trimmed.replace(/^\/+/, "")}`;
}

function resolvePlace(geo: LumaGeo | null | undefined): string | null {
  if (!geo) return null;
  const short = geo.short_address?.trim();
  if (short) return short;
  const address = geo.address?.trim();
  if (address) return address;
  const city = geo.city?.trim();
  return city || null;
}

export function normalizeLumaCalendarEntries(entries: unknown[]): AgendaListItem[] {
  const out: AgendaListItem[] = [];
  for (const raw of entries) {
    if (!raw || typeof raw !== "object") continue;
    const entry = raw as LumaCalendarEntry;
    const event = entry.event;
    if (!event || typeof event !== "object") continue;
    const apiId = typeof event.api_id === "string" ? event.api_id.trim() : "";
    const name = typeof event.name === "string" ? event.name.trim() : "";
    const start =
      (typeof event.start_at === "string" && event.start_at) ||
      (typeof entry.start_at === "string" && entry.start_at) ||
      "";
    const url = typeof event.url === "string" ? event.url.trim() : "";
    if (!apiId || !name || !start || !url) continue;
    const end = typeof event.end_at === "string" && event.end_at ? event.end_at : null;
    const cover =
      (typeof event.cover_url === "string" && event.cover_url.trim()) ||
      (typeof event.social_image_url === "string" && event.social_image_url.trim()) ||
      null;
    out.push({
      id: `luma:${apiId}`,
      title: name,
      inicio: start,
      fin: end,
      place: resolvePlace(event.geo_address_info),
      href: lumaEventPublicUrl(url),
      source: "luma",
      coverUrl: cover,
    });
  }
  return out;
}

function normalizeTitleKey(title: string): string {
  return title.trim().toLowerCase().replace(/\s+/g, " ");
}

function sortKey(item: AgendaListItem): number {
  const t = Date.parse(item.inicio);
  return Number.isNaN(t) ? Number.POSITIVE_INFINITY : t;
}

/** Prefer internal when title+start collide with a Luma row. */
export function mergeAgendaListItems(
  luma: AgendaListItem[],
  internal: AgendaListItem[],
): AgendaListItem[] {
  const seen = new Set<string>();
  const out: AgendaListItem[] = [];

  for (const item of internal) {
    const key = `${normalizeTitleKey(item.title)}|${item.inicio}`;
    seen.add(key);
    out.push(item);
  }
  for (const item of luma) {
    const key = `${normalizeTitleKey(item.title)}|${item.inicio}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }

  return out.sort((a, b) => sortKey(a) - sortKey(b) || a.id.localeCompare(b.id));
}

export function filterAgendaItemsByDay(items: AgendaListItem[], dayKey: string): AgendaListItem[] {
  return items.filter((item) => {
    const start = new Date(item.inicio);
    if (Number.isNaN(start.getTime())) return false;
    return formatDayKey(start) === dayKey;
  });
}

/** Unique agenda-TZ day keys that have at least one item (order of first appearance). */
export function agendaDayKeys(items: AgendaListItem[]): string[] {
  const keys: string[] = [];
  const seen = new Set<string>();
  for (const item of items) {
    const start = new Date(item.inicio);
    if (Number.isNaN(start.getTime())) continue;
    const key = formatDayKey(start);
    if (seen.has(key)) continue;
    seen.add(key);
    keys.push(key);
  }
  return keys;
}

export function takeUpcomingAgendaItems(
  items: AgendaListItem[],
  now: Date,
  limit: number,
): AgendaListItem[] {
  const nowMs = now.getTime();
  return items
    .filter((item) => {
      const t = Date.parse(item.inicio);
      return !Number.isNaN(t) && t >= nowMs;
    })
    .sort((a, b) => sortKey(a) - sortKey(b) || a.id.localeCompare(b.id))
    .slice(0, Math.max(0, limit));
}

export function internalEventToAgendaItem(event: {
  id: string;
  titulo: string;
  lugar: string | null;
  inicio: string;
  fin: string | null;
}): AgendaListItem {
  return {
    id: event.id,
    title: event.titulo,
    inicio: event.inicio,
    fin: event.fin,
    place: event.lugar,
    href: `/agenda/${event.id}`,
    source: "internal",
    coverUrl: null,
  };
}
