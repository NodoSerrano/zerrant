import { CATEGORIA_LABELS } from "./taskDisplay";
import type { TaskCategoria } from "./types";

// A task can have several categories, and "Otro" carries free text (ZER-208).
// Create and edit parse the form here; the hub, the card and the detail
// format here, so the rules live in one place.

/** Canonical order: the form's order, so the same choice always saves the same array. */
export const CATEGORIAS: TaskCategoria[] = [
  "reparacion",
  "limpieza",
  "compra",
  "mantenimiento",
  "otro",
];

/** Same cap as the tasks_categoria_otra_valida check in the DB. */
export const CATEGORIA_OTRA_MAX = 40;

const INVALID_INPUT = "Revisá los datos de la tarea.";
const NONE_CHOSEN = "Elegí al menos una categoría.";
const OTRA_MISSING = "Contanos cuál es la otra categoría.";
const OTRA_TOO_LONG = `La otra categoría puede tener hasta ${CATEGORIA_OTRA_MAX} caracteres.`;

export type ParsedCategorias =
  | { ok: true; categorias: TaskCategoria[]; categoriaOtra: string | null }
  | { ok: false; error: string };

export function parseCategorias(formData: FormData): ParsedCategorias {
  const raw = formData.getAll("categorias");
  if (raw.length === 0) return { ok: false, error: NONE_CHOSEN };

  // An unknown value is a tampered or stale form: reject it instead of dropping it.
  if (
    raw.some((value) => typeof value !== "string" || !CATEGORIAS.includes(value as TaskCategoria))
  ) {
    return { ok: false, error: INVALID_INPUT };
  }

  const categorias = CATEGORIAS.filter((c) => raw.includes(c));

  if (!categorias.includes("otro")) {
    return { ok: true, categorias, categoriaOtra: null };
  }

  const otra = formData.get("categoria_otra");
  const categoriaOtra = typeof otra === "string" ? otra.trim() : "";
  if (!categoriaOtra) return { ok: false, error: OTRA_MISSING };
  if (categoriaOtra.length > CATEGORIA_OTRA_MAX) return { ok: false, error: OTRA_TOO_LONG };

  return { ok: true, categorias, categoriaOtra };
}

/** "Reparación, Compra"; the Otro text replaces the word Otro when there is one. */
export function formatCategorias(
  categorias: readonly string[],
  categoriaOtra: string | null,
): string {
  if (categorias.length === 0) return CATEGORIA_LABELS.otro;
  return categorias
    .map((c) =>
      c === "otro" && categoriaOtra?.trim()
        ? categoriaOtra.trim()
        : (CATEGORIA_LABELS[c as TaskCategoria] ?? CATEGORIA_LABELS.otro),
    )
    .join(", ");
}

/** The category whose icon represents the task. */
export function primaryCategoria(categorias: readonly string[]): string {
  return categorias[0] ?? "otro";
}
