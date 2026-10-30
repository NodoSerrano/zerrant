import Link from "next/link";
import { redirect } from "next/navigation";
import { Check, ChevronLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { MEMBERSHIP_PIPELINE_STEPS } from "@/features/membership/pipeline";
import { APORTE_REFERENCIA_PARAGRAPHS } from "@/features/membership/screening";
import {
  SER_SERRANO_APPLY_HREF,
  SER_SERRANO_BENEFICIOS,
} from "@/features/membership/ser-serrano-cta";
import { BRAND_CTA_SHADOW_CLASS, BRAND_GRADIENT_CLASS } from "@/lib/brandGradients";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

// What happens after applying, as the pipeline already names it.
const NEXT_STEPS = MEMBERSHIP_PIPELINE_STEPS.slice(
  MEMBERSHIP_PIPELINE_STEPS.findIndex((step) => step.key === "solicitud"),
);

/**
 * ZER-191: everything a tourist needs to decide, and only then the way in.
 * Copy is reused from the app (CTA, aporte guide, pipeline) until product
 * writes the final text.
 */
export default async function SerSerranoPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?next=%2Fser-serrano");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("tier")
    .eq("id", user.id)
    .single();

  if (profile && profile.tier !== "tourist") {
    redirect("/");
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Link
          href="/"
          aria-label="Volver a Inicio"
          className="-ml-2.5 inline-flex size-11 shrink-0 items-center justify-center text-text-primary"
        >
          <ChevronLeft size={24} />
        </Link>
        <h1 className="font-display text-[22px] font-bold text-text-primary">Ser Serrano</h1>
      </div>

      <section aria-labelledby="ser-serrano-ganas" className="flex flex-col gap-3">
        <h2
          id="ser-serrano-ganas"
          className="font-display text-[17px] font-semibold text-text-primary"
        >
          Qué ganás
        </h2>
        <ul className="flex flex-col gap-2">
          {SER_SERRANO_BENEFICIOS.map((beneficio) => (
            <li key={beneficio} className="flex items-center gap-2.5">
              <Check aria-hidden className="size-4 shrink-0 text-brand-green" />
              <span className="font-body text-[15px] text-text-primary">{beneficio}</span>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="ser-serrano-aporte" className="flex flex-col gap-3">
        <h2
          id="ser-serrano-aporte"
          className="font-display text-[17px] font-semibold text-text-primary"
        >
          Aporte de referencia
        </h2>
        <div className="flex flex-col gap-2.5 rounded-2xl bg-surface-inset p-4">
          {APORTE_REFERENCIA_PARAGRAPHS.map((paragraph) => (
            <p
              key={paragraph}
              className="font-body text-[14px] text-text-secondary leading-relaxed"
            >
              {paragraph}
            </p>
          ))}
        </div>
      </section>

      <section aria-labelledby="ser-serrano-pasos" className="flex flex-col gap-3">
        <h2
          id="ser-serrano-pasos"
          className="font-display text-[17px] font-semibold text-text-primary"
        >
          Cómo sigue
        </h2>
        <ol className="flex flex-col gap-2">
          {NEXT_STEPS.map((step, index) => (
            <li key={step.key} className="flex items-center gap-3">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-surface-inset font-display text-[13px] font-semibold text-text-secondary">
                {index + 1}
              </span>
              <span className="font-body text-[15px] text-text-primary">{step.label}</span>
            </li>
          ))}
        </ol>
      </section>

      <div className="flex flex-col gap-3 pt-2">
        <Link
          href={SER_SERRANO_APPLY_HREF}
          className={cn(
            "inline-flex h-12 items-center justify-center rounded-pill font-display text-[16px] font-medium text-on-gradient",
            BRAND_GRADIENT_CLASS,
            BRAND_CTA_SHADOW_CLASS,
            "focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary/40",
          )}
        >
          Solicitar ser Serrano
        </Link>
        <Link
          href="/"
          className="flex min-h-[44px] items-center justify-center font-display text-[15px] font-medium text-text-muted"
        >
          Ahora no
        </Link>
      </div>
    </div>
  );
}
