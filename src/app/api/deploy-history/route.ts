import { NextResponse } from "next/server";
import { deployHistoryAllowed, versionsFromGithubCommits } from "@/features/auth/deploy-history";

const COMMITS_URL = "https://api.github.com/repos/NodoSerrano/zerrant/commits";

export async function GET() {
  if (!deployHistoryAllowed(process.env.NEXT_PUBLIC_APP_CHANNEL)) {
    return new NextResponse(null, { status: 404 });
  }

  const sha = process.env.NEXT_PUBLIC_GIT_SHA?.trim() || "develop";
  const url = `${COMMITS_URL}?sha=${encodeURIComponent(sha)}&per_page=50`;
  let response: Response;
  try {
    response = await fetch(url, {
      headers: {
        Accept: "application/vnd.github+json",
        "User-Agent": "zerrant-test",
      },
      cache: "no-store",
    });
  } catch {
    return NextResponse.json({ error: "unavailable" }, { status: 502 });
  }
  if (!response.ok) {
    return NextResponse.json({ error: "unavailable" }, { status: 502 });
  }

  const versions = versionsFromGithubCommits(await response.json());
  return NextResponse.json({ versions }, { headers: { "Cache-Control": "private, max-age=300" } });
}
