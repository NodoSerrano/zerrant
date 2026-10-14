import { Check } from "lucide-react";
import type { PipelineProgress } from "@/features/membership/pipeline";
import { cn } from "@/lib/utils";

const LABEL_TONE = {
  done: "text-text-secondary",
  current: "font-semibold text-text-primary",
  pending: "text-text-muted",
} as const;

function Dot({ status }: { status: "done" | "current" | "pending" }) {
  if (status === "done") {
    return (
      <span className="flex size-[26px] shrink-0 items-center justify-center rounded-full bg-brand-green">
        <Check className="size-3.5 text-on-primary" aria-hidden />
      </span>
    );
  }
  if (status === "current") {
    return (
      <span className="flex size-[26px] shrink-0 items-center justify-center rounded-full border-2 border-brand-blue bg-brand-blue/12">
        <span className="size-2 rounded-full bg-brand-blue" />
      </span>
    );
  }
  return <span className="size-[26px] shrink-0 rounded-full border-2 border-border" />;
}

/** Eight-step membership timeline (Pencil 1.10). */
export function Timeline({ progress }: { progress: PipelineProgress }) {
  return (
    <ol className="m-0 flex list-none flex-col gap-3.5 rounded-[22px] border border-border bg-surface p-[18px]">
      {progress.steps.map((step) => {
        const nonBlocking = step.key === "verificacion" && step.status === "pending";
        return (
          <li
            key={step.key}
            data-step={step.key}
            data-status={step.status}
            aria-current={step.status === "current" ? "step" : undefined}
            className="flex items-center gap-3"
          >
            <Dot status={step.status} />
            <span className={cn("flex-1 font-body text-[14px]", LABEL_TONE[step.status])}>
              {step.label}
            </span>
            {step.status === "current" ? (
              <span className="font-body text-[12px] font-medium text-brand-blue">Ahora</span>
            ) : nonBlocking ? (
              <span className="font-body text-[12px] font-medium text-text-muted">
                Pendiente · no bloquea
              </span>
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
