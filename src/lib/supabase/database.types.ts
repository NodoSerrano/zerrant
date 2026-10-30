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
        Returns: {
          success?: boolean;
          estado?: Database["public"]["Enums"]["membership_request_estado"];
          error?: string;
          code?:
            | "forbidden"
            | "not_found"
            | "invalid_transition"
            | "unsupported_tier"
            | "invalid_motivo"
            | "conflict";
        };
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
          aprobado_en: string | null;
          aprobado_por: string | null;
          created_at: string;
          descripcion: string | null;
          estado: Database["public"]["Enums"]["aporte_estado"] | null;
          fecha: string;
          id: string;
          imagen_path: string | null;
          monto: number | null;
          notas_admin: string | null;
          prestamo_desde: string | null;
          prestamo_hasta: string | null;
          profile_id: string;
          registrado_por: string;
          tipo: Database["public"]["Enums"]["aporte_tipo"];
          titulo: string | null;
        };
        Insert: {
          aprobado_en?: string | null;
          aprobado_por?: string | null;
          created_at?: string;
          descripcion?: string | null;
          estado?: Database["public"]["Enums"]["aporte_estado"] | null;
          fecha: string;
          id?: string;
          imagen_path?: string | null;
          monto?: number | null;
          notas_admin?: string | null;
          prestamo_desde?: string | null;
          prestamo_hasta?: string | null;
          profile_id: string;
          registrado_por: string;
          tipo: Database["public"]["Enums"]["aporte_tipo"];
          titulo?: string | null;
        };
        Update: {
          aprobado_en?: string | null;
          aprobado_por?: string | null;
          created_at?: string;
          descripcion?: string | null;
          estado?: Database["public"]["Enums"]["aporte_estado"] | null;
          fecha?: string;
          id?: string;
          imagen_path?: string | null;
          monto?: number | null;
          notas_admin?: string | null;
          prestamo_desde?: string | null;
          prestamo_hasta?: string | null;
          profile_id?: string;
          registrado_por?: string;
          tipo?: Database["public"]["Enums"]["aporte_tipo"];
          titulo?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "aportes_aprobado_por_fkey";
            columns: ["aprobado_por"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "aportes_aprobado_por_fkey";
            columns: ["aprobado_por"];
            isOneToOne: false;
            referencedRelation: "profiles_with_rate";
            referencedColumns: ["id"];
          },
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
          cover_url: string | null;
          fin: string | null;
          id: string;
          inicio: string;
          lugar: string | null;
          titulo: string;
        };
        Insert: {
          creado_por: string;
          cover_url?: string | null;
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
          cover_url?: string | null;
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
      interview_bookings: {
        Row: {
          created_at: string;
          id: string;
          profile_id: string;
          request_id: string;
          slot_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          profile_id: string;
          request_id: string;
          slot_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          profile_id?: string;
          request_id?: string;
          slot_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "interview_bookings_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "interview_bookings_request_id_fkey";
            columns: ["request_id"];
            isOneToOne: true;
            referencedRelation: "membership_requests";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "interview_bookings_slot_id_fkey";
            columns: ["slot_id"];
            isOneToOne: true;
            referencedRelation: "interview_slots";
            referencedColumns: ["id"];
          },
        ];
      };
      interview_slots: {
        Row: {
          created_at: string;
          ends_at: string;
          id: string;
          interviewer_id: string;
          starts_at: string;
        };
        Insert: {
          created_at?: string;
          ends_at: string;
          id?: string;
          interviewer_id: string;
          starts_at: string;
        };
        Update: {
          created_at?: string;
          ends_at?: string;
          id?: string;
          interviewer_id?: string;
          starts_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "interview_slots_interviewer_id_fkey";
            columns: ["interviewer_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      interview_notes: {
        Row: {
          author_id: string;
          body: string;
          created_at: string;
          id: string;
          request_id: string;
          updated_at: string;
        };
        Insert: {
          author_id: string;
          body: string;
          created_at?: string;
          id?: string;
          request_id: string;
          updated_at?: string;
        };
        Update: {
          author_id?: string;
          body?: string;
          created_at?: string;
          id?: string;
          request_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "interview_notes_author_id_fkey";
            columns: ["author_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "interview_notes_author_id_fkey";
            columns: ["author_id"];
            isOneToOne: false;
            referencedRelation: "profiles_with_rate";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "interview_notes_request_id_fkey";
            columns: ["request_id"];
            isOneToOne: false;
            referencedRelation: "membership_requests";
            referencedColumns: ["id"];
          },
        ];
      };
      membership_request_events: {
        Row: {
          actor_id: string | null;
          created_at: string;
          from_estado: Database["public"]["Enums"]["membership_request_estado"] | null;
          id: string;
          motivo: string | null;
          request_id: string;
          to_estado: Database["public"]["Enums"]["membership_request_estado"];
        };
        Insert: {
          actor_id?: string | null;
          created_at?: string;
          from_estado?: Database["public"]["Enums"]["membership_request_estado"] | null;
          id?: string;
          motivo?: string | null;
          request_id: string;
          to_estado: Database["public"]["Enums"]["membership_request_estado"];
        };
        Update: {
          actor_id?: string | null;
          created_at?: string;
          from_estado?: Database["public"]["Enums"]["membership_request_estado"] | null;
          id?: string;
          motivo?: string | null;
          request_id?: string;
          to_estado?: Database["public"]["Enums"]["membership_request_estado"];
        };
        Relationships: [
          {
            foreignKeyName: "membership_request_events_actor_id_fkey";
            columns: ["actor_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "membership_request_events_actor_id_fkey";
            columns: ["actor_id"];
            isOneToOne: false;
            referencedRelation: "profiles_with_rate";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "membership_request_events_request_id_fkey";
            columns: ["request_id"];
            isOneToOne: false;
            referencedRelation: "membership_requests";
            referencedColumns: ["id"];
          },
        ];
      };
      membership_request_transitions: {
        Row: {
          actor: string;
          from_estado: Database["public"]["Enums"]["membership_request_estado"];
          to_estado: Database["public"]["Enums"]["membership_request_estado"];
        };
        Insert: {
          actor: string;
          from_estado: Database["public"]["Enums"]["membership_request_estado"];
          to_estado: Database["public"]["Enums"]["membership_request_estado"];
        };
        Update: {
          actor?: string;
          from_estado?: Database["public"]["Enums"]["membership_request_estado"];
          to_estado?: Database["public"]["Enums"]["membership_request_estado"];
        };
        Relationships: [];
      };
      membership_requests: {
        Row: {
          aprobado_en: string | null;
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
          aprobado_en?: string | null;
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
          aprobado_en?: string | null;
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
          anios_empresa: number | null;
          anios_freelance: number | null;
          created_at: string;
          id: string;
          nivel: Database["public"]["Enums"]["skill_nivel"] | null;
          profile_id: string;
          skill_id: string;
        };
        Insert: {
          anios_empresa?: number | null;
          anios_freelance?: number | null;
          created_at?: string;
          id?: string;
          nivel?: Database["public"]["Enums"]["skill_nivel"] | null;
          profile_id: string;
          skill_id: string;
        };
        Update: {
          anios_empresa?: number | null;
          anios_freelance?: number | null;
          created_at?: string;
          id?: string;
          nivel?: Database["public"]["Enums"]["skill_nivel"] | null;
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
          created_at: string;
          estado: Database["public"]["Enums"]["project_member_estado"];
          profile_id: string;
          project_id: string;
          rol: Database["public"]["Enums"]["project_member_rol"];
        };
        Insert: {
          created_at?: string;
          estado?: Database["public"]["Enums"]["project_member_estado"];
          profile_id: string;
          project_id: string;
          rol?: Database["public"]["Enums"]["project_member_rol"];
        };
        Update: {
          created_at?: string;
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
          archivado_en: string | null;
          creado_por: string;
          created_at: string;
          descripcion: string | null;
          estado: Database["public"]["Enums"]["project_estado"];
          id: string;
          ingreso: Database["public"]["Enums"]["project_ingreso"];
          nombre: string;
        };
        Insert: {
          archivado_en?: string | null;
          creado_por: string;
          created_at?: string;
          descripcion?: string | null;
          estado?: Database["public"]["Enums"]["project_estado"];
          id?: string;
          ingreso?: Database["public"]["Enums"]["project_ingreso"];
          nombre: string;
        };
        Update: {
          archivado_en?: string | null;
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
          estado: Database["public"]["Enums"]["skill_estado"];
          id: string;
          nombre: string;
          propuesta_por: string | null;
        };
        Insert: {
          created_at?: string;
          estado?: Database["public"]["Enums"]["skill_estado"];
          id?: string;
          nombre: string;
          propuesta_por?: string | null;
        };
        Update: {
          created_at?: string;
          estado?: Database["public"]["Enums"]["skill_estado"];
          id?: string;
          nombre?: string;
          propuesta_por?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "skills_propuesta_por_fkey";
            columns: ["propuesta_por"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      tasks: {
        Row: {
          categoria_otra: string | null;
          categorias: Database["public"]["Enums"]["task_categoria"][];
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
          categoria_otra?: string | null;
          categorias?: Database["public"]["Enums"]["task_categoria"][];
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
          categoria_otra?: string | null;
          categorias?: Database["public"]["Enums"]["task_categoria"][];
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
      interview_slot_availability: {
        Row: {
          booked: boolean | null;
          ends_at: string | null;
          id: string | null;
          interviewer_id: string | null;
          starts_at: string | null;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
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
      approve_aporte_donacion: {
        Args: { p_aporte_id: string; p_notas?: string | null };
        Returns: Json;
      };
      reject_aporte_donacion: {
        Args: { p_aporte_id: string; p_notas?: string | null };
        Returns: Json;
      };
      book_interview_slot: {
        Args: { p_slot_id: string };
        Returns: {
          success?: boolean;
          id?: string;
          request_id?: string;
          error?: string;
          code?: "forbidden" | "not_found" | "invalid_slot" | "invalid_transition" | "conflict";
        };
      };
      create_interview_slot: {
        Args: { p_minutes?: number; p_starts_at: string };
        Returns: {
          success?: boolean;
          id?: string;
          error?: string;
          code?: "forbidden" | "invalid_slot" | "conflict";
        };
      };
      is_non_tourist: { Args: never; Returns: boolean };
      is_platform_admin: { Args: never; Returns: boolean };
      is_project_admin: { Args: { p_project_id: string }; Returns: boolean };
      propose_skill: {
        Args: { p_nombre: string };
        Returns: {
          id?: string;
          nombre?: string;
          estado?: Database["public"]["Enums"]["skill_estado"];
          existing?: boolean;
          error?: string;
          code?: string;
        };
      };
      review_skill: {
        Args: { p_skill_id: string; p_aprobar: boolean };
        Returns: { success?: boolean; estado?: string; error?: string; code?: string };
      };
      save_profile_skills: {
        Args: { p_items: Json };
        Returns: { success?: boolean; error?: string; code?: string };
      };
      transition_membership_request: {
        Args: {
          p_motivo?: string;
          p_request_id: string;
          p_to: Database["public"]["Enums"]["membership_request_estado"];
        };
        Returns: {
          success?: boolean;
          estado?: Database["public"]["Enums"]["membership_request_estado"];
          error?: string;
          code?:
            | "forbidden"
            | "not_found"
            | "invalid_transition"
            | "unsupported_tier"
            | "invalid_motivo"
            | "conflict";
        };
      };
      upsert_interview_note: {
        Args: {
          p_body: string;
          p_note_id?: string;
          p_request_id?: string;
        };
        Returns: {
          author_id: string;
          body: string;
          created_at: string;
          id: string;
          request_id: string;
          updated_at: string;
        };
      };
    };
    Enums: {
      aporte_estado: "pendiente" | "aprobado" | "rechazado";
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
      membership_request_estado:
        | "pendiente_coordinacion"
        | "entrevista_solicitada"
        | "entrevista_coordinada"
        | "reprogramacion"
        | "entrevista_realizada"
        | "aprobado"
        | "cerrada";
      membership_situacion_actual: "estudio" | "trabajo" | "estudio_trabajo" | "ninguno" | "otra";
      nombre_visible: "apodo" | "nombre_apellido" | "apellido_nombre";
      project_estado: "idea" | "en_curso" | "pausado" | "terminado";
      project_ingreso: "abierto" | "aprobacion" | "cerrado";
      project_member_estado: "pendiente" | "aprobado";
      project_member_rol: "miembro" | "admin";
      skill_estado: "aprobada" | "pendiente";
      skill_nivel: "basico" | "intermedio" | "avanzado";
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
      aporte_estado: ["pendiente", "aprobado", "rechazado"],
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
      membership_request_estado: [
        "pendiente_coordinacion",
        "entrevista_solicitada",
        "entrevista_coordinada",
        "reprogramacion",
        "entrevista_realizada",
        "aprobado",
        "cerrada",
      ],
      membership_situacion_actual: ["estudio", "trabajo", "estudio_trabajo", "ninguno", "otra"],
      nombre_visible: ["apodo", "nombre_apellido", "apellido_nombre"],
      project_estado: ["idea", "en_curso", "pausado", "terminado"],
      project_ingreso: ["abierto", "aprobacion", "cerrado"],
      project_member_estado: ["pendiente", "aprobado"],
      project_member_rol: ["miembro", "admin"],
      skill_estado: ["aprobada", "pendiente"],
      skill_nivel: ["basico", "intermedio", "avanzado"],
      task_categoria: ["reparacion", "limpieza", "compra", "mantenimiento", "otro"],
      task_estado: ["abierta", "tomada", "hecha", "verificada", "cancelada"],
      task_urgencia: ["baja", "media", "alta"],
      tier: ["tourist", "scholar", "standard", "founder"],
      visibilidad_tarifa: ["publica", "privada"],
    },
  },
} as const;
