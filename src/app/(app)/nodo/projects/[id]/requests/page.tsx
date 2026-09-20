type PageProps = {
  params: Promise<{ id: string }>;
};

/** Placeholder until story 5.6 (ZER-83) ships the join-request queue. */
export default async function ProjectJoinRequestsPlaceholderPage({ params }: PageProps) {
  const { id } = await params;
  return (
    <div className="flex flex-col gap-3">
      <h1 className="font-display text-2xl font-bold text-text-primary">Solicitudes de ingreso</h1>
      <p className="font-body text-sm text-text-secondary">
        La cola completa llega en la story de solicitudes. Proyecto: {id}
      </p>
    </div>
  );
}
