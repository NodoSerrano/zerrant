import Link from "next/link";
import { getOnboardingGateProfile } from "@/features/profile/onboarding-gate-server";
import { NO_ROWS } from "@/features/profile/onboarding-gate";
import { Step1Form } from "./Step1Form";

export const dynamic = "force-dynamic";

const LOAD_ERROR = "No pudimos cargar tu perfil. Probá de nuevo.";

function PrefillLoadError() {
  return (
    <div className="flex flex-col gap-[22px]">
      <div className="flex justify-end">
        <p className="text-[13px] font-medium text-text-muted">Paso 1 de 2</p>
      </div>

      <div className="flex flex-col gap-1.5">
        <h1 className="font-display text-[26px] font-bold text-text-primary">Creá tu perfil</h1>
        <p className="text-sm text-text-secondary">Así el resto de la comunidad te conoce.</p>
      </div>

      <p role="alert" className="text-sm text-coral bg-coral/10 rounded-md px-3 py-2">
        {LOAD_ERROR}
      </p>

      <Link
        href="/onboarding/step1"
        className="inline-flex h-[54px] items-center justify-center rounded-pill border border-border bg-surface px-6 font-display text-base font-medium text-text-primary transition-all hover:bg-surface-inset active:scale-[0.98]"
      >
        Reintentar
      </Link>
    </div>
  );
}

export default async function OnboardingStep1() {
  // Shares React.cache hit with the (onboarding) template gate — one profiles select per RSC request.
  const { profile, error } = await getOnboardingGateProfile();

  // Real read failures must not collapse into a silent empty prefill (ZER-56).
  // PGRST116 / missing row still shows the empty form.
  if (error && error.code !== NO_ROWS) {
    console.warn("[onboarding/step1] no se pudo leer el perfil para el prefill");
    return <PrefillLoadError />;
  }

  return (
    <Step1Form
      defaults={{
        nombre: profile?.nombre,
        apellido: profile?.apellido,
        apodo: profile?.apodo,
        fecha_nacimiento: profile?.fecha_nacimiento,
      }}
      avatarUrl={profile?.avatar_url}
    />
  );
}
