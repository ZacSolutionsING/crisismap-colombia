// app/page.tsx
"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import CrisisMap from "@/components/CrisisMap";
import ReportForm from "@/components/ReportForm";
import NeedsList from "@/components/NeedsList";
import { getActiveLocations } from "./actions";
import { Location } from "@/lib/supabaseClient";

// Importar Leaflet dinámicamente
const DynamicCrisisMap = dynamic(() => import("@/components/CrisisMap"), {
  ssr: false,
  loading: () => (
    <div className="h-full min-h-[400px] bg-gray-100 flex items-center justify-center">
      <div className="text-gray-500 text-sm">Cargando mapa...</div>
    </div>
  ),
});

export default function Home() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isReportFormOpen, setIsReportFormOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(
    null,
  );

  const loadLocations = async () => {
    setIsLoading(true);
    setError(null);
    const result = await getActiveLocations();
    if (result.error) {
      setError(result.error);
    } else if (result.data) {
      setLocations(result.data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadLocations();
  }, [refreshTrigger]);

  // Actualizar cada 30 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshTrigger((prev) => prev + 1);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleReportCreated = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleLocationSelect = (location: Location) => {
    setSelectedLocation(location);
    // Scroll al mapa si estamos en móvil
    const mapElement = document.getElementById("map-container");
    if (mapElement) {
      mapElement.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    // Limpiar selección después de un tiempo
    setTimeout(() => setSelectedLocation(null), 4000);
  };

  return (
    <main className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold tracking-tight">🌍 CrisisMap</h1>
            <p className="text-xs text-blue-100">
              Colombia - Reporte de emergencias
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs bg-blue-500/50 px-2 py-1 rounded-full">
              {locations.length} activos
            </span>
          </div>
        </div>
      </header>

      {/* Mapa */}
      <div
        id="map-container"
        className="relative w-full"
        style={{ height: "55vh" }}
      >
        {isLoading && locations.length === 0 ? (
          <div className="w-full h-full flex items-center justify-center bg-gray-100">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent mx-auto mb-2"></div>
              <p className="text-sm text-gray-500">Cargando reportes...</p>
            </div>
          </div>
        ) : error ? (
          <div className="w-full h-full flex items-center justify-center bg-gray-100 p-4">
            <div className="text-center max-w-sm">
              <p className="text-red-500 text-sm font-medium mb-1">
                ⚠️ Error al cargar
              </p>
              <p className="text-sm text-gray-600">{error}</p>
              <button
                onClick={loadLocations}
                className="mt-3 text-blue-600 text-sm font-medium hover:underline"
              >
                Intentar de nuevo
              </button>
            </div>
          </div>
        ) : (
          <DynamicCrisisMap
            locations={locations}
            onLocationClick={handleLocationSelect}
            centerOnLocation={selectedLocation}
          />
        )}

        {/* Botón flotante de reporte */}
        <button
          onClick={() => setIsReportFormOpen(true)}
          className="absolute bottom-4 right-4 z-[1000] bg-red-600 hover:bg-red-700 text-white rounded-full p-4 shadow-lg transition-all hover:scale-105 active:scale-95 flex items-center justify-center"
          aria-label="Reportar emergencia"
          style={{
            width: "64px",
            height: "64px",
            boxShadow: "0 4px 12px rgba(220, 38, 38, 0.4)",
          }}
        >
          <svg
            className="w-8 h-8"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M12 4v16m8-8H4"
            />
          </svg>
        </button>

        <div className="absolute bottom-4 left-4 z-[1000]">
          <span className="text-[10px] text-gray-500 bg-white/80 px-2 py-1 rounded-md backdrop-blur-sm">
            {locations.length} reportes activos
          </span>
        </div>
      </div>

      {/* Necesidades urgentes */}
      <div className="flex-1">
        <NeedsList
          onLocationSelect={handleLocationSelect}
          refreshTrigger={refreshTrigger}
        />
      </div>

      {/* Formulario de reporte */}
      <ReportForm
        isOpen={isReportFormOpen}
        onClose={() => setIsReportFormOpen(false)}
        onReportCreated={handleReportCreated}
      />

      {/* Pie de página simple */}
      <footer className="text-center py-3 text-xs text-gray-400 bg-white border-t border-gray-200">
        CrisisMap Colombia v1.0 · Reportes útiles por 12 horas
      </footer>
    </main>
  );
}
