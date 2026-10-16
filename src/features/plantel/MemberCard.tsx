import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Avatar } from "@/components/Avatar";
import { TierBadge } from "@/components/TierBadge";
import { PlatformAdminBadge } from "@/components/PlatformAdminBadge";
import { RoleChip } from "@/components/RoleChip";
import { cn } from "@/lib/utils";
import type { SerranoMember } from "./types";

export function MemberCard({ member }: { member: SerranoMember }) {
  return (
    <Link
      href={`/plantel/${member.id}`}
      className={cn(
        "rounded-[24px] bg-surface border border-border p-4 flex flex-col gap-[14px]",
        "shadow-[0_10px_30px_-12px_rgba(26,22,20,0.15)]",
      )}
    >
      <div className="flex items-center gap-3">
        <Avatar name={member.name} src={member.avatarUrl} size="md" />
        <div className="flex flex-col gap-1 min-w-0">
          <span className="font-display text-[17px] font-medium text-text-primary truncate">
            {member.name}
          </span>
          <div className="flex items-center gap-[6px] flex-wrap">
            <TierBadge tier={member.tier} />
            {member.isPlatformAdmin ? <PlatformAdminBadge /> : null}
          </div>
        </div>
        <ChevronRight size={20} className="text-text-muted ml-auto shrink-0" />
      </div>
      {member.roles.length > 0 && (
        <div className="flex gap-[6px] flex-wrap">
          {member.roles.map((role) => (
            <RoleChip key={role} label={role} confirmed />
          ))}
        </div>
      )}
    </Link>
  );
}
