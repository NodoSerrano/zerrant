export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      aportes: {
        Row: {
          created_at: string;
          descripcion: string | null;
          fecha: string;
          id: string;
          monto: number | null;
          profile_id: string;
          registrado_por: string;
          tipo: Database["public"]["Enums"]["aporte_tipo"];
        };
        Insert: {
          created_at?: string;
          descripcion?: string | null;
          fecha: string;
          id?: string;
          monto?: number | null;
          profile_id: string;
          registrado_por: string;
          tipo: Database["public"]["Enums"]["aporte_tipo"];
        };
        Update: {
          created_at?: string;
          descripcion?: string | null;
          fecha?: string;
          id?: string;
          monto?: number | null;
          profile_id?: string;
          registrado_por?: string;
          tipo?: Database["public"]["Enums"]["aporte_tipo"];
        };
        Relationships: [
          {
            foreignKeyName: "aportes_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "aportes_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles_with_rate";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "aportes_registrado_por_fkey";
            columns: ["registrado_por"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "aportes_registrado_por_fkey";
            columns: ["registrado_por"];
            isOneToOne: false;
            referencedRelation: "profiles_with_rate";
            referencedColumns: ["id"];
          },
        ];
      };
      event_attendance: {
        Row: {
          estado: Database["public"]["Enums"]["event_attendance_estado"];
          event_id: string;
          profile_id: string;
        };
        Insert: {
          estado: Database["public"]["Enums"]["event_attendance_estado"];
          event_id: string;
          profile_id: string;
        };
        Update: {
          estado?: Database["public"]["Enums"]["event_attendance_estado"];
          event_id?: string;
          profile_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "event_attendance_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "event_attendance_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "event_attendance_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles_with_rate";
            referencedColumns: ["id"];
          },
        ];
      };
      events: {
        Row: {
          creado_por: string;
          created_at: string;
          descripcion: string | null;
          fin: string | null;
          id: string;
          inicio: string;
          lugar: string | null;
          titulo: string;
        };
        Insert: {
          creado_por: string;
          created_at?: string;
          descripcion?: string | null;
          fin?: string | null;
          id?: string;
          inicio: string;
          lugar?: string | null;
          titulo: string;
        };
        Update: {
          creado_por?: string;
          created_at?: string;
          descripcion?: string | null;
          fin?: string | null;
          id?: string;
          inicio?: string;
          lugar?: string | null;
          titulo?: string;
        };
        Relationships: [
          {
            foreignKeyName: "events_creado_por_fkey";
            columns: ["creado_por"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "events_creado_por_fkey";
            columns: ["creado_por"];
            isOneToOne: false;
            referencedRelation: "profiles_with_rate";
            referencedColumns: ["id"];
          },
        ];
      };
      membership_requests: {
        Row: {
          actualizado_en: string;
          aporte_actitud: Database["public"]["Enums"]["membership_aporte_actitud"] | null;
          aporte_mayor: Database["public"]["Enums"]["membership_aporte_mayor"] | null;
          aporte_otro: string | null;
          contacto_whatsapp: string | null;
          created_at: string;
          duracion_visita: Database["public"]["Enums"]["membership_duracion_visita"] | null;
          entrevista_items: string | null;
          estado: Database["public"]["Enums"]["membership_request_estado"];
          frecuencia_uso: Database["public"]["Enums"]["membership_frecuencia_uso"] | null;
          id: string;
          mensaje: string | null;
          ocupacion_detalle: string | null;
          profile_id: string;
          reunion_disponibilidad: string | null;
          revisado_por: string | null;
          situacion_actual: Database["public"]["Enums"]["membership_situacion_actual"] | null;
          tier_solicitado: Database["public"]["Enums"]["tier"];
        };
        Insert: {
          actualizado_en?: string;
          aporte_actitud?: Database["public"]["Enums"]["membership_aporte_actitud"] | null;
          aporte_mayor?: Database["public"]["Enums"]["membership_aporte_mayor"] | null;
          aporte_otro?: string | null;
          contacto_whatsapp?: string | null;
          created_at?: string;
          duracion_visita?: Database["public"]["Enums"]["membership_duracion_visita"] | null;
          entrevista_items?: string | null;
          estado?: Database["public"]["Enums"]["membership_request_estado"];
          frecuencia_uso?: Database["public"]["Enums"]["membership_frecuencia_uso"] | null;
          id?: string;
          mensaje?: string | null;
          ocupacion_detalle?: string | null;
          profile_id: string;
          reunion_disponibilidad?: string | null;
          revisado_por?: string | null;
          situacion_actual?: Database["public"]["Enums"]["membership_situacion_actual"] | null;
          tier_solicitado?: Database["public"]["Enums"]["tier"];
        };
        Update: {
          actualizado_en?: string;
          aporte_actitud?: Database["public"]["Enums"]["membership_aporte_actitud"] | null;
          aporte_mayor?: Database["public"]["Enums"]["membership_aporte_mayor"] | null;
          aporte_otro?: string | null;
          contacto_whatsapp?: string | null;
          created_at?: string;
          duracion_visita?: Database["public"]["Enums"]["membership_duracion_visita"] | null;
          entrevista_items?: string | null;
          estado?: Database["public"]["Enums"]["membership_request_estado"];
          frecuencia_uso?: Database["public"]["Enums"]["membership_frecuencia_uso"] | null;
          id?: string;
          mensaje?: string | null;
          ocupacion_detalle?: string | null;
          profile_id?: string;
          reunion_disponibilidad?: string | null;
          revisado_por?: string | null;
          situacion_actual?: Database["public"]["Enums"]["membership_situacion_actual"] | null;
          tier_solicitado?: Database["public"]["Enums"]["tier"];
        };
        Relationships: [
          {
            foreignKeyName: "membership_requests_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "membership_requests_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles_with_rate";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "membership_requests_revisado_por_fkey";
            columns: ["revisado_por"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "membership_requests_revisado_por_fkey";
            columns: ["revisado_por"];
            isOneToOne: false;
            referencedRelation: "profiles_with_rate";
            referencedColumns: ["id"];
          },
        ];
      };
      profile_roles: {
        Row: {
          confirmado: boolean;
          created_at: string;
          id: string;
          profile_id: string;
          role_id: string;
        };
        Insert: {
          confirmado?: boolean;
          created_at?: string;
          id?: string;
          profile_id: string;
          role_id: string;
        };
        Update: {
          confirmado?: boolean;
          created_at?: string;
          id?: string;
          profile_id?: string;
          role_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profile_roles_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "profile_roles_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles_with_rate";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "profile_roles_role_id_fkey";
            columns: ["role_id"];
            isOneToOne: false;
            referencedRelation: "roles";
            referencedColumns: ["id"];
          },
        ];
      };
      profile_skills: {
        Row: {
          created_at: string;
          id: string;
          profile_id: string;
          skill_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          profile_id: string;
          skill_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          profile_id?: string;
          skill_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profile_skills_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "profile_skills_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles_with_rate";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "profile_skills_skill_id_fkey";
            columns: ["skill_id"];
            isOneToOne: false;
            referencedRelation: "skills";
            referencedColumns: ["id"];
          },
        ];
      };
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
      project_members: {
        Row: {
          estado: Database["public"]["Enums"]["project_member_estado"];
          profile_id: string;
          project_id: string;
          rol: Database["public"]["Enums"]["project_member_rol"];
        };
        Insert: {
          estado?: Database["public"]["Enums"]["project_member_estado"];
          profile_id: string;
          project_id: string;
          rol?: Database["public"]["Enums"]["project_member_rol"];
        };
        Update: {
          estado?: Database["public"]["Enums"]["project_member_estado"];
          profile_id?: string;
          project_id?: string;
          rol?: Database["public"]["Enums"]["project_member_rol"];
        };
        Relationships: [
          {
            foreignKeyName: "project_members_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "project_members_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles_with_rate";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "project_members_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      projects: {
        Row: {
          creado_por: string;
          created_at: string;
          descripcion: string | null;
          estado: Database["public"]["Enums"]["project_estado"];
          id: string;
          ingreso: Database["public"]["Enums"]["project_ingreso"];
          nombre: string;
        };
        Insert: {
          creado_por: string;
          created_at?: string;
          descripcion?: string | null;
          estado?: Database["public"]["Enums"]["project_estado"];
          id?: string;
          ingreso?: Database["public"]["Enums"]["project_ingreso"];
          nombre: string;
        };
        Update: {
          creado_por?: string;
          created_at?: string;
          descripcion?: string | null;
          estado?: Database["public"]["Enums"]["project_estado"];
          id?: string;
          ingreso?: Database["public"]["Enums"]["project_ingreso"];
          nombre?: string;
        };
        Relationships: [
          {
            foreignKeyName: "projects_creado_por_fkey";
            columns: ["creado_por"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "projects_creado_por_fkey";
            columns: ["creado_por"];
            isOneToOne: false;
            referencedRelation: "profiles_with_rate";
            referencedColumns: ["id"];
          },
        ];
      };
      roles: {
        Row: {
          created_at: string;
          descripcion: string | null;
          id: string;
          nombre: string;
        };
        Insert: {
          created_at?: string;
          descripcion?: string | null;
          id?: string;
          nombre: string;
        };
        Update: {
          created_at?: string;
          descripcion?: string | null;
          id?: string;
          nombre?: string;
        };
        Relationships: [];
      };
      skills: {
        Row: {
          created_at: string;
          id: string;
          nombre: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          nombre: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          nombre?: string;
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
            foreignKeyName: "tasks_creado_por_fkey";
            columns: ["creado_por"];
            isOneToOne: false;
            referencedRelation: "profiles_with_rate";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tasks_tomada_por_fkey";
            columns: ["tomada_por"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tasks_tomada_por_fkey";
            columns: ["tomada_por"];
            isOneToOne: false;
            referencedRelation: "profiles_with_rate";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      profiles_with_rate: {
        Row: {
          apellido: string | null;
          apodo: string | null;
          aprobado_en: string | null;
          avatar_url: string | null;
          bio: string | null;
          contacto_telegram: string | null;
          created_at: string | null;
          disponibilidad: Database["public"]["Enums"]["disponibilidad"] | null;
          email: string | null;
          fecha_nacimiento: string | null;
          id: string | null;
          is_platform_admin: boolean | null;
          nombre: string | null;
          nombre_visible: Database["public"]["Enums"]["nombre_visible"] | null;
          onboarding_completado_en: string | null;
          sitio_url: string | null;
          tarifa_hora: number | null;
          tier: Database["public"]["Enums"]["tier"] | null;
          visibilidad_tarifa: Database["public"]["Enums"]["visibilidad_tarifa"] | null;
        };
        Insert: {
          apellido?: string | null;
          apodo?: string | null;
          aprobado_en?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          contacto_telegram?: string | null;
          created_at?: string | null;
          disponibilidad?: Database["public"]["Enums"]["disponibilidad"] | null;
          email?: string | null;
          fecha_nacimiento?: string | null;
          id?: string | null;
          is_platform_admin?: boolean | null;
          nombre?: string | null;
          nombre_visible?: Database["public"]["Enums"]["nombre_visible"] | null;
          onboarding_completado_en?: string | null;
          sitio_url?: string | null;
          tarifa_hora?: never;
          tier?: Database["public"]["Enums"]["tier"] | null;
          visibilidad_tarifa?: Database["public"]["Enums"]["visibilidad_tarifa"] | null;
        };
        Update: {
          apellido?: string | null;
          apodo?: string | null;
          aprobado_en?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          contacto_telegram?: string | null;
          created_at?: string | null;
          disponibilidad?: Database["public"]["Enums"]["disponibilidad"] | null;
          email?: string | null;
          fecha_nacimiento?: string | null;
          id?: string | null;
          is_platform_admin?: boolean | null;
          nombre?: string | null;
          nombre_visible?: Database["public"]["Enums"]["nombre_visible"] | null;
          onboarding_completado_en?: string | null;
          sitio_url?: string | null;
          tarifa_hora?: never;
          tier?: Database["public"]["Enums"]["tier"] | null;
          visibilidad_tarifa?: Database["public"]["Enums"]["visibilidad_tarifa"] | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      approve_membership_request: {
        Args: {
          p_request_id: string;
        };
        Returns: {
          error?: string;
          success?: boolean;
        };
      };
      is_non_tourist: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      is_platform_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      is_project_admin: {
        Args: {
          p_project_id: string;
        };
        Returns: boolean;
      };
      reject_membership_request: {
        Args: {
          p_request_id: string;
        };
        Returns: {
          error?: string;
          success?: boolean;
        };
      };
      sync_profile_skills: {
        Args: {
          p_skill_ids: string[];
        };
        Returns: {
          error?: string;
          success?: boolean;
        };
      };
    };
    Enums: {
      aporte_tipo:
        | "economico"
        | "donacion"
        | "prestamo"
        | "charla"
        | "actividad"
        | "mantenimiento"
        | "administracion"
        | "yerba"
        | "otro";
      disponibilidad: "disponible" | "ocupado" | "solo_eventos";
      event_attendance_estado: "voy" | "quizas" | "no";
      membership_aporte_actitud:
        | "comodo"
        | "esfuerzo"
        | "preferiria_menos"
        | "podria_mas"
        | "conversar_particular"
        | "no_seguro";
      membership_aporte_mayor: "si" | "probablemente" | "no" | "conversarlo";
      membership_duracion_visita: "menos_2h" | "2_4h" | "4_6h" | "mas_6h" | "depende";
      membership_frecuencia_uso:
        | "1_2_mes"
        | "1_semana"
        | "2_3_semana"
        | "4_5_semana"
        | "casi_diario"
        | "no_se";
      membership_request_estado: "pendiente" | "aprobada" | "rechazada";
      membership_situacion_actual: "estudio" | "trabajo" | "estudio_trabajo" | "ninguno" | "otra";
      nombre_visible: "apodo" | "nombre_apellido" | "apellido_nombre";
      project_estado: "idea" | "en_curso" | "pausado" | "terminado";
      project_ingreso: "abierto" | "aprobacion";
      project_member_estado: "pendiente" | "aprobado";
      project_member_rol: "miembro" | "admin";
      task_categoria: "reparacion" | "limpieza" | "compra" | "mantenimiento" | "otro";
      task_estado: "abierta" | "tomada" | "hecha" | "verificada" | "cancelada";
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      aporte_tipo: [
        "economico",
        "donacion",
        "prestamo",
        "charla",
        "actividad",
        "mantenimiento",
        "administracion",
        "yerba",
        "otro",
      ],
      disponibilidad: ["disponible", "ocupado", "solo_eventos"],
      event_attendance_estado: ["voy", "quizas", "no"],
      membership_aporte_actitud: [
        "comodo",
        "esfuerzo",
        "preferiria_menos",
        "podria_mas",
        "conversar_particular",
        "no_seguro",
      ],
      membership_aporte_mayor: ["si", "probablemente", "no", "conversarlo"],
      membership_duracion_visita: ["menos_2h", "2_4h", "4_6h", "mas_6h", "depende"],
      membership_frecuencia_uso: [
        "1_2_mes",
        "1_semana",
        "2_3_semana",
        "4_5_semana",
        "casi_diario",
        "no_se",
      ],
      membership_request_estado: ["pendiente", "aprobada", "rechazada"],
      membership_situacion_actual: ["estudio", "trabajo", "estudio_trabajo", "ninguno", "otra"],
      nombre_visible: ["apodo", "nombre_apellido", "apellido_nombre"],
      project_estado: ["idea", "en_curso", "pausado", "terminado"],
      project_ingreso: ["abierto", "aprobacion"],
      project_member_estado: ["pendiente", "aprobado"],
      project_member_rol: ["miembro", "admin"],
      task_categoria: ["reparacion", "limpieza", "compra", "mantenimiento", "otro"],
      task_estado: ["abierta", "tomada", "hecha", "verificada", "cancelada"],
      task_urgencia: ["baja", "media", "alta"],
      tier: ["tourist", "scholar", "standard", "founder"],
      visibilidad_tarifa: ["publica", "privada"],
    },
  },
} as const;
