import Link from "next/link";

export default function PlantelMemberPage() {
  return (
    <div className="flex flex-col items-center gap-4 py-10">
      <h1 className="font-display text-2xl font-bold text-text-primary">Detalle de miembro</h1>
      <Link href="/plantel" className="font-body text-sm text-text-secondary underline">
        Volver al plantel
      </Link>
    </div>
  );
}
