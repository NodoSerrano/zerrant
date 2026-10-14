/** Public app origin, including base path when hosted under a subpath. No trailing slash. */
export function publicSiteUrl(fallbackOrigin?: string): string {
  const site = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (site) return site;
  if (fallbackOrigin) return fallbackOrigin.replace(/\/$/, "");
  return "http://localhost:3000";
}
