"use client";

import { useEffect, useState, useRef } from "react";
import "leaflet/dist/leaflet.css";
import {
  Location,
  CATEGORY_LABELS,
  SUPPLY_LABELS,
  SUPPLY_STATUS_LABELS,
} from "@/lib/supabaseClient";

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
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const [isReady, setIsReady] = useState(false);

  // Cargar Leaflet y configurar iconos una sola vez
  useEffect(() => {
    const L = require("leaflet");
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
      iconUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
      shadowUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
    });
    setIsReady(true);
  }, []);

  // Inicializar el mapa una sola vez cuando el contenedor esté listo
  useEffect(() => {
    if (!isReady || !mapContainerRef.current) return;

    const L = require("leaflet");

    const map = L.map(mapContainerRef.current, {
      center: [4.5709, -74.2973],
      zoom: 13,
      zoomControl: false,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    mapInstanceRef.current = map;

    // Limpieza al desmontar
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isReady]);

  // Actualizar marcadores cuando cambien las ubicaciones
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const L = require("leaflet");

    // Limpiar marcadores anteriores
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    // Crear nuevos marcadores
    locations.forEach((location) => {
      if (new Date(location.expires_at) <= new Date()) return;

      // Obtener color y tamaño
      const color = getCategoryColor(location.category);
      const isUrgent = checkUrgent(location);
      const size = isUrgent ? 30 : 24;

      // Crear SVG del icono
      const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size * 1.4}" viewBox="0 0 24 34">
          <path d="M12 0C7 0 3 4 3 9c0 6 9 16 9 16s9-10 9-16c0-5-4-9-9-9z" fill="${color === "red" ? "#DC2626" : color === "yellow" ? "#F59E0B" : "#10B981"}" stroke="white" stroke-width="1.5"/>
          <circle cx="12" cy="9" r="5" fill="white" stroke="${color === "red" ? "#DC2626" : color === "yellow" ? "#F59E0B" : "#10B981"}" stroke-width="1.5"/>
          ${location.category === "via_bloqueada" ? '<line x1="9" y1="7" x2="15" y2="12" stroke="white" stroke-width="2"/><line x1="15" y1="7" x2="9" y2="12" stroke="white" stroke-width="2"/>' : ""}
          ${location.category === "peligro_estructural" ? '<text x="12" y="12" font-size="8" text-anchor="middle" fill="white" font-weight="bold">!</text>' : ""}
          ${location.category === "acopio_necesidad" ? '<text x="12" y="12" font-size="7" text-anchor="middle" fill="black" font-weight="bold">+</text>' : ""}
          ${location.category === "acopio_lleno" ? '<text x="12" y="12" font-size="7" text-anchor="middle" fill="black" font-weight="bold">✓</text>' : ""}
        </svg>
      `;

      const icon = L.divIcon({
        html: svg,
        className: "custom-marker",
        iconSize: [size, size * 1.4],
        iconAnchor: [size / 2, size * 1.4],
        popupAnchor: [0, -size * 1.4],
      });

      // Crear marcador
      const marker = L.marker([location.latitude, location.longitude], {
        icon,
      }).addTo(map);

      // Popup
      const popupContent = `
        <div class="min-w-[200px] max-w-[280px] p-1">
          <div class="flex items-start justify-between gap-2">
            <h3 class="font-bold text-sm">${location.title}</h3>
            <span class="text-xs px-2 py-0.5 rounded-full bg-gray-100">${CATEGORY_LABELS[location.category]}</span>
          </div>
          ${location.description ? `<p class="text-sm text-gray-600 mt-1">${location.description}</p>` : ""}
          <div class="mt-2 flex items-center gap-2">
            <span class="text-sm">👍 ${location.upvotes}</span>
            <span class="text-xs text-gray-500">${getTimeRemaining(location.expires_at)}</span>
          </div>
          ${renderSuppliesStatus(location.supplies_status)}
        </div>
      `;

      marker.bindPopup(popupContent);

      marker.on("click", () => {
        onLocationClick?.(location);
      });

      markersRef.current.push(marker);
    });
  }, [locations, onLocationClick]);

  // Centrar mapa en ubicación seleccionada
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !centerOnLocation) return;

    map.flyTo([centerOnLocation.latitude, centerOnLocation.longitude], 15);

    const timer = setTimeout(() => {
      map.flyTo([centerOnLocation.latitude, centerOnLocation.longitude], 13);
    }, 3000);

    return () => clearTimeout(timer);
  }, [centerOnLocation]);

  // Funciones auxiliares
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

  function checkUrgent(location: Location): boolean {
    if (!location.supplies_status) return false;
    return Object.values(location.supplies_status).some(
      (status) => status === "critico",
    );
  }

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

  function renderSuppliesStatus(supplies: any): string {
    if (!supplies) return "";
    const entries = Object.entries(supplies);
    if (entries.length === 0) return "";

    let html =
      '<div class="mt-2 space-y-0.5"><p class="text-xs font-semibold text-gray-600">Insumos:</p>';
    entries.forEach(([key, value]) => {
      const label = SUPPLY_LABELS[key as keyof typeof SUPPLY_LABELS] || key;
      const status =
        SUPPLY_STATUS_LABELS[value as keyof typeof SUPPLY_STATUS_LABELS] ||
        value;
      html += `<div class="flex items-center gap-2 text-sm"><span class="font-medium">${label}:</span><span>${status}</span></div>`;
    });
    html += "</div>";
    return html;
  }

  // Geolocalización
  useEffect(() => {
    if (!isReady) return;
    if (!navigator.geolocation) {
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([latitude, longitude], 13);
        }
      },
      (error) => {
        console.warn("Error de geolocalización:", error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      },
    );
  }, [isReady]);

  if (!isReady) {
    return (
      <div className="h-full min-h-[400px] bg-gray-100 flex items-center justify-center">
        <div className="text-gray-500 text-sm">Cargando mapa...</div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full min-h-[400px]">
      <div
        ref={mapContainerRef}
        className="w-full h-full min-h-[400px] rounded-lg"
      />
    </div>
  );
}
