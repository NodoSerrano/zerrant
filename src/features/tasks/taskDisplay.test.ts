import { describe, expect, it } from "vitest";
import {
  CATEGORIA_LABELS,
  ESTADO_BADGE,
  URGENCIA_CONFIG,
  categoriaIconByLabel,
  getCategoriaIcon,
  getEstadoBadge,
  getUrgencia,
} from "./taskDisplay";

describe("CATEGORIA_LABELS", () => {
  // La columna guarda el valor del enum (`reparacion`); la UI muestra el
  // castellano con tilde. Sin esta traducción el hub imprime el valor crudo.
  it("maps every enum value to its Spanish label", () => {
    expect(CATEGORIA_LABELS).toEqual({
      reparacion: "Reparación",
      limpieza: "Limpieza",
      compra: "Compra",
      mantenimiento: "Mantenimiento",
      otro: "Otro",
    });
  });
});

describe("getCategoriaIcon", () => {
  it.each([
    ["reparacion", "Wrench"],
    ["limpieza", "SprayCan"],
    ["compra", "ShoppingCart"],
    ["mantenimiento", "Settings"],
    // `MoreHorizontal` es un alias de lucide: su displayName real es "Ellipsis".
    ["otro", "Ellipsis"],
  ])("returns the %s icon", (categoria, expected) => {
    expect(getCategoriaIcon(categoria).displayName).toBe(expected);
  });

  it("falls back to MoreHorizontal for a categoria it does not know", () => {
    expect(getCategoriaIcon("teletransportacion").displayName).toBe("Ellipsis");
  });
});

describe("categoriaIconByLabel", () => {
  // TaskCard recibe la etiqueta ya traducida, no el enum. Este índice se deriva
  // del mapa por enum para que no haya dos listas que se puedan desincronizar.
  it("is keyed by the same Spanish labels that CATEGORIA_LABELS produces", () => {
    expect(Object.keys(categoriaIconByLabel).sort()).toEqual(
      Object.values(CATEGORIA_LABELS).sort(),
    );
  });

  it("resolves the Wrench icon from the 'Reparación' label", () => {
    expect(categoriaIconByLabel["Reparación"].displayName).toBe("Wrench");
  });
});

describe("getEstadoBadge", () => {
  // `abierta` sale exacto del frame dyDLm de Pencil. El resto se deriva del
  // design system, porque Pencil no diseñó un chip por estado.
  it.each([
    ["abierta", "Abierta", "bg-blue-raw/20", "text-brand-blue"],
    ["tomada", "Tomada", "bg-coral/20", "text-coral"],
    ["hecha", "Hecha", "bg-mint-raw/20", "text-brand-mint"],
    ["verificada", "Verificada", "bg-brand-green/20", "text-brand-green"],
    ["cancelada", "Cancelada", "bg-surface-inset", "text-text-muted"],
  ])("maps %s to its badge", (estado, label, bg, text) => {
    expect(getEstadoBadge(estado)).toEqual({ label, bg, text });
  });

  it("falls back to the Abierta badge for an estado it does not know", () => {
    expect(getEstadoBadge("archivada")).toEqual(ESTADO_BADGE.abierta);
  });
});

describe("getUrgencia", () => {
  it.each([
    ["alta", "Urgencia alta", "text-warm-orange"],
    ["media", "Urgencia media", "text-warm-yellow"],
    ["baja", "Urgencia baja", "text-text-muted"],
  ])("maps %s to its label and colour", (urgencia, label, color) => {
    expect(getUrgencia(urgencia)).toEqual({ label, color });
  });

  it("falls back to media for an urgencia it does not know", () => {
    expect(getUrgencia("critica")).toEqual(URGENCIA_CONFIG.media);
  });
});
