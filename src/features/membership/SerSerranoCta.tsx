import { ArrowRight, Mountain } from "lucide-react";
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
 * One short question; the benefits page holds the details and the way in (ZER-191).
 */
export function SerSerranoCta({ className }: SerSerranoCtaProps) {
  return (
    <div
      className={cn("rounded-[22px] p-[18px] flex flex-col gap-3", BRAND_GRADIENT_CLASS, className)}
      data-testid="ser-serrano-cta"
    >
      <div className="flex items-center gap-2.5">
        <Mountain size={22} className="text-on-gradient shrink-0" aria-hidden />
        <p className="font-display text-[16px] font-bold text-on-gradient leading-snug">
          ¿Querés conocer los beneficios de ser Serrano?
        </p>
      </div>
      <Link
        href={SER_SERRANO_CTA_HREF}
        className={cn(
          "group flex min-h-[44px] h-[46px] w-full items-center justify-center gap-2 rounded-pill",
          "bg-surface text-text-primary shadow-[0_4px_14px_-4px_rgba(26,22,20,0.35)]",
          "transition-all hover:bg-surface-inset active:scale-[0.98]",
          "focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-on-gradient/60",
        )}
      >
        <span className="font-display text-[15px] font-semibold">Ver beneficios</span>
        <ArrowRight
          aria-hidden
          className="size-4 transition-transform group-hover:translate-x-0.5"
        />
      </Link>
    </div>
  );
}
