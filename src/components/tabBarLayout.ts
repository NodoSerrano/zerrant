/**
 * Pencil TabBar nMDGY: pt 21 + pill 62 + pb 21 = 104px. The (app) shell reserves that
 * height with a spacer, and floating buttons (FABs) sit 24px above it (the old bottom-6).
 * If the TabBar height changes, update both here.
 *
 * Plain module on purpose: TabBar.tsx is a client component, and a constant imported from
 * it into a server page would arrive as a client reference instead of the string.
 */
export const TAB_BAR_SPACER_CLASS = "h-[104px]";
export const FAB_ABOVE_TAB_BAR_CLASS = "bottom-[128px]";
