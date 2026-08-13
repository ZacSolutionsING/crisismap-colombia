// components/ReportForm.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { createLocation } from "@/app/actions";
import {
  CATEGORY_LABELS,
  SUPPLY_LABELS,
  SUPPLY_STATUS_LABELS,
  LocationCategory,
} from "@/lib/supabaseClient";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Corregir iconos de Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// Componente para seleccionar ubicación en el mapa
function LocationPicker({
  onLocationSelect,
}: {
  onLocationSelect: (lat: number, lng: number) => void;
}) {
  const map = useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      onLocationSelect(lat, lng);
    },
  });
  return null;
}

interface ReportFormProps {
  isOpen: boolean;
  onClose: () => void;
  onReportCreated: () => void;
}

export default function ReportForm({
  isOpen,
  onClose,
  onReportCreated,
}: ReportFormProps) {
  const [category, setCategory] = useState<LocationCategory | "">("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [supplies, setSupplies] = useState<Record<string, string>>({
    agua: "no_necesario",
    cobijas: "no_necesario",
    medicamentos: "no_necesario",
    alimentos: "no_necesario",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLocating, setIsLocating] = useState(true);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([
    4.5709, -74.2973,
  ]);
  const formRef = useRef<HTMLFormElement>(null);

  // Obtener ubicación al abrir el formulario
  useEffect(() => {
    if (isOpen) {
      setIsLocating(true);
      setLocationError(null);

      if (!navigator.geolocation) {
        setLocationError("Tu navegador no soporta geolocalización");
        setIsLocating(false);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setLatitude(latitude);
          setLongitude(longitude);
          setMapCenter([latitude, longitude]);
          setIsLocating(false);
        },
        (error) => {
          console.warn("Error de geolocalización:", error);
          setLocationError(
            "No pudimos obtener tu ubicación. Puedes seleccionarla en el mapa.",
          );
          setIsLocating(false);
          // Mantener Colombia como centro
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000,
        },
      );
    }
  }, [isOpen]);

  // Resetear formulario al cerrar
  useEffect(() => {
    if (!isOpen) {
      setCategory("");
      setTitle("");
      setDescription("");
      setError(null);
      setSuccess(false);
      setSupplies({
        agua: "no_necesario",
        cobijas: "no_necesario",
        medicamentos: "no_necesario",
        alimentos: "no_necesario",
      });
    }
  }, [isOpen]);

  // Manejar selección de ubicación en el mapa
  const handleLocationSelect = (lat: number, lng: number) => {
    setLatitude(lat);
    setLongitude(lng);
    setMapCenter([lat, lng]);
  };

  // Manejar cambio de suministros
  const handleSupplyChange = (supply: string, status: string) => {
    setSupplies((prev) => ({ ...prev, [supply]: status }));
  };

  // Manejar envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    // Validaciones
    if (!category) {
      setError("Por favor selecciona una categoría");
      setIsSubmitting(false);
      return;
    }

    if (!title.trim()) {
      setError("Por favor ingresa un título");
      setIsSubmitting(false);
      return;
    }

    if (title.trim().length > 100) {
      setError("El título no puede tener más de 100 caracteres");
      setIsSubmitting(false);
      return;
    }

    if (description && description.length > 500) {
      setError("La descripción no puede tener más de 500 caracteres");
      setIsSubmitting(false);
      return;
    }

    if (latitude === null || longitude === null) {
      setError("Por favor selecciona una ubicación en el mapa");
      setIsSubmitting(false);
      return;
    }

    // Construir FormData
    const formData = new FormData();
    formData.append("title", title.trim());
    formData.append("category", category);
    if (description) formData.append("description", description.trim());
    formData.append("latitude", String(latitude));
    formData.append("longitude", String(longitude));

    // Añadir suministros solo si es un punto de acopio
    if (category === "acopio_necesidad" || category === "acopio_lleno") {
      const suppliesToSend: Record<string, string> = {};
      for (const [key, value] of Object.entries(supplies)) {
        if (value !== "no_necesario") {
          suppliesToSend[key] = value;
        }
      }
      formData.append("supplies_status", JSON.stringify(suppliesToSend));
    }

    const result = await createLocation(formData);

    if (result.error) {
      setError(result.error);
      setIsSubmitting(false);
      return;
    }

    setSuccess(true);
    setIsSubmitting(false);

    // Esperar un momento y cerrar
    setTimeout(() => {
      onReportCreated();
      onClose();
    }, 1500);
  };

  // Mostrar estado de suministros solo para puntos de acopio
  const showSupplies =
    category === "acopio_necesidad" || category === "acopio_lleno";

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[2000] bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-md w-full max-h-[95vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-white z-10 border-b border-gray-200 px-4 py-3 flex items-center justify-between rounded-t-xl">
          <h2 className="text-lg font-bold text-gray-900">Nuevo Reporte</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Cerrar formulario"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Contenido */}
        <form ref={formRef} onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Éxito */}
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg text-sm">
              ✅ ¡Reporte creado exitosamente!
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Categoría */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Categoría *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as LocationCategory)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
              required
            >
              <option value="">Selecciona una categoría</option>
              {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* Título */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Título *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Vía bloqueada en la calle 80"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
              maxLength={100}
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              {title.length}/100 caracteres
            </p>
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Descripción (opcional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Breve descripción de la situación..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base resize-none"
              rows={3}
              maxLength={500}
            />
            <p className="text-xs text-gray-500 mt-1">
              {description.length}/500 caracteres
            </p>
          </div>

          {/* Ubicación */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Ubicación *
            </label>

            {isLocating ? (
              <div className="flex items-center gap-2 text-sm text-gray-500 py-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
                Obteniendo tu ubicación...
              </div>
            ) : locationError ? (
              <p className="text-sm text-yellow-600 mb-2">{locationError}</p>
            ) : latitude && longitude ? (
              <p className="text-sm text-green-600 mb-2">
                ✅ Ubicación detectada: {latitude.toFixed(5)},{" "}
                {longitude.toFixed(5)}
              </p>
            ) : null}

            <div className="h-52 rounded-lg overflow-hidden border border-gray-300">
              <MapContainer
                center={mapCenter}
                zoom={14}
                style={{ height: "100%", width: "100%" }}
                zoomControl={false}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
                />
                <LocationPicker onLocationSelect={handleLocationSelect} />
                {latitude && longitude && (
                  <Marker position={[latitude, longitude]} />
                )}
              </MapContainer>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Toca el mapa para seleccionar la ubicación exacta
            </p>
          </div>

          {/* Suministros */}
          {showSupplies && (
            <div className="border-t border-gray-200 pt-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Estado de Insumos
              </label>
              <div className="space-y-2">
                {Object.entries(SUPPLY_LABELS).map(([key, label]) => (
                  <div
                    key={key}
                    className="flex items-center justify-between gap-2"
                  >
                    <span className="text-sm font-medium text-gray-700 min-w-[70px]">
                      {label}
                    </span>
                    <div className="flex gap-1">
                      {Object.entries(SUPPLY_STATUS_LABELS).map(
                        ([status, statusLabel]) => (
                          <button
                            key={status}
                            type="button"
                            onClick={() => handleSupplyChange(key, status)}
                            className={`px-2 py-1 text-xs rounded-lg transition-colors ${
                              supplies[key] === status
                                ? "bg-blue-500 text-white"
                                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            }`}
                          >
                            {statusLabel}
                          </button>
                        ),
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Botones */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              disabled={
                isSubmitting ||
                !latitude ||
                !longitude ||
                !category ||
                !title.trim()
              }
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Enviando...
                </>
              ) : (
                "Enviar Reporte"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
