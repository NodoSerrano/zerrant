import type { Database } from "@/lib/supabase/database.types";

export type Task = Database["public"]["Tables"]["tasks"]["Row"];

export type TaskInsert = Database["public"]["Tables"]["tasks"]["Insert"];

export type TaskUpdate = Database["public"]["Tables"]["tasks"]["Update"];

export type TaskCategoria = Database["public"]["Enums"]["task_categoria"];

export type TaskUrgencia = Task["urgencia"];

export type TaskEstado = Task["estado"];
