// lib/supabaseClient.ts
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type LocationCategory =
  | "acopio_necesidad"
  | "acopio_lleno"
  | "via_bloqueada"
  | "peligro_estructural";

export type SuppliesStatus = {
  agua?: "critico" | "suficiente" | "no_necesario";
  cobijas?: "critico" | "suficiente" | "no_necesario";
  medicamentos?: "critico" | "suficiente" | "no_necesario";
  alimentos?: "critico" | "suficiente" | "no_necesario";
};

export type Location = {
  id: string;
  title: string;
  category: LocationCategory;
  description: string | null;
  latitude: number;
  longitude: number;
  supplies_status: SuppliesStatus | null;
  upvotes: number;
  created_at?: string;
  updated_at: string;
  expires_at: string;
};

export type LocationInsert = Omit<
  Location,
  "id" | "created_at" | "updated_at" | "upvotes" | "expires_at"
> & {
  upvotes?: number;
  expires_at?: string;
};

export const CATEGORY_LABELS: Record<LocationCategory, string> = {
  acopio_necesidad: "Acopio con necesidades",
  acopio_lleno: "Acopio lleno",
  via_bloqueada: "Vía bloqueada",
  peligro_estructural: "Peligro estructural",
};

export const CATEGORY_COLORS: Record<LocationCategory, string> = {
  acopio_necesidad: "yellow",
  acopio_lleno: "green",
  via_bloqueada: "red",
  peligro_estructural: "red",
};

export const SUPPLY_LABELS = {
  agua: "Agua",
  cobijas: "Cobijas",
  medicamentos: "Medicamentos",
  alimentos: "Alimentos",
} as const;

export const SUPPLY_STATUS_LABELS = {
  critico: "🔴 Crítico",
  suficiente: "🟡 Suficiente",
  no_necesario: "⚪ No requerido",
} as const;
