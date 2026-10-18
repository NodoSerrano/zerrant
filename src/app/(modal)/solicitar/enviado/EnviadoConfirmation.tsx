import Link from "next/link";
import { Check } from "lucide-react";
import { PipelineProgress } from "@/components/PipelineProgress";
import type { PipelineProgress as PipelineProgressData } from "@/features/membership/pipeline";
import { MEMBERSHIP_STATUS_PATH } from "@/features/membership/pipeline";
import { cn } from "@/lib/utils";
import { BRAND_CTA_SHADOW_CLASS, BRAND_GRADIENT_CLASS } from "@/lib/brandGradients";

export function EnviadoConfirmation({ progress }: { progress?: PipelineProgressData }) {
  const content = (
    <>
      <div
        className={cn(
          "flex size-[104px] items-center justify-center rounded-full",
          BRAND_GRADIENT_CLASS,
        )}
      >
        <Check className="size-12 text-on-gradient" />
      </div>

      <div className="flex flex-col items-center gap-2.5">
        <h1 className="font-display text-[22px] font-bold text-text-primary">
          ¡Solicitud enviada!
        </h1>
        <p className="font-body text-[14px] text-text-secondary leading-[1.5] text-center">
          Un administrador va a revisar tu solicitud. El próximo paso es coordinar una entrevista.
        </p>
      </div>

      <Link
        href="/solicitar/entrevista"
        className={cn(
          "inline-flex items-center justify-center rounded-pill font-display text-[16px] font-medium text-on-gradient",
          BRAND_GRADIENT_CLASS,
          BRAND_CTA_SHADOW_CLASS,
          "h-[54px] px-6 w-full",
        )}
      >
        Elegir horario de entrevista
      </Link>
      <Link
        href={progress ? MEMBERSHIP_STATUS_PATH : "/"}
        className="inline-flex items-center justify-center rounded-pill font-display text-[16px] font-medium text-text-secondary h-[54px] px-6 w-full"
      >
        {progress ? "Ver mi proceso" : "Volver al inicio"}
      </Link>
    </>
  );

  if (!progress) {
    return (
      <div className="flex min-h-full flex-1 flex-col items-center justify-center gap-5">
        {content}
      </div>
    );
  }

  // Membership flow (Pencil 1.9m Jx7u6): the stepper takes its own row at the
  // top and the confirmation stays centered in the remaining height, so they
  // never overlap (bug-375 #2).
  return (
    <div className="flex min-h-full flex-1 flex-col gap-5">
      <PipelineProgress progress={progress} className="px-2" />
      <div className="flex flex-1 flex-col items-center justify-center gap-5">{content}</div>
    </div>
  );
}
