export type DeployVersion = {
  sha: string;
  title: string;
  pr: number;
  url: string;
  date: string;
};

const MERGE_PR = /^Merge pull request #(\d+)\b/;
const SQUASH_PR = /\(#(\d+)\)\s*$/;
const REPO = "NodoSerrano/zerrant";

export function deployHistoryAllowed(channel: string | null | undefined): boolean {
  return channel?.trim() === "test";
}

export function deployHistoryPath(basePath: string | null | undefined): string {
  const base = (basePath ?? "").replace(/\/$/, "");
  return `${base}/api/deploy-history`;
}

function prUrl(pr: number): string {
  return `https://github.com/${REPO}/pull/${pr}`;
}

function shortSha(sha: string): string {
  return sha.length > 7 ? sha.slice(0, 7) : sha;
}

export function versionFromCommit(commit: {
  sha: string;
  message: string;
  date: string;
}): DeployVersion | null {
  const sha = shortSha(commit.sha.trim());
  if (!sha) return null;
  const lines = commit.message
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const subject = lines[0] ?? "";
  const merged = subject.match(MERGE_PR);
  if (merged) {
    const pr = Number(merged[1]);
    return {
      sha,
      title: lines[1] || subject,
      pr,
      url: prUrl(pr),
      date: commit.date,
    };
  }
  if (subject.startsWith("Merge ")) return null;
  const squash = subject.match(SQUASH_PR);
  if (!squash) return null;
  const pr = Number(squash[1]);
  return {
    sha,
    title: subject.replace(/\s*\(#\d+\)\s*$/, ""),
    pr,
    url: prUrl(pr),
    date: commit.date,
  };
}

export function versionsFromGithubCommits(payload: unknown, limit = 15): DeployVersion[] {
  if (!Array.isArray(payload)) return [];
  const seen = new Set<number>();
  const versions: DeployVersion[] = [];
  for (const item of payload) {
    if (!item || typeof item !== "object") continue;
    const row = item as {
      sha?: string;
      commit?: { message?: string; committer?: { date?: string } };
    };
    const version = versionFromCommit({
      sha: row.sha ?? "",
      message: row.commit?.message ?? "",
      date: row.commit?.committer?.date ?? "",
    });
    if (!version || seen.has(version.pr)) continue;
    seen.add(version.pr);
    versions.push(version);
    if (versions.length >= limit) break;
  }
  return versions;
}
