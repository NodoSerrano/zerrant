import Link from "next/link";
import { Briefcase, ChevronLeft, Ellipsis, Eye } from "lucide-react";
import { Avatar } from "@/components/Avatar";
import { TierBadge } from "@/components/TierBadge";
import { RoleChip } from "@/components/RoleChip";
import { cn } from "@/lib/utils";
import { availabilityLabel } from "./transform";
import type { Disponibilidad, SerranoMemberDetail } from "./types";

const AVAILABILITY_DOT: Record<Disponibilidad, string> = {
  disponible: "bg-brand-green",
  ocupado: "bg-text-muted",
  solo_eventos: "bg-text-muted",
};

const CTA_CLASSES =
  "inline-flex items-center justify-center rounded-pill font-display font-medium text-on-primary transition-all " +
  "bg-linear-to-br from-brand-green to-brand-blue shadow-[0_4px_14px_rgba(17,88,176,0.33)] " +
  "hover:opacity-90 active:scale-[0.98] h-[54px] px-6 text-base w-full";

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="font-display text-[17px] font-medium text-text-primary">{children}</h2>;
}

export function MemberDetail({ member }: { member: SerranoMemberDetail }) {
  const label = availabilityLabel(member.disponibilidad);
  const dot = member.disponibilidad ? AVAILABILITY_DOT[member.disponibilidad] : null;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <Link
          href="/plantel"
          aria-label="Volver al plantel"
          className="flex items-center justify-center"
        >
          <ChevronLeft size={24} className="text-text-primary" />
        </Link>
        <span className="font-display text-base font-medium text-text-primary">Perfil</span>
        <Ellipsis size={22} className="text-text-primary" aria-hidden />
      </div>

      <div className="flex flex-col items-center gap-3">
        <Avatar name={member.name} src={member.avatarUrl} size="lg" className="size-24" />
        <div className="flex flex-col items-center gap-2">
          <h1 className="font-display text-2xl font-bold text-text-primary">{member.name}</h1>
          <div className="flex items-center gap-2">
            <TierBadge tier={member.tier} />
            {dot && label && (
              <>
                <span className={cn("size-2 rounded-full", dot)} />
                <span className="font-body text-[13px] text-text-secondary">{label}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {member.roles.length > 0 && (
        <section className="flex flex-col gap-3">
          <SectionTitle>Rol en el nodo</SectionTitle>
          <div className="flex gap-2 flex-wrap">
            {member.roles.map((role) => (
              <RoleChip key={role} label={role} confirmed />
            ))}
          </div>
        </section>
      )}

      <section className="flex flex-col gap-3">
        <SectionTitle>Aportes</SectionTitle>
        <p className="font-body text-sm text-text-secondary">Todavía no hay aportes.</p>
      </section>

      <section className="flex flex-col gap-3">
        <SectionTitle>Proyectos</SectionTitle>
        <p className="font-body text-sm text-text-secondary">Todavía no hay proyectos.</p>
      </section>

      {member.skills.length > 0 && (
        <section className="flex flex-col gap-3">
          <SectionTitle>Habilidades</SectionTitle>
          <div className="flex gap-2 flex-wrap">
            {member.skills.map((skill) => (
              <span
                key={skill}
                className="rounded-pill bg-surface-inset border border-border px-[13px] py-[7px] font-body text-xs font-medium text-text-secondary"
              >
                {skill}
              </span>
            ))}
          </div>
        </section>
      )}

      {member.tarifaHora !== null && (
        <section className="rounded-[18px] bg-surface-inset p-[14px] flex items-center gap-3">
          <Briefcase size={20} className="text-text-muted shrink-0" />
          <div className="flex flex-col gap-[2px]">
            <span className="font-body text-xs text-text-muted">Disponible para proyectos</span>
            <span className="font-display text-[15px] font-semibold text-brand-green">
              USD {member.tarifaHora} / hora
            </span>
          </div>
          <Eye size={15} className="text-text-muted ml-auto shrink-0" />
        </section>
      )}

      {member.bio && (
        <section className="flex flex-col gap-2">
          <SectionTitle>Sobre mí</SectionTitle>
          <p className="font-body text-sm text-text-secondary leading-normal">{member.bio}</p>
        </section>
      )}

      {member.telegramHref && (
        <a
          href={member.telegramHref}
          target="_blank"
          rel="noopener noreferrer"
          className={CTA_CLASSES}
        >
          Enviar mensaje
        </a>
      )}
    </div>
  );
}
