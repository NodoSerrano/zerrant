import { describe, expect, it } from "vitest";
import {
  TASK_HUB_ESTADO_FILTERS,
  TASK_HUB_FILTERS,
  resolveTaskHubFilter,
  taskHubFilterHref,
} from "./hub-filter";

describe("resolveTaskHubFilter (ZER-225)", () => {
  it("defaults to abierta when estado is undefined", () => {
    expect(resolveTaskHubFilter(undefined)).toBe("abierta");
  });

  it("defaults to abierta when estado is empty string", () => {
    expect(resolveTaskHubFilter("")).toBe("abierta");
  });

  it("defaults to abierta for unknown values", () => {
    expect(resolveTaskHubFilter("unknown")).toBe("abierta");
  });

  it("legacy verificada falls back to abierta (ZER-209 + ZER-225)", () => {
    expect(resolveTaskHubFilter("verificada")).toBe("abierta");
  });

  it.each(["abierta", "tomada", "hecha", "cancelada", "todas"] as const)(
    "accepts valid filter %s",
    (estado) => {
      expect(resolveTaskHubFilter(estado)).toBe(estado);
    },
  );
});

describe("TASK_HUB filter lists (ZER-225)", () => {
  it("estado group is Abierta · Tomada · Hecha · Cancelada (no Todas, no Verificada)", () => {
    expect([...TASK_HUB_ESTADO_FILTERS]).toEqual(["abierta", "tomada", "hecha", "cancelada"]);
  });

  it("includes todas as a valid hub filter without putting it in the estado group", () => {
    expect(TASK_HUB_FILTERS).toContain("todas");
    expect(TASK_HUB_ESTADO_FILTERS).not.toContain("todas");
    expect(TASK_HUB_FILTERS).not.toContain("verificada");
  });
});

describe("taskHubFilterHref (ZER-225)", () => {
  it("Abierta uses bare /nodo/tasks (default = no param)", () => {
    expect(taskHubFilterHref("abierta")).toBe("/nodo/tasks");
  });

  it("Todas uses ?estado=todas", () => {
    expect(taskHubFilterHref("todas")).toBe("/nodo/tasks?estado=todas");
  });

  it.each(["tomada", "hecha", "cancelada"] as const)("%s uses ?estado=%s", (estado) => {
    expect(taskHubFilterHref(estado)).toBe(`/nodo/tasks?estado=${estado}`);
  });
});
