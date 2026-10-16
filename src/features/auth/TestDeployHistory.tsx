"use client";

import { useState } from "react";
import { deployHistoryPath, type DeployVersion } from "@/features/auth/deploy-history";

const MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

function shortDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]}`;
}

export function TestDeployHistory({
  channel,
  refName,
  sha,
}: {
  channel: string;
  refName: string;
  sha: string;
}) {
  const [open, setOpen] = useState(false);
  const [versions, setVersions] = useState<DeployVersion[] | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const prefix = [channel, refName].filter(Boolean).join(" · ");

  async function toggle() {
    const next = !open;
    setOpen(next);
    if (!next || versions || loading) return;
    setLoading(true);
    setError(false);
    try {
      const response = await fetch(deployHistoryPath(process.env.NEXT_PUBLIC_BASE_PATH));
      if (!response.ok) throw new Error("unavailable");
      const body = (await response.json()) as { versions?: DeployVersion[] };
      setVersions(body.versions ?? []);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-center" data-testid="build-stamp">
      <p className="text-center font-body text-[11px] text-text-muted">
        {prefix ? `${prefix} · ` : null}
        <button
          type="button"
          className="font-mono underline decoration-dotted underline-offset-2"
          aria-expanded={open}
          onClick={() => void toggle()}
        >
          {sha}
        </button>
      </p>
      {open ? (
        <div className="mt-2 w-full max-h-60 overflow-y-auto rounded-md border border-border text-left">
          {loading ? <p className="px-3 py-2 text-[12px] text-text-muted">Leyendo…</p> : null}
          {error ? (
            <p className="px-3 py-2 text-[12px] text-text-muted">No pude leer el historial.</p>
          ) : null}
          {versions && versions.length === 0 ? (
            <p className="px-3 py-2 text-[12px] text-text-muted">No hay PRs en este commit.</p>
          ) : null}
          {versions && versions.length > 0 ? (
            <ul>
              {versions.map((version) => (
                <li
                  key={`${version.pr}-${version.sha}`}
                  className="border-b border-border px-3 py-2 last:border-0"
                >
                  <div className="flex justify-between gap-2 font-mono text-[11px] text-text-muted">
                    <span className={version.sha === sha ? "text-text-primary" : undefined}>
                      {version.sha}
                    </span>
                    <span>{shortDate(version.date)}</span>
                  </div>
                  <p className="truncate text-[12px] text-text-secondary" title={version.title}>
                    {version.title}
                  </p>
                  <a
                    href={version.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[12px] font-semibold text-coral hover:underline"
                  >
                    PR #{version.pr}
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
