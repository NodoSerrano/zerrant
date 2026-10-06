const PROBE_ORIGIN = "http://internal.invalid";

/**
 * Validates a post-auth `next` target (ZER-136). Returns it only when it is a
 * same-origin path; anything else (absolute URLs, `//host`, `/\host`, schemes,
 * control chars, encoded slashes) collapses to `fallback`. Closes the open
 * redirect that `${origin}${next}` allowed in the auth callback.
 */
export function safeInternalPath(value: unknown, fallback = "/"): string {
  if (typeof value !== "string" || !value.startsWith("/")) return fallback;
  if (value.startsWith("//") || value.includes("\\")) return fallback;
  // oxlint-disable-next-line no-control-regex -- rejecting control chars is the point
  if (/[\u0000-\u001f\u007f]/.test(value)) return fallback;
  if (value.includes("://")) return fallback;
  // Encoded slashes are only dangerous in the path, where a later decode could
  // turn them into `//host`; inside the query they are ordinary data.
  const path = value.split(/[?#]/, 1)[0];
  if (/%(2f|5c)/i.test(path)) return fallback;

  try {
    if (new URL(value, PROBE_ORIGIN).origin !== PROBE_ORIGIN) return fallback;
  } catch {
    return fallback;
  }

  return value;
}

/** Appends `next` to an internal path when it is safe and not the default "/". */
export function withNext(path: string, next: unknown): string {
  const safe = safeInternalPath(next);
  if (safe === "/") return path;
  return `${path}${path.includes("?") ? "&" : "?"}next=${encodeURIComponent(safe)}`;
}
