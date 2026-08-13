// app/actions.ts
"use server";

import { supabase } from "@/lib/supabaseClient";
import { revalidatePath } from "next/cache";
import {
  LocationInsert,
  LocationCategory,
  SuppliesStatus,
} from "@/lib/supabaseClient";

// Validar coordenadas
function isValidLatitude(lat: number): boolean {
  return lat >= -90 && lat <= 90;
}

function isValidLongitude(lng: number): boolean {
  return lng >= -180 && lng <= 180;
}

// Validar categoría
function isValidCategory(category: string): category is LocationCategory {
  return [
    "acopio_necesidad",
    "acopio_lleno",
    "via_bloqueada",
    "peligro_estructural",
  ].includes(category);
}

// Validar estado de suministros
function isValidSupplyStatus(status: string): boolean {
  return ["critico", "suficiente", "no_necesario"].includes(status);
}

function isValidSuppliesStatus(status: any): status is SuppliesStatus {
  if (typeof status !== "object" || status === null) return false;

  const validKeys = ["agua", "cobijas", "medicamentos", "alimentos"];
  for (const key of Object.keys(status)) {
    if (!validKeys.includes(key)) return false;
    if (status[key] !== null && !isValidSupplyStatus(status[key])) return false;
  }
  return true;
}

export async function createLocation(formData: FormData) {
  try {
    const title = formData.get("title") as string;
    const category = formData.get("category") as string;
    const description = (formData.get("description") as string) || null;
    const latitude = parseFloat(formData.get("latitude") as string);
    const longitude = parseFloat(formData.get("longitude") as string);
    let suppliesStatus = null;

    // Solo procesar suministros si es un punto de acopio
    if (category === "acopio_necesidad" || category === "acopio_lleno") {
      const statusRaw = formData.get("supplies_status") as string;
      if (statusRaw) {
        try {
          suppliesStatus = JSON.parse(statusRaw);
        } catch {
          // Si no se puede parsear, ignorar
        }
      }
    }

    // Validaciones
    if (!title || title.trim().length < 1) {
      return { error: "El título es obligatorio" };
    }

    if (title.length > 100) {
      return { error: "El título no puede tener más de 100 caracteres" };
    }

    if (description && description.length > 500) {
      return { error: "La descripción no puede tener más de 500 caracteres" };
    }

    if (!category || !isValidCategory(category)) {
      return { error: "Categoría no válida" };
    }

    if (isNaN(latitude) || !isValidLatitude(latitude)) {
      return { error: "Latitud no válida" };
    }

    if (isNaN(longitude) || !isValidLongitude(longitude)) {
      return { error: "Longitud no válida" };
    }

    // Validar suministros si se proporcionaron
    if (suppliesStatus && !isValidSuppliesStatus(suppliesStatus)) {
      return { error: "Estado de suministros no válido" };
    }

    const locationData: LocationInsert = {
      title: title.trim(),
      category,
      description: description?.trim() || null,
      latitude,
      longitude,
      supplies_status: suppliesStatus || null,
    };

    const { data, error } = await supabase
      .from("locations")
      .insert(locationData)
      .select()
      .single();

    if (error) {
      console.error("Supabase error:", error);
      return {
        error: "No pudimos guardar tu reporte. Por favor intenta nuevamente.",
      };
    }

    revalidatePath("/");
    return { success: true, data };
  } catch (error) {
    console.error("Error en createLocation:", error);
    return {
      error: "Ocurrió un error inesperado. Por favor intenta nuevamente.",
    };
  }
}

export async function upvoteLocation(id: string) {
  try {
    // Primero obtener el valor actual
    const { data: location, error: fetchError } = await supabase
      .from("locations")
      .select("upvotes, expires_at")
      .eq("id", id)
      .single();

    if (fetchError) {
      return { error: "Reporte no encontrado" };
    }

    // Verificar que no esté expirado
    const now = new Date();
    const expiresAt = new Date(location.expires_at);
    if (expiresAt <= now) {
      return { error: "Este reporte ya expiró" };
    }

    // Incrementar upvotes
    const { data, error } = await supabase
      .from("locations")
      .update({
        upvotes: location.upvotes + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("upvotes")
      .single();

    if (error) {
      console.error("Error al confirmar:", error);
      return {
        error: "No pudimos confirmar el reporte. Por favor intenta nuevamente.",
      };
    }

    revalidatePath("/");
    return { success: true, upvotes: data.upvotes };
  } catch (error) {
    console.error("Error en upvoteLocation:", error);
    return { error: "Ocurrió un error inesperado" };
  }
}

export async function getActiveLocations() {
  try {
    const { data, error } = await supabase
      .from("locations")
      .select(
        "id, title, category, description, latitude, longitude, supplies_status, upvotes, created_at, updated_at, expires_at",
      )
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      console.error("Error al obtener ubicaciones:", error);
      return { error: "No pudimos cargar los reportes" };
    }

    return { data };
  } catch (error) {
    console.error("Error en getActiveLocations:", error);
    return { error: "Error al cargar los datos" };
  }
}

export async function getUrgentNeeds() {
  const { data, error } = await supabase
    .from("locations")
    .select(
      "id, title, category, description, latitude, longitude, supplies_status, upvotes, created_at, updated_at, expires_at",
    )
    .gt("expires_at", new Date().toISOString())
    .order("upvotes", { ascending: false })
    .limit(10);

  if (error) {
    return { error: error.message };
  }
  return { data };
}
