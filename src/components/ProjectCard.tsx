import Link from "next/link";
import { Avatar } from "@/components/Avatar";
import type { JoinAffordance } from "@/features/projects/membership";
import { ProjectJoinButton } from "@/features/projects/ProjectJoinButton";
import { getProjectEstadoBadge } from "@/features/projects/projectDisplay";
import { cn } from "@/lib/utils";

export interface ProjectCardMember {
  name: string;
  src?: string | null;
}

interface ProjectCardProps {
  projectId: string;
  href: string;
  name: string;
  description?: string | null;
  estado: string;
  /** archivado_en is set: badge reads Archivado (ZER-201). */
  archived?: boolean;
  /** What the viewer can do with this project; entry rules live in the detail (ZER-154). */
  affordance: JoinAffordance;
  members?: ProjectCardMember[];
  memberCount?: number;
  className?: string;
}

const MAX_VISIBLE_MEMBERS = 3;

function CardAction({ projectId, affordance }: { projectId: string; affordance: JoinAffordance }) {
  if (affordance.kind === "join") {
    return <ProjectJoinButton projectId={projectId} label={affordance.label} compact />;
  }
  return (
    <span className="font-body text-xs font-medium text-text-secondary">
      {affordance.kind === "pending" ? affordance.label : "Participás"}
    </span>
  );
}

export function ProjectCard({
  projectId,
  href,
  name,
  description,
  estado,
  archived = false,
  affordance,
  members = [],
  memberCount,
  className,
}: ProjectCardProps) {
  const badge = getProjectEstadoBadge(estado, { archived });
  const totalMembers = memberCount ?? members.length;
  const visible = members.slice(0, MAX_VISIBLE_MEMBERS);
  const overflow = Math.max(0, totalMembers - visible.length);

  return (
    <article
      className={cn(
        "relative rounded-[24px] bg-surface border border-border shadow-[0_10px_30px_-12px_rgba(26,22,20,0.15)] p-4 flex flex-col gap-3 w-full",
        "has-[a:focus-visible]:ring-2 has-[a:focus-visible]:ring-primary/40",
        className,
      )}
    >
      <div className="flex items-center gap-2 w-full">
        {/* The title link stretches over the card, so the whole card opens the
            detail while the action button stays a separate, valid control. */}
        <Link
          href={href}
          className="font-display text-[17px] font-medium text-text-primary truncate flex-1 min-w-0 focus:outline-hidden after:absolute after:inset-0 after:rounded-[24px]"
          title={name}
        >
          {name}
        </Link>
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
        <p className="font-body text-[13px] text-text-secondary leading-[1.45] line-clamp-2">
          {description}
        </p>
      ) : null}

      <div className="flex justify-between items-center w-full gap-3">
        {totalMembers > 0 ? (
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
        ) : (
          <span />
        )}
        <div className="relative z-10 shrink-0">
          <CardAction projectId={projectId} affordance={affordance} />
        </div>
      </div>
    </article>
  );
}
