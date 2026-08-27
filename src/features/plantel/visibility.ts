type RateVisibility = "publica" | "privada";

interface CanSeeRateArgs {
  isSelf: boolean;
  isAdmin: boolean;
  visibilidadTarifa: RateVisibility;
  hasTarifa: boolean;
}

export function canSeeRate({
  isSelf,
  isAdmin,
  visibilidadTarifa,
  hasTarifa,
}: CanSeeRateArgs): boolean {
  if (!hasTarifa) return false;
  return isSelf || isAdmin || visibilidadTarifa === "publica";
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
