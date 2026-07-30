export function relativeTime(date: string): string {
  const now = Date.now();
  const then = new Date(date).getTime();

  // El dato viene de una columna: una fecha ilegible no debe convertirse en
  // "hace NaN días" en pantalla.
  if (Number.isNaN(then)) return "";

  const diffMs = now - then;
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMinutes < 1) return "ahora";
  if (diffMinutes < 60) return `hace ${diffMinutes} min`;
  if (diffHours < 24) return `hace ${diffHours} ${diffHours === 1 ? "hora" : "horas"}`;
  if (diffDays < 30) return `hace ${diffDays} ${diffDays === 1 ? "día" : "días"}`;
  if (diffDays < 365) {
    const meses = Math.floor(diffDays / 30);
    return `hace ${meses} ${meses === 1 ? "mes" : "meses"}`;
  }
  const años = Math.floor(diffDays / 365);
  return `hace ${años} ${años === 1 ? "año" : "años"}`;
}
