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
