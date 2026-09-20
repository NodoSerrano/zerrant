import { cn } from "@/lib/utils";
import { aporteTipoIcon, aporteTipoIconWell, buildAporteMeta } from "@/features/aportes/types";

export interface AporteItemProps {
  tipo: string;
  descripcion: string;
  fecha: string;
  monto: number | null;
  className?: string;
}

export function AporteItem({ tipo, descripcion, fecha, monto, className }: AporteItemProps) {
  const Icon = aporteTipoIcon(tipo);
  const meta = buildAporteMeta(tipo, fecha, monto);

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-[20px] bg-surface border border-border p-3.5 w-full",
        className,
      )}
      data-testid="aporte-item"
    >
      <div
        className={cn(
          "size-10 shrink-0 rounded-full flex items-center justify-center",
          aporteTipoIconWell(tipo),
        )}
      >
        <Icon size={18} aria-hidden className="shrink-0" />
      </div>
      <div className="flex flex-col gap-0.5 min-w-0 flex-1">
        <span className="font-display text-sm font-medium text-text-primary truncate">
          {descripcion}
        </span>
        <span className="font-body text-xs text-text-muted truncate">{meta}</span>
      </div>
    </div>
  );
}
