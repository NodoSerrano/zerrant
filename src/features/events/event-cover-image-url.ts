/**
 * next/image remotePatterns for public event cover images (Luma CDN).
 * Keep in lockstep with next.config images.remotePatterns extras for covers.
 */

export type EventCoverRemotePattern = {
  protocol: "http" | "https";
  hostname: string;
  port: string;
  pathname: string;
};

const LUMA_CDN_HOST = "images.lumacdn.com";

export function getEventCoverRemotePatterns(): EventCoverRemotePattern[] {
  return [
    {
      protocol: "https",
      hostname: LUMA_CDN_HOST,
      port: "",
      pathname: "/**",
    },
  ];
}

/** True when next/image can safely render this event cover src. */
export function isServableEventCoverImageUrl(src: string | null | undefined): boolean {
  if (!src) return false;

  let parsed: URL;
  try {
    parsed = new URL(src);
  } catch {
    return false;
  }

  return getEventCoverRemotePatterns().some((pattern) =>
    matchesEventCoverRemotePattern(pattern, parsed),
  );
}

function matchesEventCoverRemotePattern(pattern: EventCoverRemotePattern, url: URL): boolean {
  const protocol = url.protocol.replace(/:$/, "");
  if (pattern.protocol !== protocol) return false;
  if (pattern.port !== url.port) return false;
  if (pattern.hostname !== url.hostname) return false;
  // pathname "/**" → any path on that host
  if (pattern.pathname === "/**") return true;
  const base = pattern.pathname.replace(/\/\*\*$/, "");
  return url.pathname === base || url.pathname.startsWith(`${base}/`);
}
