// components/NeedsList.tsx
"use client";

import { useState, useEffect } from "react";
import {
  Location,
  SUPPLY_LABELS,
  SUPPLY_STATUS_LABELS,
} from "@/lib/supabaseClient";
import { getUrgentNeeds } from "@/app/actions";

interface NeedsListProps {
  onLocationSelect?: (location: Location) => void;
  refreshTrigger?: number;
}

export default function NeedsList({
  onLocationSelect,
  refreshTrigger = 0,
}: NeedsListProps) {
  const [needs, setNeeds] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(true);

  const loadNeeds = async () => {
    setIsLoading(true);
    setError(null);
    const result = await getUrgentNeeds();
    if (result.error) {
      setError(result.error);
    } else if (result.data) {
      setNeeds(result.data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadNeeds();
  }, [refreshTrigger]);

  // Actualizar cada 30 segundos
  useEffect(() => {
    const interval = setInterval(loadNeeds, 30000);
    return () => clearInterval(interval);
  }, []);

  // Obtener suministros críticos
  function getCriticalSupplies(location: Location): string[] {
    if (!location.supplies_status) return [];
    return Object.entries(location.supplies_status)
      .filter(([_, status]) => status === "critico")
      .map(([key]) => key);
  }

  // Formatear tiempo
  function formatTime(time: string): string {
    const now = new Date();
    const date = new Date(time);
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000 / 60); // minutos

    if (diff < 1) return "Hace unos segundos";
    if (diff < 60) return `Hace ${diff} min`;
    if (diff < 120) return "Hace 1 hora";
    if (diff < 1440) return `Hace ${Math.floor(diff / 60)} horas`;
    return `Hace ${Math.floor(diff / 1440)} días`;
  }

  if (needs.length === 0 && !isLoading) {
    return (
      <div className="bg-white border-t border-gray-200">
        <div className="max-w-md mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-500">
              ⚠️ NECESIDADES URGENTES
            </h3>
            <span className="text-xs text-green-600">
              ✓ Sin necesidades críticas
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            No hay necesidades urgentes reportadas actualmente
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border-t border-gray-200 shadow-lg">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div
          className="px-4 py-3 flex items-center justify-between cursor-pointer"
          onClick={() => setIsOpen(!isOpen)}
        >
          <div className="flex items-center gap-2">
            <span className="text-red-500 text-lg font-bold">⚠️</span>
            <h3 className="text-sm font-bold text-gray-800">
              NECESIDADES URGENTES
            </h3>
            <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
              {needs.length}
            </span>
          </div>
          <button className="text-gray-500">{isOpen ? "▼" : "▶"}</button>
        </div>

        {/* Contenido */}
        {isOpen && (
          <div className="px-4 pb-4 space-y-3 max-h-[50vh] overflow-y-auto">
            {isLoading && needs.length === 0 ? (
              <div className="text-center py-4 text-sm text-gray-500">
                Cargando necesidades...
              </div>
            ) : error ? (
              <div className="text-center py-4 text-sm text-red-500">
                {error}
              </div>
            ) : (
              needs.map((location) => {
                const criticalSupplies = getCriticalSupplies(location);
                const allSupplies = location.supplies_status || {};

                return (
                  <div
                    key={location.id}
                    className="bg-red-50 border-l-4 border-red-500 rounded-lg p-3 hover:bg-red-100 transition-colors cursor-pointer"
                    onClick={() => onLocationSelect?.(location)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-semibold text-sm text-gray-800">
                        {location.title}
                      </h4>
                      <span className="text-xs text-gray-500 whitespace-nowrap">
                        👍 {location.upvotes}
                      </span>
                    </div>

                    {/* Suministros críticos */}
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {criticalSupplies.map((supply) => (
                        <span
                          key={supply}
                          className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1"
                        >
                          🔴{" "}
                          {SUPPLY_LABELS[
                            supply as keyof typeof SUPPLY_LABELS
                          ] || supply}
                        </span>
                      ))}
                    </div>

                    {/* Otros suministros */}
                    {Object.entries(allSupplies)
                      .filter(
                        ([_, status]) =>
                          status !== "critico" && status !== "no_necesario",
                      )
                      .map(([key, status]) => (
                        <span
                          key={key}
                          className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800"
                        >
                          🟡{" "}
                          {SUPPLY_LABELS[key as keyof typeof SUPPLY_LABELS] ||
                            key}
                        </span>
                      ))}

                    {/* Tiempo */}
                    <div className="mt-2 text-xs text-gray-500">
                      {formatTime(location.updated_at)}
                    </div>

                    {/* Ubicación aproximada */}
                    <div className="mt-1 text-xs text-gray-400 truncate">
                      📍 {location.latitude.toFixed(5)},{" "}
                      {location.longitude.toFixed(5)}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}
