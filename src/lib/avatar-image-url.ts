/**
 * Mirrors next.config images.remotePatterns for Supabase public avatars.
 * next/image throws (does not degrade) when src is an absolute URL whose host
 * is outside remotePatterns — including builds with no NEXT_PUBLIC_SUPABASE_URL.
 */

export type AvatarRemotePattern = {
  protocol: "http" | "https";
  hostname: string;
  port: string;
  pathname: string;
};

export function getSupabaseAvatarRemotePatterns(): AvatarRemotePattern[] {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) {
    return [];
  }

  try {
    const { protocol, hostname, port } = new URL(url);
    return [
      {
        protocol: protocol.replace(":", "") as "http" | "https",
        hostname,
        port,
        pathname: "/storage/v1/object/public/avatars/**",
      },
    ];
  } catch {
    return [];
  }
}

/** True when next/image must be allowed to fetch loopback Supabase (local stack). */
export function shouldAllowLocalIPForAvatars(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) return false;

  try {
    const { hostname } = new URL(url);
    return hostname === "127.0.0.1" || hostname === "localhost" || hostname === "::1";
  } catch {
    return false;
  }
}

/** True when next/image can safely render this src without throwing on remotePatterns. */
export function isServableAvatarImageUrl(src: string | null | undefined): boolean {
  if (!src) return false;

  // Local / public-folder paths never go through remotePatterns.
  if (src.startsWith("/")) return true;

  let parsed: URL;
  try {
    parsed = new URL(src);
  } catch {
    return false;
  }

  const patterns = getSupabaseAvatarRemotePatterns();
  return patterns.some((pattern) => matchesAvatarRemotePattern(pattern, parsed));
}

function matchesAvatarRemotePattern(pattern: AvatarRemotePattern, url: URL): boolean {
  const protocol = url.protocol.replace(/:$/, "");
  if (pattern.protocol !== protocol) return false;
  if (pattern.port !== url.port) return false;
  if (pattern.hostname !== url.hostname) return false;

  // next.config uses pathname `/storage/v1/object/public/avatars/**`
  const base = "/storage/v1/object/public/avatars";
  return url.pathname === base || url.pathname.startsWith(`${base}/`);
}
