export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      profiles: {
        Row: {
          apellido: string | null;
          apodo: string | null;
          aprobado_en: string | null;
          avatar_url: string | null;
          bio: string | null;
          contacto_telegram: string | null;
          created_at: string;
          disponibilidad: Database["public"]["Enums"]["disponibilidad"] | null;
          email: string | null;
          fecha_nacimiento: string | null;
          id: string;
          is_platform_admin: boolean;
          nombre: string | null;
          nombre_visible: Database["public"]["Enums"]["nombre_visible"];
          onboarding_completado_en: string | null;
          sitio_url: string | null;
          tarifa_hora: number | null;
          tier: Database["public"]["Enums"]["tier"];
          visibilidad_tarifa: Database["public"]["Enums"]["visibilidad_tarifa"];
        };
        Insert: {
          apellido?: string | null;
          apodo?: string | null;
          aprobado_en?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          contacto_telegram?: string | null;
          created_at?: string;
          disponibilidad?: Database["public"]["Enums"]["disponibilidad"] | null;
          email?: string | null;
          fecha_nacimiento?: string | null;
          id: string;
          is_platform_admin?: boolean;
          nombre?: string | null;
          nombre_visible?: Database["public"]["Enums"]["nombre_visible"];
          onboarding_completado_en?: string | null;
          sitio_url?: string | null;
          tarifa_hora?: number | null;
          tier?: Database["public"]["Enums"]["tier"];
          visibilidad_tarifa?: Database["public"]["Enums"]["visibilidad_tarifa"];
        };
        Update: {
          apellido?: string | null;
          apodo?: string | null;
          aprobado_en?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          contacto_telegram?: string | null;
          created_at?: string;
          disponibilidad?: Database["public"]["Enums"]["disponibilidad"] | null;
          email?: string | null;
          fecha_nacimiento?: string | null;
          id?: string;
          is_platform_admin?: boolean;
          nombre?: string | null;
          nombre_visible?: Database["public"]["Enums"]["nombre_visible"];
          onboarding_completado_en?: string | null;
          sitio_url?: string | null;
          tarifa_hora?: number | null;
          tier?: Database["public"]["Enums"]["tier"];
          visibilidad_tarifa?: Database["public"]["Enums"]["visibilidad_tarifa"];
        };
        Relationships: [];
      };
      tasks: {
        Row: {
          categoria: Database["public"]["Enums"]["task_categoria"];
          creado_por: string;
          created_at: string;
          descripcion: string | null;
          estado: Database["public"]["Enums"]["task_estado"];
          id: string;
          titulo: string;
          tomada_por: string | null;
          urgencia: Database["public"]["Enums"]["task_urgencia"];
        };
        Insert: {
          categoria?: Database["public"]["Enums"]["task_categoria"];
          creado_por: string;
          created_at?: string;
          descripcion?: string | null;
          estado?: Database["public"]["Enums"]["task_estado"];
          id?: string;
          titulo: string;
          tomada_por?: string | null;
          urgencia?: Database["public"]["Enums"]["task_urgencia"];
        };
        Update: {
          categoria?: Database["public"]["Enums"]["task_categoria"];
          creado_por?: string;
          created_at?: string;
          descripcion?: string | null;
          estado?: Database["public"]["Enums"]["task_estado"];
          id?: string;
          titulo?: string;
          tomada_por?: string | null;
          urgencia?: Database["public"]["Enums"]["task_urgencia"];
        };
        Relationships: [
          {
            foreignKeyName: "tasks_creado_por_fkey";
            columns: ["creado_por"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tasks_tomada_por_fkey";
            columns: ["tomada_por"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      disponibilidad: "disponible" | "ocupado" | "solo_eventos";
      nombre_visible: "apodo" | "nombre_apellido" | "apellido_nombre";
      task_categoria: "reparacion" | "limpieza" | "compra" | "mantenimiento" | "otro";
      task_estado: "abierta" | "tomada" | "hecha" | "verificada";
      task_urgencia: "baja" | "media" | "alta";
      tier: "tourist" | "scholar" | "standard" | "founder";
      visibilidad_tarifa: "publica" | "privada";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      disponibilidad: ["disponible", "ocupado", "solo_eventos"],
      nombre_visible: ["apodo", "nombre_apellido", "apellido_nombre"],
      task_categoria: ["reparacion", "limpieza", "compra", "mantenimiento", "otro"],
      task_estado: ["abierta", "tomada", "hecha", "verificada"],
      task_urgencia: ["baja", "media", "alta"],
      tier: ["tourist", "scholar", "standard", "founder"],
      visibilidad_tarifa: ["publica", "privada"],
    },
  },
} as const;
