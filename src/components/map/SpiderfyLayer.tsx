"use client";

import { useEffect, useRef } from "react";
import maplibregl, {
  type GeoJSONSource,
  type Map as MapLibreMap,
  type Marker,
} from "maplibre-gl";
import {
  computeSpiderLeaves,
  leavesToLegGeoJson,
} from "@/lib/spiderfy";
import type { MapLocation } from "@/lib/sightings";
import { TROPICAL_COLORS } from "@/lib/constants";
import { createFishPinElement } from "@/components/map/fishPin";

const LEGS_SOURCE = "pecedex-spiderfy-legs";
const LEGS_LAYER = "pecedex-spiderfy-legs-line";

interface SpiderfyLayerProps {
  map: MapLibreMap | null;
  location: MapLocation | null;
  reducedMotion?: boolean;
  onSelectSighting: (sightingId: string) => void;
  onClose: () => void;
}

function isMapAlive(map: MapLibreMap): boolean {
  try {
    return Boolean(map.getStyle());
  } catch {
    return false;
  }
}

function createHubElement(label: string): HTMLDivElement {
  const hub = document.createElement("div");
  hub.className = "spider-hub";
  hub.title = label;
  hub.setAttribute("aria-hidden", "true");
  return hub;
}

export function SpiderfyLayer({
  map,
  location,
  reducedMotion = false,
  onSelectSighting,
  onClose,
}: SpiderfyLayerProps) {
  const markersRef = useRef<Marker[]>([]);
  const hubRef = useRef<Marker | null>(null);
  const activeIdRef = useRef<string | null>(null);
  const onSelectRef = useRef(onSelectSighting);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onSelectRef.current = onSelectSighting;
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!map) return;

    const clearMarkers = () => {
      for (const marker of markersRef.current) {
        marker.remove();
      }
      markersRef.current = [];
      hubRef.current?.remove();
      hubRef.current = null;
    };

    const clearLegs = () => {
      if (!isMapAlive(map)) return;
      const source = map.getSource(LEGS_SOURCE) as GeoJSONSource | undefined;
      source?.setData({ type: "FeatureCollection", features: [] });
    };

    const ensureLegsLayer = () => {
      if (!isMapAlive(map)) return;

      if (!map.getSource(LEGS_SOURCE)) {
        map.addSource(LEGS_SOURCE, {
          type: "geojson",
          data: { type: "FeatureCollection", features: [] },
        });
      }

      if (!map.getLayer(LEGS_LAYER)) {
        map.addLayer({
          id: LEGS_LAYER,
          type: "line",
          source: LEGS_SOURCE,
          paint: {
            "line-color": TROPICAL_COLORS.coral,
            "line-opacity": 0.55,
            "line-width": 2,
          },
        });
      }
    };

    const render = () => {
      if (!isMapAlive(map)) return;

      if (!location) {
        activeIdRef.current = null;
        clearMarkers();
        clearLegs();
        return;
      }

      ensureLegsLayer();

      const leaves = computeSpiderLeaves(
        map,
        { lng: location.lng, lat: location.lat },
        location.sightings,
      );

      const source = map.getSource(LEGS_SOURCE) as GeoJSONSource | undefined;
      source?.setData(
        leavesToLegGeoJson(
          { lng: location.lng, lat: location.lat },
          leaves,
        ),
      );

      const needsRebuild =
        activeIdRef.current !== location.id ||
        markersRef.current.length !== leaves.length;

      if (needsRebuild) {
        clearMarkers();
        activeIdRef.current = location.id;

        hubRef.current = new maplibregl.Marker({
          element: createHubElement(location.label),
          anchor: "center",
        })
          .setLngLat([location.lng, location.lat])
          .addTo(map);

        markersRef.current = leaves.map((leaf, index) => {
          const element = createFishPinElement({
            name: leaf.sighting.commonName,
            photoUrl: leaf.sighting.photoThumbUrl,
            withLabel: true,
            className: "fish-pin-spider",
            onClick: () => onSelectRef.current(leaf.sighting.id),
          });

          const marker = new maplibregl.Marker({
            element,
            anchor: "center",
          })
            .setLngLat([leaf.lng, leaf.lat])
            .addTo(map);

          // Animar tras insertar en el DOM
          if (!reducedMotion) {
            requestAnimationFrame(() => {
              element.style.animationDelay = `${index * 40}ms`;
              element.classList.add("fish-pin-enter");
            });
          }

          return marker;
        });
      } else {
        hubRef.current?.setLngLat([location.lng, location.lat]);
        leaves.forEach((leaf, index) => {
          markersRef.current[index]?.setLngLat([leaf.lng, leaf.lat]);
        });
      }
    };

    const onZoomStart = () => {
      if (location) onCloseRef.current();
    };

    render();
    map.on("move", render);
    map.on("zoomstart", onZoomStart);

    return () => {
      if (isMapAlive(map)) {
        map.off("move", render);
        map.off("zoomstart", onZoomStart);
        clearLegs();
        if (map.getLayer(LEGS_LAYER)) map.removeLayer(LEGS_LAYER);
        if (map.getSource(LEGS_SOURCE)) map.removeSource(LEGS_SOURCE);
      }
      clearMarkers();
      activeIdRef.current = null;
    };
  }, [map, location, reducedMotion]);

  return null;
}
