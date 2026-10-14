import type { PipelineProgress as PipelineProgressData } from "@/features/membership/pipeline";
import { cn } from "@/lib/utils";

const SEGMENT_TONE = {
  done: "bg-brand-green",
  current: "bg-brand-blue",
  pending: "bg-border",
} as const;

/** Membership pipeline progress (Pencil p1rv1X): current step name + 8 segments. */
export function PipelineProgress({
  progress,
  className,
}: {
  progress: PipelineProgressData;
  className?: string;
}) {
  const total = progress.steps.length;
  const label = progress.steps[progress.current - 1]?.label ?? "";

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-center justify-between gap-2">
        <span className="font-display text-[14px] font-semibold text-text-primary">{label}</span>
        <span className="font-body text-[13px] font-medium text-text-muted">
          Paso {progress.current} de {total}
        </span>
      </div>
      <div
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={total}
        aria-valuenow={progress.current}
        aria-valuetext={`Paso ${progress.current} de ${total}: ${label}`}
        className="flex gap-1"
      >
        {progress.steps.map((step) => (
          <span
            key={step.key}
            data-segment
            data-status={step.status}
            className={cn("h-1 flex-1 rounded-full", SEGMENT_TONE[step.status])}
          />
        ))}
      </div>
    </div>
  );
}
