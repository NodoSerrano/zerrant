export function normalizeSkillName(value: string): string | null {
  const normalized = value.trim().replace(/\s+/g, " ");
  return normalized ? normalized : null;
}

export function dedupeSkillNames(names: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const name of names) {
    const key = name.toLocaleLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(name);
  }

  return result;
}

export function computeSkillDiff(
  current: string[],
  target: string[],
): { toAdd: string[]; toRemove: string[] } {
  const currentSet = new Set(current);
  const targetSet = new Set(target);

  return {
    toAdd: target.filter((value) => !currentSet.has(value)),
    toRemove: current.filter((value) => !targetSet.has(value)),
  };
}

export function suggestSkills(catalog: string[], selected: string[], query: string): string[] {
  const selectedSet = new Set(selected.map((value) => value.toLocaleLowerCase()));
  const q = query.trim().toLocaleLowerCase();

  return catalog.filter((skill) => {
    if (selectedSet.has(skill.toLocaleLowerCase())) return false;
    if (!q) return true;
    return skill.toLocaleLowerCase().includes(q);
  });
}

/** ZER-163: optional level per member skill; mirrors the skill_nivel enum. */
export const SKILL_NIVELES = ["basico", "intermedio", "avanzado"] as const;
export type SkillNivel = (typeof SKILL_NIVELES)[number];

export const SKILL_NIVEL_LABELS: Record<SkillNivel, string> = {
  basico: "Básico",
  intermedio: "Intermedio",
  avanzado: "Avanzado",
};

/** Matches the CHECK on profile_skills.anios_freelance / anios_empresa. */
export const SKILL_MAX_ANIOS = 60;

export type SkillExperience = {
  nivel: SkillNivel | null;
  anios_freelance: number | null;
  anios_empresa: number | null;
};

export type SkillItem = SkillExperience & { nombre: string };

const INVALID_ITEMS = "Revisá el nivel y los años de experiencia";

function parseYears(value: unknown): number | null | "invalid" {
  if (value === null || value === undefined || value === "") return null;
  const n = typeof value === "number" ? value : Number(String(value).trim());
  if (!Number.isInteger(n) || n < 0 || n > SKILL_MAX_ANIOS) return "invalid";
  return n;
}

function parseNivel(value: unknown): SkillNivel | null | "invalid" {
  if (value === null || value === undefined || value === "") return null;
  return (SKILL_NIVELES as readonly unknown[]).includes(value) ? (value as SkillNivel) : "invalid";
}

/** The edit form posts its skills as JSON; validate before it reaches the DB. */
export function parseSkillItems(
  raw: FormDataEntryValue | null,
): { items: SkillItem[] } | { error: string } {
  if (raw === null || raw === "") return { items: [] };
  let parsed: unknown;
  try {
    parsed = JSON.parse(String(raw));
  } catch {
    return { error: INVALID_ITEMS };
  }
  if (!Array.isArray(parsed)) return { error: INVALID_ITEMS };

  const seen = new Set<string>();
  const items: SkillItem[] = [];
  for (const entry of parsed) {
    if (!entry || typeof entry !== "object") return { error: INVALID_ITEMS };
    const record = entry as Record<string, unknown>;
    const nombre = normalizeSkillName(String(record.nombre ?? ""));
    if (!nombre) continue;
    const nivel = parseNivel(record.nivel);
    const freelance = parseYears(record.anios_freelance);
    const empresa = parseYears(record.anios_empresa);
    if (nivel === "invalid" || freelance === "invalid" || empresa === "invalid") {
      return { error: INVALID_ITEMS };
    }
    const key = nombre.toLocaleLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    items.push({ nombre, nivel, anios_freelance: freelance, anios_empresa: empresa });
  }
  return { items };
}

function years(n: number, suffix: string): string {
  return `${n} ${n === 1 ? "año" : "años"} ${suffix}`;
}

/** "Avanzado · 3 años freelance · 1 año en empresa"; empty when nothing is set. */
export function formatSkillExperience(experience: SkillExperience): string {
  return [
    experience.nivel ? SKILL_NIVEL_LABELS[experience.nivel] : null,
    experience.anios_freelance !== null ? years(experience.anios_freelance, "freelance") : null,
    experience.anios_empresa !== null ? years(experience.anios_empresa, "en empresa") : null,
  ]
    .filter(Boolean)
    .join(" · ");
}
