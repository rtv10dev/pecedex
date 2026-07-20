"use client";

import { useEffect, useRef } from "react";
import maplibregl, {
  type Map as MapLibreMap,
  type Marker,
} from "maplibre-gl";
import type { MapLocation } from "@/lib/sightings";
import { createFishPinElement } from "@/components/map/fishPin";

const SOURCE_ID = "pecedex-locations";

interface SingleFishMarkersProps {
  map: MapLibreMap | null;
  locations: MapLocation[];
  /** Ocultar mientras hay spiderfy activo en otra ubicación. */
  hiddenLocationId?: string | null;
  onSelectSighting: (sightingId: string) => void;
}

function isMapAlive(map: MapLibreMap): boolean {
  try {
    return Boolean(map.getStyle());
  } catch {
    return false;
  }
}

export function SingleFishMarkers({
  map,
  locations,
  hiddenLocationId = null,
  onSelectSighting,
}: SingleFishMarkersProps) {
  const markersRef = useRef<Map<string, Marker>>(new Map());
  const onSelectRef = useRef(onSelectSighting);
  const locationsRef = useRef(locations);
  const hiddenRef = useRef(hiddenLocationId);

  useEffect(() => {
    onSelectRef.current = onSelectSighting;
  });

  useEffect(() => {
    locationsRef.current = locations;
  }, [locations]);

  useEffect(() => {
    hiddenRef.current = hiddenLocationId;
  }, [hiddenLocationId]);

  useEffect(() => {
    if (!map) return;

    const singles = () =>
      locationsRef.current.filter(
        (location) =>
          location.count === 1 &&
          location.sightings[0] &&
          location.id !== hiddenRef.current,
      );

    const clearAll = () => {
      for (const marker of markersRef.current.values()) {
        marker.remove();
      }
      markersRef.current.clear();
    };

    const sync = () => {
      if (!isMapAlive(map) || !map.getSource(SOURCE_ID)) return;

      const unclustered = map.querySourceFeatures(SOURCE_ID, {
        filter: ["!", ["has", "point_count"]],
      });
      const visibleIds = new Set(
        unclustered
          .map((feature) => feature.properties?.id)
          .filter((id): id is string => typeof id === "string"),
      );

      const wanted = singles().filter((location) => visibleIds.has(location.id));
      const wantedIds = new Set(wanted.map((location) => location.id));

      for (const [id, marker] of markersRef.current) {
        if (!wantedIds.has(id)) {
          marker.remove();
          markersRef.current.delete(id);
        }
      }

      for (const location of wanted) {
        const sighting = location.sightings[0];
        if (!sighting) continue;

        const existing = markersRef.current.get(location.id);
        if (existing) {
          existing.setLngLat([location.lng, location.lat]);
          continue;
        }

        const element = createFishPinElement({
          name: sighting.commonName,
          photoUrl: sighting.photoThumbUrl,
          withLabel: true,
          className: "fish-pin-solo",
          onClick: () => onSelectRef.current(sighting.id),
        });

        const marker = new maplibregl.Marker({
          element,
          anchor: "center",
        })
          .setLngLat([location.lng, location.lat])
          .addTo(map);

        markersRef.current.set(location.id, marker);
      }
    };

    sync();
    map.on("moveend", sync);
    map.on("idle", sync);

    return () => {
      map.off("moveend", sync);
      map.off("idle", sync);
      clearAll();
    };
  }, [map]);

  useEffect(() => {
    if (!map || !isMapAlive(map)) return;
    map.fire("moveend");
  }, [map, locations, hiddenLocationId]);

  return null;
}
