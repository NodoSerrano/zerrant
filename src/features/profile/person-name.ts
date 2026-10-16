/**
 * Legible person-name casing for nombre/apellido.
 *
 * Trim + collapse spaces, lower the whole string, then title-case each word
 * segment (split on space, hyphen, apostrophe). Particles (de, la, del, …)
 * stay lowercase except the first token of the field, so "de la cruz" →
 * "De la Cruz" and "núñez de la cruz" → "Núñez de la Cruz".
 */

const PARTICLES = new Set([
  "de",
  "del",
  "la",
  "las",
  "los",
  "y",
  "e",
  "da",
  "das",
  "do",
  "dos",
  "van",
  "von",
  "di",
  "du",
  "der",
]);

function capitalizeSegment(segment: string): string {
  if (!segment) {
    return segment;
  }
  return segment.charAt(0).toLocaleUpperCase("es") + segment.slice(1);
}

function formatWord(word: string, isFirstWord: boolean): string {
  const parts = word.split(/(['’-])/);
  return parts
    .map((part, i) => {
      if (part === "'" || part === "’" || part === "-") {
        return part;
      }
      if (i === 0 && !isFirstWord && PARTICLES.has(part)) {
        return part;
      }
      return capitalizeSegment(part);
    })
    .join("");
}

export function formatPersonName(raw: string): string {
  const collapsed = raw.trim().replace(/\s+/g, " ");
  if (!collapsed) {
    return collapsed;
  }

  const lower = collapsed.toLocaleLowerCase("es");
  const words = lower.split(" ");
  return words.map((word, i) => formatWord(word, i === 0)).join(" ");
}
