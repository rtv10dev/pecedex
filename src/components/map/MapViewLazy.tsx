"use client";

import dynamic from "next/dynamic";
import type { MapLocation } from "@/lib/sightings";

const MapView = dynamic(
  () => import("@/components/map/MapView").then((mod) => mod.MapView),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-foam-white/80">
        <p className="text-sm font-semibold text-deep-teal">Cargando mapa…</p>
      </div>
    ),
  },
);

interface MapViewLazyProps {
  locations: MapLocation[];
}

export function MapViewLazy({ locations }: MapViewLazyProps) {
  return <MapView locations={locations} />;
}
