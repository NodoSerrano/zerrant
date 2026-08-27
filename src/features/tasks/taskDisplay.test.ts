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
  // The column stores the enum value (`reparacion`); the UI shows the
  // accented Spanish label. Without this translation the hub prints the raw value.
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
    // `MoreHorizontal` is a lucide alias: its real displayName is "Ellipsis".
    ["otro", "Ellipsis"],
  ])("returns the %s icon", (categoria, expected) => {
    expect(getCategoriaIcon(categoria).displayName).toBe(expected);
  });

  it("falls back to MoreHorizontal for a categoria it does not know", () => {
    expect(getCategoriaIcon("teletransportacion").displayName).toBe("Ellipsis");
  });
});

describe("categoriaIconByLabel", () => {
  // TaskCard receives the label already translated, not the enum. This index
  // is derived from the enum-keyed map so there aren't two lists that can drift.
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
  // `abierta` comes verbatim from Pencil frame dyDLm. The rest is derived from
  // the design system, because Pencil didn't design a chip per state.
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
