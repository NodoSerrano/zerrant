/**
 * Hidden `next` for auth forms (ZER-136). Expects an already-validated path;
 * the default "/" is omitted so forms without a deep link post nothing extra.
 * The server action re-validates it anyway.
 */
export function NextField({ next }: { next: string }) {
  if (next === "/") return null;
  return <input type="hidden" name="next" value={next} />;
}
