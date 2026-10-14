/** Public app origin, including base path when hosted under a subpath. No trailing slash. */
export function publicSiteUrl(fallbackOrigin?: string): string {
  const site = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (site) return site;
  if (fallbackOrigin) return fallbackOrigin.replace(/\/$/, "");
  return "http://localhost:3000";
}

/**
 * Absolute URL for an internal path.
 * SITE_URL may already include a base path (`/zerrant-test`), so it must not be
 * passed as the base of `new URL("/auth/login", site)` — that drops the path.
 * `path` must already be a safe internal path (see safeInternalPath).
 */
export function publicAppHref(path: string, fallbackOrigin?: string): string {
  const safePath = path.startsWith("/") ? path : `/${path}`;
  const site = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (site) return `${site}${safePath}`;
  const origin = (fallbackOrigin ?? "http://localhost:3000").replace(/\/$/, "");
  return new URL(safePath, origin).toString();
}
