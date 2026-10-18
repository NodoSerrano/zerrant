import { cn } from "@/lib/utils";

/**
 * ZER-177: the one way an action reports its result in place. Errors are an
 * alert (announced right away), successes a status. When an action redirects
 * instead, the destination shows <ActionNotice>.
 */
export function FormFeedback({
  error,
  success,
  className,
}: {
  error?: string | null;
  success?: string | null;
  className?: string;
}) {
  if (error) {
    return (
      <p
        role="alert"
        className={cn("rounded-md bg-coral/10 px-3 py-2 text-sm text-coral", className)}
      >
        {error}
      </p>
    );
  }
  if (success) {
    return (
      <p
        role="status"
        className={cn(
          "rounded-md bg-brand-green/10 px-3 py-2 text-sm text-text-primary",
          className,
        )}
      >
        {success}
      </p>
    );
  }
  return null;
}
