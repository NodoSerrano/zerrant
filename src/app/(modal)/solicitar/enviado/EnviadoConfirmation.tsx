import Link from "next/link";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { BRAND_CTA_SHADOW_CLASS, BRAND_GRADIENT_CLASS } from "@/lib/brandGradients";

export function EnviadoConfirmation() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-5">
      <div
        className={cn(
          "flex size-[104px] items-center justify-center rounded-full",
          BRAND_GRADIENT_CLASS,
        )}
      >
        <Check className="size-12 text-on-primary" />
      </div>

      <div className="flex flex-col items-center gap-2.5">
        <h1 className="font-display text-[22px] font-bold text-text-primary">
          ¡Solicitud enviada!
        </h1>
        <p className="font-body text-[14px] text-text-secondary leading-[1.5] text-center">
          Un admin va a revisar tu pedido. Te avisamos cuando te aprueben como Serrano.
        </p>
      </div>

      <Link
        href="/"
        className={cn(
          "inline-flex items-center justify-center rounded-pill font-display text-[16px] font-medium text-on-primary",
          BRAND_GRADIENT_CLASS,
          BRAND_CTA_SHADOW_CLASS,
          "h-[54px] px-6 w-full",
        )}
      >
        Volver al inicio
      </Link>
    </div>
  );
}
