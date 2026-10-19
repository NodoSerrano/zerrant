"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function SupabaseHealthcheck() {
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");

  useEffect(() => {
    async function check() {
      try {
        const supabase = createClient();
        const { error } = await supabase.auth.getSession();
        if (error) {
          setStatus("error");
        } else {
          setStatus("ok");
        }
      } catch {
        setStatus("error");
      }
    }

    check();
  }, []);

  const classes = {
    loading: "bg-warm-yellow/20 text-on-yellow-tint",
    ok: "bg-mint-raw/20 text-on-mint-tint",
    error: "bg-coral/20 text-on-coral-tint",
  };

  const labels = {
    loading: "Verificando...",
    ok: "Conectado a Supabase",
    error: "Sin conexión a Supabase",
  };

  return (
    <span
      className={`inline-flex items-center rounded-md px-3 py-1 text-xs font-medium ${classes[status]}`}
    >
      {labels[status]}
    </span>
  );
}
