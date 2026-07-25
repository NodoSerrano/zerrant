import { Mountain, UserRound, Moon, LogOut, ChevronRight } from "lucide-react";
import Link from "next/link";
import { Avatar } from "@/components/Avatar";
import { TierBadge } from "@/components/TierBadge";
import { DarkModeToggle } from "@/components/DarkModeToggle";
import { signOut } from "@/features/auth/actions";

interface TouristProfileProps {
  name: string;
  avatarUrl: string | null;
  email: string;
}

function MenuRow({
  icon,
  label,
  href,
  trailing,
}: {
  icon: React.ReactNode;
  label: string;
  href?: string;
  trailing?: React.ReactNode;
}) {
  const content = (
    <>
      <span className="flex size-5 items-center justify-center shrink-0">{icon}</span>
      <span className="flex-1 text-sm text-text-primary">{label}</span>
      {trailing ?? <ChevronRight className="size-[18px] text-text-muted shrink-0" />}
    </>
  );

  return (
    <div className="flex items-center gap-3 px-4 py-[15px]">
      {href ? (
        <Link href={href} className="flex items-center gap-3 flex-1 min-w-0">
          {content}
        </Link>
      ) : (
        <div className="flex items-center gap-3 flex-1 min-w-0">{content}</div>
      )}
    </div>
  );
}

export function TouristProfile({ name, avatarUrl, email }: TouristProfileProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-text-primary">Mi perfil</h1>
      </div>

      <div className="flex flex-col items-center gap-[14px] rounded-[24px] border border-border bg-surface p-4">
        <Avatar name={name} src={avatarUrl} size="lg" className="size-[60px]" />
        <div className="flex flex-col items-center gap-[5px]">
          <h2 className="font-display text-lg font-bold text-text-primary">{name}</h2>
          <div className="flex items-center gap-2">
            <TierBadge tier="tourist" />
            <span className="text-xs text-text-muted font-body">{email}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-[22px] bg-linear-to-br from-brand-mint to-brand-blue p-[18px]">
        <div className="flex items-center gap-2.5">
          <Mountain className="size-[22px] text-on-primary" />
          <h3 className="font-display text-[17px] font-bold text-on-primary">
            Todavía sos Tourist
          </h3>
        </div>
        <p className="text-[13px] text-on-primary/88 leading-relaxed font-body">
          Sumate como Serrano para aparecer en el plantel, crear eventos y participar de los
          proyectos.
        </p>
        <div className="flex h-[46px] w-full items-center justify-center rounded-pill bg-on-primary">
          <span className="font-display text-[15px] font-semibold text-brand-blue">
            Solicitar ser Serrano
          </span>
        </div>
      </div>

      <div className="overflow-hidden rounded-[20px] border border-border bg-surface">
        <MenuRow
          icon={<UserRound className="size-5 text-brand-blue" />}
          label="Editar perfil"
          href="/profile/edit"
        />
        <div className="h-px bg-border" />
        <div className="flex items-center gap-3 px-4 py-[13px]">
          <span className="flex size-5 items-center justify-center shrink-0">
            <Moon className="size-5 text-brand-blue" />
          </span>
          <span className="flex-1 text-sm text-text-primary">Modo oscuro</span>
          <DarkModeToggle />
        </div>
        <div className="h-px bg-border" />
        <form action={signOut}>
          <button
            type="submit"
            className="flex w-full items-center gap-3 px-4 py-[15px]"
          >
            <span className="flex size-5 items-center justify-center shrink-0">
              <LogOut className="size-5 text-coral" />
            </span>
            <span className="text-sm text-coral">Cerrar sesión</span>
          </button>
        </form>
      </div>
    </div>
  );
}
