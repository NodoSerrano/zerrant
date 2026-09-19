import type { Tier } from "@/features/profile/types";

/** Tier that cannot publish/take community tasks. Single source of truth. */
export const TASKS_BLOCKED_TIER = "tourist" as const satisfies Tier;

export function isTasksBlockedTier(tier: string | null | undefined): boolean {
  return tier === TASKS_BLOCKED_TIER;
}

/** Inverse helper for “can create / can take” UX flags */
export function canOperateTasks(tier: string | null | undefined): boolean {
  return Boolean(tier) && !isTasksBlockedTier(tier);
}
