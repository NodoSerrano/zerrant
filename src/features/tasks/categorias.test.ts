import { describe, expect, it } from "vitest";
import {
  CATEGORIA_OTRA_MAX,
  formatCategorias,
  parseCategorias,
  primaryCategoria,
} from "./categorias";

function form(categorias: string[], otra?: string) {
  const fd = new FormData();
  for (const c of categorias) fd.append("categorias", c);
  if (otra !== undefined) fd.set("categoria_otra", otra);
  return fd;
}

describe("parseCategorias (ZER-208)", () => {
  it("accepts several categories in the canonical order, without repeats", () => {
    expect(parseCategorias(form(["compra", "reparacion", "compra"]))).toEqual({
      ok: true,
      categorias: ["reparacion", "compra"],
      categoriaOtra: null,
    });
  });

  it("accepts a single category", () => {
    expect(parseCategorias(form(["limpieza"]))).toEqual({
      ok: true,
      categorias: ["limpieza"],
      categoriaOtra: null,
    });
  });

  it("requires at least one category", () => {
    expect(parseCategorias(form([]))).toEqual({
      ok: false,
      error: "Elegí al menos una categoría.",
    });
  });

  it("rejects a value that is not a category instead of dropping it", () => {
    expect(parseCategorias(form(["reparacion", "jardineria"]))).toEqual({
      ok: false,
      error: "Revisá los datos de la tarea.",
    });
  });

  it("asks which one when Otro is chosen", () => {
    expect(parseCategorias(form(["otro"]))).toEqual({
      ok: false,
      error: "Contanos cuál es la otra categoría.",
    });
    expect(parseCategorias(form(["otro"], "   "))).toEqual({
      ok: false,
      error: "Contanos cuál es la otra categoría.",
    });
  });

  it("keeps the trimmed Otro text", () => {
    expect(parseCategorias(form(["reparacion", "otro"], "  Jardinería "))).toEqual({
      ok: true,
      categorias: ["reparacion", "otro"],
      categoriaOtra: "Jardinería",
    });
  });

  it("drops the Otro text when Otro is not chosen", () => {
    expect(parseCategorias(form(["compra"], "Jardinería"))).toEqual({
      ok: true,
      categorias: ["compra"],
      categoriaOtra: null,
    });
  });

  it(`limits the Otro text to ${CATEGORIA_OTRA_MAX} characters (same as the DB check)`, () => {
    expect(parseCategorias(form(["otro"], "a".repeat(CATEGORIA_OTRA_MAX)))).toMatchObject({
      ok: true,
    });
    expect(parseCategorias(form(["otro"], "a".repeat(CATEGORIA_OTRA_MAX + 1)))).toEqual({
      ok: false,
      error: `La otra categoría puede tener hasta ${CATEGORIA_OTRA_MAX} caracteres.`,
    });
  });
});

describe("formatCategorias (ZER-208)", () => {
  it("joins the Spanish labels", () => {
    expect(formatCategorias(["reparacion", "compra"], null)).toBe("Reparación, Compra");
  });

  it("shows the Otro text instead of the word Otro", () => {
    expect(formatCategorias(["limpieza", "otro"], "Jardinería")).toBe("Limpieza, Jardinería");
  });

  it("falls back to Otro when an older task has no text", () => {
    expect(formatCategorias(["otro"], null)).toBe("Otro");
  });

  it("does not crash on an empty list or unknown values", () => {
    expect(formatCategorias([], null)).toBe("Otro");
    expect(formatCategorias(["fantasia"], null)).toBe("Otro");
  });
});

describe("primaryCategoria", () => {
  it("is the first category, used for the icon", () => {
    expect(primaryCategoria(["compra", "otro"])).toBe("compra");
    expect(primaryCategoria([])).toBe("otro");
  });
});
