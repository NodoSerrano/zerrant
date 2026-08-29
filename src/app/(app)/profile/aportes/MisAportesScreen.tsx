import Link from "next/link";
import { ChevronLeft } from "lucide-react";

interface MisAportesScreenProps {
  total: number;
  thisMonth: number;
}

export function MisAportesScreen({ total, thisMonth }: MisAportesScreenProps) {
  return (
    <div className="flex flex-col gap-4 pt-1.5 px-5 pb-6">
      <div className="flex items-center gap-3">
        <Link
          href="/profile"
          aria-label="Volver al perfil"
          className="flex items-center justify-center"
        >
          <ChevronLeft size={24} className="text-text-primary" />
        </Link>
        <h1 className="font-display text-base font-medium text-text-primary">Mis aportes</h1>
      </div>

      <div
        data-testid="aportes-stats"
        className="flex w-full gap-3 rounded-[20px] bg-surface-inset p-4"
      >
        <div className="flex flex-1 flex-col gap-0.5">
          <span className="font-display text-2xl font-bold text-text-primary">{total}</span>
          <span className="font-body text-xs text-text-muted">aportes en total</span>
        </div>
        <div className="flex flex-1 flex-col gap-0.5">
          <span className="font-display text-2xl font-bold text-brand-green">{thisMonth}</span>
          <span className="font-body text-xs text-text-muted">este mes</span>
        </div>
      </div>

      <div className="flex flex-col gap-2.5">
        <p className="font-body text-sm text-text-secondary">Todavía no hay aportes.</p>
      </div>
    </div>
  );
}
