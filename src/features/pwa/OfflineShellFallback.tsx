import { WifiOff } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";

/**
 * Designed offline shell surface (FR56).
 * Full Pencil polish for 7.5 lives in ZER-102; this is the SW navigation fallback.
 */
export function OfflineShellFallback() {
  return (
    <EmptyState
      title="Sin conexión"
      subtitle="No hay red ahora. El shell de Nodo sigue disponible; los datos en vivo no."
      icon={WifiOff}
      href="/"
      actionLabel="Reintentar"
      className="pb-5"
    />
  );
}
