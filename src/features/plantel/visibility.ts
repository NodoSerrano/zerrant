type RateVisibility = "publica" | "privada";

interface RateViewer {
  isSelf: boolean;
  isAdmin: boolean;
  isTourist: boolean;
}

interface CanSeeRateArgs extends RateViewer {
  visibilidadTarifa: RateVisibility;
  hasTarifa: boolean;
}

/** Whether the viewer may learn that a non-null rate exists / its value. */
export function canSeeRate({
  isSelf,
  isAdmin,
  isTourist,
  visibilidadTarifa,
  hasTarifa,
}: CanSeeRateArgs): boolean {
  if (!hasTarifa) return false;
  if (isSelf || isAdmin) return true;
  if (isTourist) return false;
  return visibilidadTarifa === "publica";
}

/**
 * ZER-43 — pure contract mirroring the SQL CASE on profiles_with_rate.tarifa_hora.
 * Returns the numeric rate only when the viewer is allowed to see it.
 */
export function resolveTarifaHora({
  tarifaHora,
  visibilidadTarifa,
  viewer,
}: {
  tarifaHora: number | null;
  visibilidadTarifa: RateVisibility;
  viewer: RateViewer;
}): number | null {
  if (
    !canSeeRate({
      ...viewer,
      visibilidadTarifa,
      hasTarifa: tarifaHora !== null,
    })
  ) {
    return null;
  }
  return tarifaHora;
}

const HANDLE_RE = /^[A-Za-z][A-Za-z0-9_]{4,31}$/;
const TELEGRAM_HOSTS = new Set(["t.me", "telegram.me"]);

export function telegramHref(value: string | null | undefined): string | null {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) return null;

  let handle: string;

  if (/^https?:\/\//i.test(trimmed) || /^(t\.me|telegram\.me)\//i.test(trimmed)) {
    const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    let url: URL;
    try {
      url = new URL(withScheme);
    } catch {
      return null;
    }

    if (url.username || url.password || url.port) return null;
    if (!TELEGRAM_HOSTS.has(url.hostname)) return null;
    if (url.search || url.hash) return null;

    const match = url.pathname.match(/^\/([^/]+)$/);
    if (!match) return null;
    handle = match[1];
  } else {
    handle = trimmed;
  }

  if (handle.startsWith("@")) handle = handle.slice(1);
  if (!HANDLE_RE.test(handle)) return null;

  return `https://t.me/${handle}`;
}
