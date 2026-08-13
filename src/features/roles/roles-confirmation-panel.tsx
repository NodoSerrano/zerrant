"use client";

import { useActionState } from "react";
import { RoleChip } from "@/components/RoleChip";
import { ShieldCheck, CircleCheck } from "lucide-react";
import { confirmProfileRole } from "@/features/roles/actions";

interface UnconfirmedRole {
  roleId: string;
  roleName: string;
}

export interface PendingProfile {
  profileId: string;
  profileName: string;
  roles: UnconfirmedRole[];
}

interface RolesConfirmationPanelProps {
  data: PendingProfile[];
}

export function RolesConfirmationPanel({ data }: RolesConfirmationPanelProps) {
  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-10">
        <div className="size-20 rounded-full bg-surface-inset flex items-center justify-center">
          <CircleCheck className="size-8 text-text-muted" />
        </div>
        <p className="font-body text-sm text-text-secondary text-center">
          No hay roles pendientes de confirmación
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <div className="size-10 rounded-full bg-brand-blue/10 flex items-center justify-center">
          <ShieldCheck className="size-5 text-brand-blue" />
        </div>
        <h1 className="font-display text-[22px] font-bold text-text-primary">Roles a confirmar</h1>
      </div>

      <div className="flex flex-col gap-4">
        {data.map((profile) => (
          <div
            key={profile.profileId}
            className="rounded-[24px] bg-surface border border-border p-4 flex flex-col gap-3 shadow-[0_10px_30px_-12px_#1a161426]"
          >
            <p className="font-display text-base font-semibold text-text-primary">
              {profile.profileName}
            </p>
            <div className="flex flex-wrap gap-2">
              {profile.roles.map((role) => (
                <ConfirmRoleChip
                  key={role.roleId}
                  profileId={profile.profileId}
                  roleId={role.roleId}
                  roleName={role.roleName}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ConfirmRoleChip({
  profileId,
  roleId,
  roleName,
}: {
  profileId: string;
  roleId: string;
  roleName: string;
}) {
  const [state, action, pending] = useActionState(confirmProfileRole, null);

  return (
    <form action={action} className="inline-flex flex-col gap-1">
      <input type="hidden" name="profileId" value={profileId} />
      <input type="hidden" name="roleId" value={roleId} />
      <button
        type="submit"
        disabled={pending}
        aria-label={`Confirmar rol ${roleName}`}
        className="inline-flex items-center gap-1.5 disabled:opacity-50"
      >
        <RoleChip label={roleName} confirmed={false} />
      </button>
      {state?.error && (
        <p role="alert" className="font-body text-xs text-coral">
          {state.error}
        </p>
      )}
    </form>
  );
}
