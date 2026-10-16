import { describe, expect, it } from "vitest";
import {
  deployHistoryAllowed,
  deployHistoryPath,
  versionFromCommit,
  versionsFromGithubCommits,
} from "./deploy-history";

describe("deploy history gate", () => {
  it("is only on for the test channel", () => {
    expect(deployHistoryAllowed("test")).toBe(true);
    expect(deployHistoryAllowed(" prod ")).toBe(false);
    expect(deployHistoryAllowed("prod")).toBe(false);
    expect(deployHistoryAllowed("local")).toBe(false);
    expect(deployHistoryAllowed(undefined)).toBe(false);
  });

  it("keeps the hosted base path on the history url", () => {
    expect(deployHistoryPath("/zerrant-test")).toBe("/zerrant-test/api/deploy-history");
    expect(deployHistoryPath("")).toBe("/api/deploy-history");
  });
});

describe("versionFromCommit", () => {
  it("reads the PR title from a merge commit", () => {
    expect(
      versionFromCommit({
        sha: "7151799abc",
        date: "2026-10-16T02:38:33Z",
        message:
          "Merge pull request #124 from NodoSerrano/feat/login-build-stamp\n\nfeat(auth): stamp channel, branch and sha on the login\n",
      }),
    ).toEqual({
      sha: "7151799",
      title: "feat(auth): stamp channel, branch and sha on the login",
      pr: 124,
      url: "https://github.com/NodoSerrano/zerrant/pull/124",
      date: "2026-10-16T02:38:33Z",
    });
  });

  it("ignores a branch merge that has no PR", () => {
    expect(
      versionFromCommit({
        sha: "49a841a",
        date: "2026-10-16T02:02:01Z",
        message: "Merge origin/develop into ZER-171 CTA branch",
      }),
    ).toBeNull();
  });

  it("keeps one row per PR and skips commits already covered by the merge", () => {
    const versions = versionsFromGithubCommits([
      {
        sha: "2bed0f3aaa",
        commit: {
          message:
            "Merge pull request #123 from martiyaquinta/estudionomade2025/zer-171-cta-persistente-ser-serrano\n\nfeat(ux): persistent Ser Serrano CTA for tourists (ZER-171)",
          committer: { date: "2026-10-16T02:47:51Z" },
        },
      },
      {
        sha: "1998e06",
        commit: {
          message: "fix(ux): overlap Ser Serrano reads with the page queries (#123)",
          committer: { date: "2026-10-16T02:17:48Z" },
        },
      },
      {
        sha: "86fdb6d",
        commit: {
          message: "feat(auth): stamp channel, branch and sha on the login (#124)",
          committer: { date: "2026-10-16T02:01:04Z" },
        },
      },
    ]);
    expect(versions.map((version) => version.pr)).toEqual([123, 124]);
    expect(versions[1]?.url).toBe("https://github.com/NodoSerrano/zerrant/pull/124");
  });
});
