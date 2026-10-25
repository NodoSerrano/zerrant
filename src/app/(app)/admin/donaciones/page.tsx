import Link from "next/link";
import { ChevronLeft, Gift } from "lucide-react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/EmptyState";
import { DonacionItem } from "@/features/donaciones/DonacionItem";
import { AdminDonacionActions } from "@/features/donaciones/AdminDonacionActions";
import type { AporteEstado } from "@/lib/db/donaciones-schema";
import { displayName } from "@/features/profile/displayName";

export const dynamic = "force-dynamic";

type PendingRow = {
  id: string;
  titulo: string | null;
  tipo: string;
  descripcion: string | null;
  fecha: string;
  estado: AporteEstado | null;
  prestamo_desde: string | null;
  prestamo_hasta: string | null;
  profile_id: string;
  profiles:
    | {
        nombre: string | null;
        apellido: string | null;
        apodo: string | null;
        nombre_visible: "apodo" | "nombre_apellido" | "apellido_nombre" | null;
      }
    | {
        nombre: string | null;
        apellido: string | null;
        apodo: string | null;
        nombre_visible: "apodo" | "nombre_apellido" | "apellido_nombre" | null;
      }[]
    | null;
};

function profileOf(row: PendingRow) {
  if (!row.profiles) return null;
  return Array.isArray(row.profiles) ? (row.profiles[0] ?? null) : row.profiles;
}

export default async function AdminDonacionesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_platform_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_platform_admin) {
    redirect("/profile");
  }

  const { data: rows } = await supabase
    .from("aportes")
    .select(
      "id, titulo, tipo, descripcion, fecha, estado, prestamo_desde, prestamo_hasta, profile_id, profiles!aportes_profile_id_fkey(nombre, apellido, apodo, nombre_visible)",
    )
    .eq("estado", "pendiente")
    .order("fecha", { ascending: true });

  const pending = (rows ?? []) as PendingRow[];

  return (
    <div className="flex flex-col gap-4 pb-[90px]">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/membresias"
          className="shrink-0 text-text-primary"
          aria-label="Volver al panel"
        >
          <ChevronLeft size={24} />
        </Link>
        <h1 className="font-display text-base font-medium text-text-primary">
          Donaciones pendientes
        </h1>
      </div>

      {pending.length === 0 ? (
        <EmptyState
          icon={Gift}
          title="No hay pendientes"
          subtitle="Cuando un miembro registre una donación, aparece acá."
        />
      ) : (
        <ul className="m-0 flex list-none flex-col gap-3 p-0">
          {pending.map((row) => {
            const owner = profileOf(row);
            const ownerName = owner
              ? displayName({
                  ...owner,
                  nombre_visible: owner.nombre_visible ?? "nombre_apellido",
                })
              : "Miembro";
            return (
              <li
                key={row.id}
                className="flex flex-col gap-3 rounded-[20px] border border-border bg-surface p-3.5"
              >
                <DonacionItem
                  titulo={row.titulo ?? row.descripcion ?? "Sin título"}
                  tipo={row.tipo}
                  fecha={row.fecha}
                  estado={row.estado}
                  descripcion={row.descripcion}
                  prestamoDesde={row.prestamo_desde}
                  prestamoHasta={row.prestamo_hasta}
                  className="border-0 p-0"
                />
                <p className="text-xs text-text-muted">De: {ownerName || "Miembro"}</p>
                {row.profile_id === user.id ? (
                  <p className="text-sm text-text-muted">
                    No podés aprobar tu propia donación (pedile a otro admin).
                  </p>
                ) : (
                  <AdminDonacionActions aporteId={row.id} />
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
