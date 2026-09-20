/** Offline shell cache policy for Serwist (FR56, NFR28). */

export const OFFLINE_FALLBACK_PATH = "/~offline" as const;

/** Routes safe to precache as shell — never private member directories. */
export const SHELL_PRECACHE_PATHS = [OFFLINE_FALLBACK_PATH] as const;

/** Segment-aware match: `/plantel` must not capture `/planteles`. */
function underPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

/**
 * Private authenticated member directory (social graph).
 * Must stay network-only so offline never fakes a plantel snapshot (NFR28).
 */
export function isPrivateMemberDirectoryPath(pathname: string): boolean {
  return underPrefix(pathname, "/plantel");
}

export function shouldBypassRuntimeCache(input: {
  pathname: string;
  sameOrigin: boolean;
  hostname?: string;
}): boolean {
  if (isPrivateMemberDirectoryPath(input.pathname)) {
    return true;
  }

  // Cross-origin API/storage (Supabase, etc.) — never treat as offline social data.
  if (!input.sameOrigin) {
    const host = input.hostname ?? "";
    if (host.includes("supabase.co") || host.includes("supabase.in")) {
      return true;
    }
  }

  return false;
}

export function isShellNavigationFallbackRequest(input: {
  destination: string;
  mode?: string;
}): boolean {
  return input.destination === "document";
}
