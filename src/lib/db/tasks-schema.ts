/**
 * Pure contract mirror for tasks table grants/policies used by schema tests.
 * Live enforcement lives in Supabase migrations + RLS harness.
 */
export const TASKS_SELECT_POLICY = "Members can read tasks" as const;
export const TASKS_SELECT_USING = "public.is_non_tourist()" as const;
