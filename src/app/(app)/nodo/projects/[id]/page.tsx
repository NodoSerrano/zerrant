import Link from "next/link";

type PageProps = {
  params: Promise<{ id: string }>;
};

/**
 * Minimal detail destination so create → list → card href resolves.
 * Full detail UI is story 5.4 (ZER-81).
 */
export default async function ProjectDetailPlaceholderPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-display text-2xl font-bold text-text-primary">Proyecto</h1>
      <p className="font-body text-sm text-text-secondary">
        Detalle completo llega en la story de detalle de proyecto. ID: {id}
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
