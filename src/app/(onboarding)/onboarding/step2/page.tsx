import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getOnboardingGateProfile } from "@/features/profile/onboarding-gate-server";
import { NO_ROWS } from "@/features/profile/onboarding-gate";
import { Step2Form } from "./Step2Form";

export const dynamic = "force-dynamic";

const LOAD_ERROR = "No pudimos cargar tu perfil. Probá de nuevo.";

function PrefillLoadError() {
  return (
    <div className="flex flex-col gap-[22px]">
      <div className="flex justify-between items-center">
        <Link
          href="/onboarding/step1"
          aria-label="Volver al paso 1"
          className="inline-flex text-text-primary"
        >
          <ChevronLeft className="w-6 h-6" aria-hidden />
        </Link>
        <p className="text-[13px] font-medium text-text-muted">Paso 2 de 2</p>
      </div>

      <div className="flex flex-col gap-1.5">
        <h1 className="font-display text-[26px] font-bold text-text-primary">Contá un poco más</h1>
        <p className="text-sm text-text-secondary">Sumá tu bio y cómo te contactan.</p>
      </div>

      <p role="alert" className="text-sm text-coral bg-coral/10 rounded-md px-3 py-2">
        {LOAD_ERROR}
      </p>

      <Link
        href="/onboarding/step2"
        className="inline-flex h-[54px] items-center justify-center rounded-pill border border-border bg-surface px-6 font-display text-base font-medium text-text-primary transition-all hover:bg-surface-inset active:scale-[0.98]"
      >
        Reintentar
      </Link>
    </div>
  );
}

export default async function OnboardingStep2() {
  // Shares React.cache hit with the (onboarding) template gate — one profiles select per RSC request.
  const { profile, error } = await getOnboardingGateProfile();

  // Real read failures must not collapse into a silent empty prefill (ZER-56 pattern).
  // PGRST116 / missing row still shows the empty form.
  if (error && error.code !== NO_ROWS) {
    console.warn("[onboarding/step2] no se pudo leer el perfil para el prefill");
    return <PrefillLoadError />;
  }

  return (
    <Step2Form
      defaults={{
        bio: profile?.bio,
        contacto_telegram: profile?.contacto_telegram,
        sitio_url: profile?.sitio_url,
      }}
    />
  );
}
