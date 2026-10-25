import Link from "next/link";
import { Lock } from "lucide-react";
import { SystemStateView } from "@/features/system-states/SystemStateView";
import { SER_SERRANO_CTA_HREF } from "./ser-serrano-cta";

/**
 * ZER-204: what a tourist sees on members-only pages (projects and tasks of
 * the Nodo) instead of the 404 the empty, RLS-filtered read used to produce.
 */
export function MembersOnlyState({ canApply }: { canApply: boolean }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center">
      <SystemStateView
        className="min-h-0 pb-3"
        dataPencilFrame="members-only"
        icon={Lock}
        iconTone="neutral"
        title="Esto es solo para Serranos"
        subtitle={
          canApply
            ? "Los proyectos y las tareas del Nodo son para miembros. Sumate como Serrano para verlos y participar."
            : "Tu solicitud para ser Serrano está en curso. Cuando te aprueben vas a poder ver los proyectos y las tareas."
        }
        action={
          canApply
            ? { type: "link", href: SER_SERRANO_CTA_HREF, label: "Quiero ser Serrano" }
            : { type: "link", href: "/profile", label: "Ver mi solicitud" }
        }
      />
      <Link
        href="/"
        className="font-display text-sm font-medium text-text-secondary underline-offset-2 hover:underline"
      >
        Volver al inicio
      </Link>
    </div>
  );
}
