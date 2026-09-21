/**
 * Bounded M7 a11y + performance checklist (FR60 / NFR22).
 * Evidence surface for ZER-104 — not an unbounded audit.
 */
export type ChecklistItem = {
  id: string;
  area: "a11y" | "perf";
  surface: string;
  check: string;
  status: "pass" | "n/a";
  evidence: string;
};

export const M7_A11Y_PERF_CHECKLIST: ChecklistItem[] = [
  {
    id: "a11y-inicio-named-links",
    area: "a11y",
    surface: "InicioHub + TabBar",
    check: "Primary links are real anchors with accessible names (events, birthdays, tabs)",
    status: "pass",
    evidence: "InicioHub.a11y.test.tsx · TabBar.a11y.test.tsx",
  },
  {
    id: "a11y-system-states-cta",
    area: "a11y",
    surface: "SystemStateView (404 / offline / error)",
    check: "Primary CTA is keyboard-reachable named link or button with focus-visible ring",
    status: "pass",
    evidence: "SystemStateView.a11y.test.tsx",
  },
  {
    id: "a11y-decorative-icons",
    area: "a11y",
    surface: "EmptyState · TabBar · EventCard · SystemStateView",
    check: "Decorative Lucide icons are aria-hidden so names come from visible labels",
    status: "pass",
    evidence: "EmptyState.a11y.test.tsx · TabBar.a11y.test.tsx",
  },
  {
    id: "a11y-birthday-avatar-alt",
    area: "a11y",
    surface: "Inicio birthday rows",
    check: "Avatar inside named row uses empty alt to avoid duplicated AT name",
    status: "pass",
    evidence: "InicioHub.a11y.test.tsx · Avatar.a11y.test.tsx",
  },
  {
    id: "perf-pwa-icon-budget",
    area: "perf",
    surface: "public/icons + manifest",
    check: "Install icons stay under 16 KiB each (no huge uncompressed LCP bombs)",
    status: "pass",
    evidence: "iconBudget.test.ts · measured ~1.4–3.8 KiB PNGs",
  },
  {
    id: "perf-avatar-sizes",
    area: "perf",
    surface: "Avatar",
    check: "Fixed width/height + sizes attribute for md avatars (48px)",
    status: "pass",
    evidence: "Avatar.a11y.test.tsx",
  },
  {
    id: "perf-inicio-cls",
    area: "perf",
    surface: "Inicio loading + birthday cards",
    check: "Skeleton reserves fixed card heights; birthday rows min-h match skeleton slots",
    status: "pass",
    evidence: "InicioHubSkeleton · InicioHub min-h-[72px]",
  },
  {
    id: "scope-bound",
    area: "a11y",
    surface: "M7 only",
    check: "No full WCAG certification / no M0–M6 rewrite",
    status: "pass",
    evidence: "Story 7.7 out of scope + this checklist",
  },
];

export function checklistSummary(): { pass: number; total: number } {
  const total = M7_A11Y_PERF_CHECKLIST.length;
  const pass = M7_A11Y_PERF_CHECKLIST.filter((i) => i.status === "pass").length;
  return { pass, total };
}
