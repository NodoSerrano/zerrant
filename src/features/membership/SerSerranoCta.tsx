import { Mountain } from "lucide-react";
import Link from "next/link";
import { BRAND_GRADIENT_CLASS } from "@/lib/brandGradients";
import { cn } from "@/lib/utils";
import { SER_SERRANO_CTA_HREF } from "./ser-serrano-cta";

export type SerSerranoCtaProps = {
  /** Optional compact spacing for dense hubs (Inicio / Agenda / Plantel). */
  className?: string;
};

/**
 * Persistent join CTA for tourists without an active request (ZER-171).
 * Reuses the tourist-profile gradient card so light/dark contrast stays on brand tokens.
 */
export function SerSerranoCta({ className }: SerSerranoCtaProps) {
  return (
    <div
      className={cn("rounded-[22px] p-[18px] flex flex-col gap-3", BRAND_GRADIENT_CLASS, className)}
      data-testid="ser-serrano-cta"
    >
      <div className="flex items-center gap-2.5">
        <Mountain size={22} className="text-on-gradient shrink-0" aria-hidden />
        <span className="font-display text-[17px] font-bold text-on-gradient">
          Todavía sos Turista
        </span>
      </div>
      <p className="font-body text-[13px] text-on-gradient/[0.88] leading-relaxed">
        Sumate como Serrano para aparecer en el plantel, crear eventos y participar de los
        proyectos.
      </p>
      <Link
        href={SER_SERRANO_CTA_HREF}
        className="rounded-pill bg-on-primary h-[46px] flex items-center justify-center w-full min-h-[44px] focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-on-primary/50"
      >
        <span className="font-display text-[15px] font-semibold text-brand-blue">
          Solicitar ser Serrano
        </span>
      </Link>
    </div>
  );
}
