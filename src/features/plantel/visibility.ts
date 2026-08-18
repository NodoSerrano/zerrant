type RateVisibility = "publica" | "privada";

interface CanSeeRateArgs {
  isSelf: boolean;
  isAdmin: boolean;
  visibilidadTarifa: RateVisibility;
  hasTarifa: boolean;
}

export function canSeeRate({
  isSelf,
  isAdmin,
  visibilidadTarifa,
  hasTarifa,
}: CanSeeRateArgs): boolean {
  if (!hasTarifa) return false;
  return isSelf || isAdmin || visibilidadTarifa === "publica";
}

export function telegramHref(value: string | null | undefined): string | null {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  const handle = trimmed.startsWith("@") ? trimmed.slice(1) : trimmed;
  return `https://t.me/${handle}`;
}
