import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { SkillReviewRow } from "@/features/admin/SkillReviewRow";
import { displayName } from "@/features/profile/displayName";
import type { Profile } from "@/features/profile/types";

export const dynamic = "force-dynamic";

type Proposer = Pick<Profile, "nombre" | "apellido" | "apodo"> & {
  nombre_visible: Profile["nombre_visible"] | null;
};

type ProposalRow = {
  id: string;
  nombre: string;
  created_at: string;
  profiles: Proposer | Proposer[] | null;
};

function proposerName(profiles: ProposalRow["profiles"]): string {
  const proposer = Array.isArray(profiles) ? (profiles[0] ?? null) : profiles;
  // propuesta_por is set null when the proposer's profile is deleted.
  if (!proposer) return "Alguien que ya no está";
  return (
    displayName({
      nombre: proposer.nombre,
      apellido: proposer.apellido,
      apodo: proposer.apodo,
      nombre_visible: proposer.nombre_visible ?? "nombre_apellido",
    }) || "Sin nombre"
  );
}

/** ZER-163: skill proposals waiting for an admin. Gated by the admin layout. */
export default async function AdminHabilidadesPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("skills")
    .select(
      "id, nombre, created_at, profiles!skills_propuesta_por_fkey(nombre, apellido, apodo, nombre_visible)",
    )
    .eq("estado", "pendiente")
    .order("created_at", { ascending: true });

  const proposals = (data ?? []) as ProposalRow[];

  return (
    <div className="flex flex-col min-h-screen bg-bg">
      <div className="flex flex-col gap-[18px]">
        <div className="flex items-center gap-3">
          <Link href="/profile" aria-label="Volver al perfil">
            <ChevronLeft className="size-6 text-text-primary" />
          </Link>
          <span className="font-display text-[16px] font-medium text-text-primary">
            Panel de admin
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-[3px]">
            <h1 className="font-display text-[22px] font-bold text-text-primary">
              Habilidades propuestas
            </h1>
            <p className="font-body text-[13px] text-text-secondary">
              Aprobalas para sumarlas al catálogo
            </p>
          </div>
          <div className="rounded-pill bg-coral px-[13px] py-[7px]">
            <span className="font-display text-[14px] font-bold text-on-primary">
              {proposals.length}
            </span>
          </div>
        </div>

        <div className="flex gap-1 p-1 rounded-[14px] bg-surface-inset">
          <Link
            href="/admin/membresias"
            className="rounded-[11px] h-[38px] flex-1 flex items-center justify-center"
          >
            <span className="font-display text-[13px] font-medium text-text-muted">Membresías</span>
          </Link>
          <Link
            href="/admin/roles"
            className="rounded-[11px] h-[38px] flex-1 flex items-center justify-center"
          >
            <span className="font-display text-[13px] font-medium text-text-muted">Roles</span>
          </Link>
          <div className="rounded-[11px] bg-surface h-[38px] flex-1 flex items-center justify-center shadow-[0_2px_6px_#1a161418]">
            <span className="font-display text-[13px] font-semibold text-text-primary">
              Habilidades · {proposals.length}
            </span>
          </div>
        </div>

        {error ? (
          <p role="alert" className="font-body text-[13px] text-coral">
            No pudimos cargar las propuestas
          </p>
        ) : proposals.length === 0 ? (
          <p className="font-body text-[14px] text-text-muted text-center py-8">
            No hay habilidades esperando revisión
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {proposals.map((proposal) => (
              <SkillReviewRow
                key={proposal.id}
                skillId={proposal.id}
                nombre={proposal.nombre}
                proposedBy={proposerName(proposal.profiles)}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
