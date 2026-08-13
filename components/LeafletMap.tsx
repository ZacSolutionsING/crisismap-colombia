"use client";

import { useEffect, useRef } from "react";
import { MapContainer, MapContainerProps } from "react-leaflet";
import "leaflet/dist/leaflet.css";

interface LeafletMapProps extends MapContainerProps {
  children: React.ReactNode;
}

export default function LeafletMap({ children, ...props }: LeafletMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    // Forzar limpieza al desmontar
    return () => {
      if (mapRef.current) {
        try {
          mapRef.current.remove();
        } catch (e) {}
        mapRef.current = null;
      }
      if (containerRef.current) {
        // Eliminar cualquier hijo residual
        while (containerRef.current.firstChild) {
          containerRef.current.removeChild(containerRef.current.firstChild);
        }
      }
    };
  }, []);

  return (
    <div ref={containerRef} className="w-full h-full">
      <MapContainer
        {...props}
        whenCreated={(map) => {
          mapRef.current = map;
        }}
      >
        {children}
      </MapContainer>
    </div>
  );
}
