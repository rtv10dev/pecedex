"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl, { type Map as MapLibreMap, type Marker } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { MAP_STYLE_URL, TROPICAL_COLORS } from "@/lib/constants";

interface LocationMapPickerProps {
  lat: number | null;
  lng: number | null;
  onPick: (coords: { lat: number; lng: number }) => void;
}

function createPinElement(): HTMLDivElement {
  const el = document.createElement("div");
  el.style.width = "22px";
  el.style.height = "22px";
  el.style.borderRadius = "9999px";
  el.style.background = `linear-gradient(135deg, ${TROPICAL_COLORS.coral}, ${TROPICAL_COLORS.clownfish})`;
  el.style.border = "3px solid #fff";
  el.style.boxShadow = "0 4px 12px rgba(255, 107, 107, 0.45)";
  return el;
}

function placeMarker(
  map: MapLibreMap,
  marker: Marker | null,
  lng: number,
  lat: number,
): Marker {
  if (!marker) {
    return new maplibregl.Marker({
      element: createPinElement(),
      anchor: "center",
    })
      .setLngLat([lng, lat])
      .addTo(map);
  }
  marker.setLngLat([lng, lat]);
  return marker;
}

export function LocationMapPicker({ lat, lng, onPick }: LocationMapPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markerRef = useRef<Marker | null>(null);
  const onPickRef = useRef(onPick);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    onPickRef.current = onPick;
  }, [onPick]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const initialLng = lng ?? -8.5;
    const initialLat = lat ?? 34.5;
    const initialZoom = lat != null && lng != null ? 11 : 2.8;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: MAP_STYLE_URL,
      center: [initialLng, initialLat],
      zoom: initialZoom,
      attributionControl: { compact: true },
    });

    map.addControl(
      new maplibregl.NavigationControl({ showCompass: false }),
      "top-right",
    );

    mapRef.current = map;

    map.on("load", () => {
      setReady(true);
      if (lat != null && lng != null) {
        markerRef.current = placeMarker(map, markerRef.current, lng, lat);
      }
    });

    map.on("click", (event) => {
      const next = {
        lat: Number(event.lngLat.lat.toFixed(6)),
        lng: Number(event.lngLat.lng.toFixed(6)),
      };

      markerRef.current = placeMarker(
        map,
        markerRef.current,
        next.lng,
        next.lat,
      );
      onPickRef.current(next);
    });

    const observer = new ResizeObserver(() => {
      map.resize();
    });
    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
      markerRef.current?.remove();
      markerRef.current = null;
      mapRef.current = null;
      map.remove();
    };
    // Mapa montado una vez al abrir el picker.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready || lat == null || lng == null) return;
    markerRef.current = placeMarker(map, markerRef.current, lng, lat);
  }, [lat, lng, ready]);

  return (
    <div className="relative overflow-hidden rounded-2xl border-2 border-tang/20">
      <div ref={containerRef} className="map-canvas h-64 w-full" />
      {!ready ? (
        <div className="absolute inset-0 flex items-center justify-center bg-foam-white/85">
          <p className="text-sm font-semibold text-deep-teal">Cargando mapa…</p>
        </div>
      ) : (
        <p className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-deep-teal/80 to-transparent px-3 pb-2.5 pt-8 text-center text-xs font-semibold text-white">
          Toca el mapa para colocar el pin
        </p>
      )}
    </div>
  );
}
