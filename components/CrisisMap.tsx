// components/CrisisMap.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  Location,
  CATEGORY_LABELS,
  CATEGORY_COLORS,
  SUPPLY_LABELS,
  SUPPLY_STATUS_LABELS,
} from "@/lib/supabaseClient";

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

// Función para obtener el color de la categoría
function getCategoryColor(category: Location["category"]): string {
  switch (category) {
    case "via_bloqueada":
    case "peligro_estructural":
      return "red";
    case "acopio_necesidad":
      return "yellow";
    case "acopio_lleno":
      return "green";
    default:
      return "blue";
  }
}

// Crear iconos personalizados
function createCustomIcon(
  category: Location["category"],
  isUrgent: boolean = false,
) {
  const color = getCategoryColor(category);
  const size = isUrgent ? 30 : 24;

  // SVG para el marcador
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size * 1.4}" viewBox="0 0 24 34">
      <path d="M12 0C7 0 3 4 3 9c0 6 9 16 9 16s9-10 9-16c0-5-4-9-9-9z" fill="${color === "red" ? "#DC2626" : color === "yellow" ? "#F59E0B" : "#10B981"}" stroke="white" stroke-width="1.5"/>
      <circle cx="12" cy="9" r="5" fill="white" stroke="${color === "red" ? "#DC2626" : color === "yellow" ? "#F59E0B" : "#10B981"}" stroke-width="1.5"/>
      ${category === "via_bloqueada" ? '<line x1="9" y1="7" x2="15" y2="12" stroke="white" stroke-width="2"/><line x1="15" y1="7" x2="9" y2="12" stroke="white" stroke-width="2"/>' : ""}
      ${category === "peligro_estructural" ? '<text x="12" y="12" font-size="8" text-anchor="middle" fill="white" font-weight="bold">!</text>' : ""}
      ${category === "acopio_necesidad" ? '<text x="12" y="12" font-size="7" text-anchor="middle" fill="black" font-weight="bold">+</text>' : ""}
      ${category === "acopio_lleno" ? '<text x="12" y="12" font-size="7" text-anchor="middle" fill="black" font-weight="bold">✓</text>' : ""}
    </svg>
  `;

  return L.divIcon({
    html: svg,
    className: "custom-marker",
    iconSize: [size, size * 1.4],
    iconAnchor: [size / 2, size * 1.4],
    popupAnchor: [0, -size * 1.4],
  });
}

// Componente para centrar el mapa
function MapController({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, 13);
  }, [center, map]);
  return null;
}

interface CrisisMapProps {
  locations: Location[];
  onLocationClick?: (location: Location) => void;
  centerOnLocation?: Location | null;
}

export default function CrisisMap({
  locations,
  onLocationClick,
  centerOnLocation,
}: CrisisMapProps) {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(
    null,
  );
  const [mapCenter, setMapCenter] = useState<[number, number]>([
    4.5709, -74.2973,
  ]); // Bogotá, Colombia
  const [mapZoom, setMapZoom] = useState(13);
  const [locationError, setLocationError] = useState<string | null>(null);
  const mapRef = useRef<L.Map | null>(null);

  // Obtener ubicación del usuario
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError("Tu navegador no soporta geolocalización");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation([latitude, longitude]);
        setMapCenter([latitude, longitude]);
      },
      (error) => {
        console.warn("Error de geolocalización:", error);
        setLocationError(
          "No pudimos obtener tu ubicación. Mostrando Colombia.",
        );
        // Mantener Colombia como centro
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      },
    );
  }, []);

  // Centrar en ubicación seleccionada
  useEffect(() => {
    if (centerOnLocation) {
      setMapCenter([centerOnLocation.latitude, centerOnLocation.longitude]);
      setMapZoom(15);
      // Remover el centro después de un tiempo para no interferir con la interacción del usuario
      const timer = setTimeout(() => {
        setMapZoom(13);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [centerOnLocation]);

  // Determinar si un reporte es urgente (tiene suministros críticos)
  function isUrgent(location: Location): boolean {
    if (!location.supplies_status) return false;
    return Object.values(location.supplies_status).some(
      (status) => status === "critico",
    );
  }

  // Calcular tiempo restante
  function getTimeRemaining(expiresAt: string): string {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry.getTime() - now.getTime();

    if (diff <= 0) return "Expirado";

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `Expira en ${hours}h ${minutes}min`;
    }
    return `Expira en ${minutes} min`;
  }

  // Renderizar estado de suministros
  function renderSuppliesStatus(supplies: any) {
    if (!supplies) return null;

    const entries = Object.entries(supplies);
    if (entries.length === 0) return null;

    return (
      <div className="mt-2 space-y-0.5">
        <p className="text-xs font-semibold text-gray-600">Insumos:</p>
        {entries.map(([key, value]) => (
          <div key={key} className="flex items-center gap-2 text-sm">
            <span className="font-medium">
              {SUPPLY_LABELS[key as keyof typeof SUPPLY_LABELS] || key}:
            </span>
            <span>
              {SUPPLY_STATUS_LABELS[
                value as keyof typeof SUPPLY_STATUS_LABELS
              ] || value}
            </span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="relative w-full h-full min-h-[400px]">
      {locationError && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-[1000] bg-black/75 text-white px-3 py-1.5 rounded-lg text-xs">
          {locationError}
        </div>
      )}

      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        style={{ height: "100%", width: "100%", minHeight: "400px" }}
        zoomControl={false}
        ref={mapRef}
        className="rounded-lg"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapController center={mapCenter} />

        {locations.map((location) => {
          const icon = createCustomIcon(location.category, isUrgent(location));
          const isExpired = new Date(location.expires_at) <= new Date();

          if (isExpired) return null;

          return (
            <Marker
              key={location.id}
              position={[location.latitude, location.longitude]}
              icon={icon}
              eventHandlers={{
                click: () => onLocationClick?.(location),
              }}
            >
              <Popup>
                <div className="min-w-[200px] max-w-[280px] p-1">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-sm">{location.title}</h3>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100">
                      {CATEGORY_LABELS[location.category]}
                    </span>
                  </div>

                  {location.description && (
                    <p className="text-sm text-gray-600 mt-1">
                      {location.description}
                    </p>
                  )}

                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-sm">👍 {location.upvotes}</span>
                    <span className="text-xs text-gray-500">
                      {getTimeRemaining(location.expires_at)}
                    </span>
                  </div>

                  {renderSuppliesStatus(location.supplies_status)}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      <style jsx>{`
        :global(.leaflet-container) {
          border-radius: 0.5rem;
          z-index: 1;
        }
        :global(.custom-marker) {
          background: none;
          border: none;
        }
        :global(.leaflet-popup-content) {
          margin: 8px 12px;
          line-height: 1.4;
        }
        :global(.leaflet-popup-content-wrapper) {
          border-radius: 8px;
        }
      `}</style>
    </div>
  );
}
