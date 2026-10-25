import { cn } from "@/lib/utils";
import {
  DONACION_TIPO_UI_LABELS,
  type AporteEstado,
  type DonacionTipoUi,
  APORTE_TIPO_TO_DONACION_UI,
  formatPrestamoRango,
} from "@/lib/db/donaciones-schema";
import { formatAporteFecha } from "@/features/aportes/types";
import { Gift, HandCoins } from "lucide-react";

export interface DonacionItemProps {
  titulo: string;
  tipo: string;
  fecha: string;
  estado: AporteEstado | null;
  descripcion?: string | null;
  prestamoDesde?: string | null;
  prestamoHasta?: string | null;
  className?: string;
}

const ESTADO_LABEL: Record<AporteEstado, string> = {
  pendiente: "Pendiente",
  aprobado: "Aprobada",
  rechazado: "Rechazada",
};

export function DonacionItem({
  titulo,
  tipo,
  fecha,
  estado,
  descripcion,
  prestamoDesde,
  prestamoHasta,
  className,
}: DonacionItemProps) {
  const ui = APORTE_TIPO_TO_DONACION_UI[tipo as keyof typeof APORTE_TIPO_TO_DONACION_UI] as
    | DonacionTipoUi
    | undefined;
  const tipoLabel = ui ? DONACION_TIPO_UI_LABELS[ui] : tipo;
  const Icon = ui === "por_un_tiempo" ? HandCoins : Gift;
  const metaParts = [tipoLabel, formatAporteFecha(fecha)];
  if (estado) metaParts.push(ESTADO_LABEL[estado]);
  const rango = formatPrestamoRango(prestamoDesde, prestamoHasta, formatAporteFecha);
  if (rango) metaParts.push(rango);
  if (descripcion) metaParts.push(descripcion);

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-[20px] bg-surface border border-border p-3.5 w-full",
        className,
      )}
      data-testid="donacion-item"
    >
      <div className="size-10 shrink-0 rounded-full flex items-center justify-center bg-brand-green/10 text-brand-green">
        <Icon size={18} aria-hidden className="shrink-0" />
      </div>
      <div className="flex flex-col gap-0.5 min-w-0 flex-1">
        <span className="font-display text-sm font-medium text-text-primary truncate">
          {titulo}
        </span>
        <span className="font-body text-xs text-text-muted truncate">{metaParts.join(" · ")}</span>
      </div>
    </div>
  );
}
