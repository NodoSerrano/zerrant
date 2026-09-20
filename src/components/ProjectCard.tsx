import { Globe, Lock } from "lucide-react";
import Link from "next/link";
import { Avatar } from "@/components/Avatar";
import {
  getProjectEstadoBadge,
  getProjectIngresoLabel,
  isProjectIngresoApproval,
} from "@/features/projects/projectDisplay";
import { cn } from "@/lib/utils";

export interface ProjectCardMember {
  name: string;
  src?: string | null;
}

interface ProjectCardProps {
  href?: string;
  name: string;
  description?: string | null;
  estado: string;
  ingreso: string;
  members?: ProjectCardMember[];
  memberCount?: number;
  className?: string;
}

const MAX_VISIBLE_MEMBERS = 3;

export function ProjectCard({
  href,
  name,
  description,
  estado,
  ingreso,
  members = [],
  memberCount,
  className,
}: ProjectCardProps) {
  const badge = getProjectEstadoBadge(estado);
  const ingresoLabel = getProjectIngresoLabel(ingreso);
  const approval = isProjectIngresoApproval(ingreso);
  const totalMembers = memberCount ?? members.length;
  const visible = members.slice(0, MAX_VISIBLE_MEMBERS);
  const overflow = Math.max(0, totalMembers - visible.length);

  const baseClasses = cn(
    "rounded-[24px] bg-surface border border-border shadow-[0_10px_30px_-12px_rgba(26,22,20,0.15)] p-4 flex flex-col gap-3 w-full",
    className,
  );

  const content = (
    <>
      <div className="flex items-center gap-2 w-full">
        <span
          className="font-display text-[17px] font-medium text-text-primary truncate flex-1 min-w-0"
          title={name}
        >
          {name}
        </span>
        <span
          className={cn(
            "shrink-0 rounded-pill px-[11px] py-[5px] font-display text-xs font-semibold",
            badge.bg,
            badge.text,
          )}
        >
          {badge.label}
        </span>
      </div>

      {description ? (
        <p className="font-body text-[13px] text-text-secondary leading-[1.45]">{description}</p>
      ) : null}

      <div className="flex justify-between items-center w-full gap-3">
        <div className="flex items-center gap-1.5 min-w-0">
          {visible.map((member, index) => (
            <Avatar
              key={`${member.name}-${index}`}
              name={member.name}
              src={member.src}
              size="sm"
              className="size-7 text-[11px] ring-2 ring-surface"
            />
          ))}
          {overflow > 0 ? (
            <span className="font-body text-xs font-medium text-text-muted">+{overflow}</span>
          ) : null}
        </div>
        <div className="flex items-center gap-[5px] shrink-0">
          {approval ? (
            <Lock size={13} className="text-text-muted" aria-hidden="true" />
          ) : (
            <Globe size={13} className="text-text-muted" aria-hidden="true" />
          )}
          <span className="font-body text-xs text-text-muted">{ingresoLabel}</span>
        </div>
      </div>
    </>
  );

  if (href) {
    return (
      <Link href={href} className={baseClasses}>
        {content}
      </Link>
    );
  }

  return <div className={baseClasses}>{content}</div>;
}
