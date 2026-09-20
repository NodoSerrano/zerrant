import Link from "next/link";

/**
 * Placeholder destination for ZER-79 empty-state / FAB CTAs.
 * Full create flow lands in story 5.3 (ZER-80).
 */
export default function NewProjectPlaceholderPage() {
  return (
    <div className="flex flex-col gap-4 p-1">
      <h1 className="font-display text-2xl font-bold text-text-primary">Crear proyecto</h1>
      <p className="font-body text-sm text-text-secondary">
        Esta pantalla se completa en la story de crear proyecto. Mientras tanto, volvé al listado.
      </p>
      <Link
        href="/nodo/projects"
        className="font-display text-sm font-semibold text-brand-green underline-offset-2 hover:underline"
      >
        Volver a proyectos
      </Link>
    </div>
  );
}
