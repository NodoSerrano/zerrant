import Link from "next/link";
import { ChevronLeft, Gift } from "lucide-react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AporteItem } from "@/features/aportes/AporteItem";
import type { AporteListItem } from "@/features/aportes/types";
import { EmptyState } from "@/components/EmptyState";

export const dynamic = "force-dynamic";

export default async function MisAportesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("tier")
    .eq("id", user.id)
    .single();

  if (!profile) {
    redirect("/onboarding/step1");
  }

  if (profile.tier === "tourist") {
    redirect("/profile");
  }

  const { data: rows } = await supabase
    .from("aportes")
    .select("id, tipo, descripcion, monto, fecha")
    .eq("profile_id", user.id)
    .order("fecha", { ascending: false });

  const aportes = (rows ?? []) as AporteListItem[];
  const total = aportes.length;

  return (
    <div className="flex flex-col gap-4 pb-[90px]">
      <div className="flex items-center gap-3">
        <Link href="/profile" className="shrink-0 text-text-primary" aria-label="Volver al perfil">
          <ChevronLeft size={24} />
        </Link>
        <h1 className="font-display text-base font-medium text-text-primary">Mis aportes</h1>
      </div>

      {total === 0 ? (
        <EmptyState
          icon={Gift}
          title="No hay aportes"
          subtitle="Cuando registres un aporte, va a aparecer acá."
        />
      ) : (
        <>
          <div className="rounded-[20px] bg-surface-inset p-4 flex gap-3">
            <div className="flex flex-col gap-0.5 flex-1 min-w-0">
              <span className="font-display text-2xl font-bold text-text-primary">{total}</span>
              <span className="font-body text-xs text-text-muted">aportes en total</span>
            </div>
          </div>

          <ul className="flex flex-col gap-2.5 list-none p-0 m-0">
            {aportes.map((aporte) => (
              <li key={aporte.id}>
                <AporteItem
                  tipo={aporte.tipo}
                  descripcion={aporte.descripcion}
                  fecha={aporte.fecha}
                  monto={aporte.monto}
                />
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
