import Link from "next/link";
import { ChevronLeft, Gift, Plus } from "lucide-react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/EmptyState";
import { DonacionItem } from "@/features/donaciones/DonacionItem";
import type { AporteEstado } from "@/lib/db/donaciones-schema";

export const dynamic = "force-dynamic";

type DonacionRow = {
  id: string;
  titulo: string | null;
  tipo: string;
  descripcion: string | null;
  fecha: string;
  estado: AporteEstado | null;
  prestamo_desde: string | null;
  prestamo_hasta: string | null;
};

type PageProps = {
  searchParams?: Promise<{ aviso?: string }>;
};

export default async function DonacionesPage({ searchParams }: PageProps) {
  const supabase = await createClient();
  const params = searchParams ? await searchParams : {};

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("tier, is_platform_admin")
    .eq("id", user.id)
    .single();

  if (!profile) {
    redirect("/onboarding/step1");
  }

  if (profile.tier === "tourist") {
    redirect("/profile");
  }

  const selectCols = "id, titulo, tipo, descripcion, fecha, estado, prestamo_desde, prestamo_hasta";

  const { data: ownRows } = await supabase
    .from("aportes")
    .select(selectCols)
    .eq("profile_id", user.id)
    .not("estado", "is", null)
    .order("fecha", { ascending: false });

  const { data: communityRows } = await supabase
    .from("aportes")
    .select(selectCols)
    .eq("estado", "aprobado")
    .neq("profile_id", user.id)
    .order("fecha", { ascending: false })
    .limit(50);

  const mine = (ownRows ?? []) as DonacionRow[];
  const community = (communityRows ?? []) as DonacionRow[];

  return (
    <div className="flex flex-col gap-4 pb-[90px]">
      <div className="flex items-center gap-3">
        <Link href="/profile" className="shrink-0 text-text-primary" aria-label="Volver al perfil">
          <ChevronLeft size={24} />
        </Link>
        <h1 className="font-display text-base font-medium text-text-primary flex-1">
          Donaciones del Nodo
        </h1>
        <Link
          href="/donaciones/new"
          className="inline-flex size-10 items-center justify-center rounded-full bg-primary text-on-primary"
          aria-label="Registrar donación"
        >
          <Plus size={20} />
        </Link>
      </div>

      {params.aviso === "imagen" ? (
        <p role="status" className="rounded-md bg-brand-blue/10 px-3 py-2 text-sm text-brand-blue">
          Se registró sin foto: no pudimos subir la imagen.
        </p>
      ) : null}

      {profile.is_platform_admin ? (
        <Link
          href="/admin/donaciones"
          className="rounded-[16px] border border-border bg-surface px-4 py-3 text-sm text-brand-blue"
        >
          Cola de aprobación (admin)
        </Link>
      ) : null}

      <section className="flex flex-col gap-2.5">
        <h2 className="font-display text-sm font-medium text-text-secondary">Mis donaciones</h2>
        {mine.length === 0 ? (
          <EmptyState
            icon={Gift}
            title="Todavía no registraste donaciones"
            subtitle="Cuando aportes un bien al Nodo, aparece acá en pendiente."
          />
        ) : (
          <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
            {mine.map((row) => (
              <li key={row.id}>
                <DonacionItem
                  titulo={row.titulo ?? row.descripcion ?? "Sin título"}
                  tipo={row.tipo}
                  fecha={row.fecha}
                  estado={row.estado}
                  descripcion={row.descripcion}
                  prestamoDesde={row.prestamo_desde}
                  prestamoHasta={row.prestamo_hasta}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-2.5">
        <h2 className="font-display text-sm font-medium text-text-secondary">
          Aprobadas en la comunidad
        </h2>
        {community.length === 0 ? (
          <p className="text-sm text-text-muted">Todavía no hay donaciones aprobadas de otros.</p>
        ) : (
          <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
            {community.map((row) => (
              <li key={row.id}>
                <DonacionItem
                  titulo={row.titulo ?? row.descripcion ?? "Sin título"}
                  tipo={row.tipo}
                  fecha={row.fecha}
                  estado={row.estado}
                  prestamoDesde={row.prestamo_desde}
                  prestamoHasta={row.prestamo_hasta}
                />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
