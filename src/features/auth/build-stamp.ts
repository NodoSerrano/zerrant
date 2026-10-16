export type BuildStamp = {
  channel?: string | null;
  ref?: string | null;
  sha?: string | null;
};

function clean(value: string | null | undefined): string {
  return value?.trim() ?? "";
}

function shortSha(sha: string): string {
  return sha.length > 12 ? sha.slice(0, 7) : sha;
}

// Channel is which deploy (test/prod). Ref and sha come from the git checkout
// that deploy reset to. Same sha on both logins means test and prod match.
export function formatBuildStamp(parts: BuildStamp): string | null {
  const channel = clean(parts.channel);
  const ref = clean(parts.ref);
  const sha = shortSha(clean(parts.sha));
  const refLabel = ref && ref !== "HEAD" ? ref : "";
  const bits = [channel, refLabel, sha].filter(Boolean);
  return bits.length ? bits.join(" · ") : null;
}

export function readBuildStamp(): string | null {
  return formatBuildStamp({
    channel: process.env.NEXT_PUBLIC_APP_CHANNEL,
    ref: process.env.NEXT_PUBLIC_GIT_REF,
    sha: process.env.NEXT_PUBLIC_GIT_SHA,
  });
}
