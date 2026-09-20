import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { JoinRequestRow } from "@/features/projects/JoinRequestRow";
import {
  joinRequestCountLabel,
  type JoinRequestViewModel,
} from "@/features/projects/join-request-transform";

export function JoinRequestQueue({
  projectId,
  projectName,
  requests,
}: {
  projectId: string;
  projectName: string;
  requests: JoinRequestViewModel[];
}) {
  return (
    <div className="flex w-full flex-col gap-[18px]">
      <div className="flex items-center gap-3 w-full">
        <Link
          href={`/nodo/projects/${projectId}`}
          aria-label="Volver al proyecto"
          className="flex items-center justify-center"
        >
          <ChevronLeft size={24} className="text-text-primary" />
        </Link>
        <span className="font-display text-base font-medium text-text-primary">
          Solicitudes de ingreso
        </span>
      </div>

      <div className="flex flex-col gap-[3px] w-full">
        <h1 className="font-display text-[22px] font-bold text-text-primary">{projectName}</h1>
        <p className="font-body text-[13px] text-text-secondary">
          {joinRequestCountLabel(requests.length)}
        </p>
      </div>

      <div className="flex flex-col gap-3 w-full">
        {requests.length === 0 ? (
          <p className="font-body text-[14px] text-text-muted text-center py-8">
            No hay solicitudes pendientes
          </p>
        ) : (
          requests.map((request) => (
            <JoinRequestRow key={request.profileId} projectId={projectId} request={request} />
          ))
        )}
      </div>
    </div>
  );
}
