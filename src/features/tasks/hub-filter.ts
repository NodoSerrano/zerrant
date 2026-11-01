export const TASK_HUB_ESTADO_FILTERS = ["abierta", "tomada", "hecha", "cancelada"] as const;
export const TASK_HUB_FILTERS = [...TASK_HUB_ESTADO_FILTERS, "todas"] as const;

export type TaskHubFilter = (typeof TASK_HUB_FILTERS)[number];

export function resolveTaskHubFilter(estado: string | undefined): TaskHubFilter {
  if (estado && (TASK_HUB_FILTERS as readonly string[]).includes(estado)) {
    return estado as TaskHubFilter;
  }
  return "abierta";
}

export function taskHubFilterHref(filter: TaskHubFilter): string {
  if (filter === "abierta") return "/nodo/tasks";
  return `/nodo/tasks?estado=${filter}`;
}
