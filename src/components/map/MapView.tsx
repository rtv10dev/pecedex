"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import maplibregl, { type GeoJSONSource, type Map as MapLibreMap } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { MAP_STYLE_URL, TROPICAL_COLORS } from "@/lib/constants";
import type { MapLocation } from "@/lib/sightings";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { SpiderfyLayer } from "@/components/map/SpiderfyLayer";
import { SingleFishMarkers } from "@/components/map/SingleFishMarkers";
import { useMapStore } from "@/stores/mapStore";

const SOURCE_ID = "pecedex-locations";
const CLUSTER_LAYER = "pecedex-clusters";
const CLUSTER_COUNT_LAYER = "pecedex-cluster-count";
const POINT_LAYER = "pecedex-unclustered";
const POINT_COUNT_LAYER = "pecedex-unclustered-count";

interface MapViewProps {
  locations: MapLocation[];
}

function toGeoJson(locations: MapLocation[]): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: locations.map((location) => ({
      type: "Feature",
      properties: {
        id: location.id,
        label: location.label,
        count: location.count,
      },
      geometry: {
        type: "Point",
        coordinates: [location.lng, location.lat],
      },
    })),
  };
}

function readLocationId(
  feature: maplibregl.MapGeoJSONFeature,
): string | null {
  const id = feature.properties?.id;
  return id ? String(id) : null;
}

/** Círculos solo para ubicaciones con varios peces (los de 1 usan miniatura HTML). */
function multiPointFilter(
  hiddenId: string | null,
): maplibregl.FilterSpecification {
  if (!hiddenId) {
    return [
      "all",
      ["!", ["has", "point_count"]],
      [">", ["get", "count"], 1],
    ];
  }
  return [
    "all",
    ["!", ["has", "point_count"]],
    [">", ["get", "count"], 1],
    ["!=", ["get", "id"], hiddenId],
  ];
}

export function MapView({ locations }: MapViewProps) {
  const router = useRouter();
  const reducedMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const locationsRef = useRef(locations);
  const spiderfyRef = useRef<MapLocation | null>(null);
  const reducedMotionRef = useRef(reducedMotion);

  const [mapInstance, setMapInstance] = useState<MapLibreMap | null>(null);
  const [spiderfy, setSpiderfy] = useState<MapLocation | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openSighting = (sightingId: string) => {
    const map = mapRef.current;
    if (map) {
      const center = map.getCenter();
      useMapStore.getState().setCamera({
        center: [center.lng, center.lat],
        zoom: map.getZoom(),
      });
    }
    useMapStore.getState().setSpiderfyLocationId(spiderfyRef.current?.id ?? null);
    useMapStore.getState().markRestoreOnNextVisit();
    router.push(`/pez/${sightingId}?from=mapa`);
  };

  useEffect(() => {
    locationsRef.current = locations;
  }, [locations]);

  useEffect(() => {
    spiderfyRef.current = spiderfy;
    useMapStore.getState().setSpiderfyLocationId(spiderfy?.id ?? null);
  }, [spiderfy]);

  useEffect(() => {
    reducedMotionRef.current = reducedMotion;
  }, [reducedMotion]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const shouldRestore = useMapStore.getState().consumeRestoreOnNextVisit();
    const savedCamera = shouldRestore ? useMapStore.getState().camera : null;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: MAP_STYLE_URL,
      center: savedCamera?.center ?? [-8.5, 34.5],
      zoom: savedCamera?.zoom ?? 4.2,
      attributionControl: {
        compact: true,
      },
    });

    map.addControl(
      new maplibregl.NavigationControl({ showCompass: false }),
      "top-right",
    );

    mapRef.current = map;

    const setPointer = () => {
      map.getCanvas().style.cursor = "pointer";
    };
    const clearPointer = () => {
      map.getCanvas().style.cursor = "";
    };

    map.on("error", (event) => {
      if (event.error?.message) {
        setError("No se pudo cargar el mapa. Comprueba la conexión.");
        setReady(true);
      }
    });

    map.on("load", () => {
      map.addSource(SOURCE_ID, {
        type: "geojson",
        data: toGeoJson(locationsRef.current),
        cluster: true,
        clusterMaxZoom: 14,
        clusterRadius: 56,
        clusterProperties: {
          sum: ["+", ["get", "count"]],
        },
      });

      map.addLayer({
        id: CLUSTER_LAYER,
        type: "circle",
        source: SOURCE_ID,
        filter: ["has", "point_count"],
        paint: {
          "circle-color": [
            "step",
            ["get", "sum"],
            TROPICAL_COLORS.parrot,
            4,
            TROPICAL_COLORS.lagoon,
            8,
            TROPICAL_COLORS.clownfish,
          ],
          "circle-radius": ["step", ["get", "sum"], 20, 4, 26, 8, 32],
          "circle-stroke-width": 3,
          "circle-stroke-color": "#ffffff",
          "circle-opacity": 0.95,
        },
      });

      map.addLayer({
        id: CLUSTER_COUNT_LAYER,
        type: "symbol",
        source: SOURCE_ID,
        filter: ["has", "point_count"],
        layout: {
          "text-field": ["to-string", ["get", "sum"]],
          "text-font": ["Noto Sans Bold"],
          "text-size": 14,
          "text-allow-overlap": true,
        },
        paint: {
          "text-color": TROPICAL_COLORS.ink,
        },
      });

      map.addLayer({
        id: POINT_LAYER,
        type: "circle",
        source: SOURCE_ID,
        filter: multiPointFilter(null),
        paint: {
          "circle-color": TROPICAL_COLORS.tang,
          "circle-radius": 18,
          "circle-stroke-width": 3,
          "circle-stroke-color": "#ffffff",
          "circle-opacity": 0.95,
        },
      });

      map.addLayer({
        id: POINT_COUNT_LAYER,
        type: "symbol",
        source: SOURCE_ID,
        filter: multiPointFilter(null),
        layout: {
          "text-field": ["to-string", ["get", "count"]],
          "text-font": ["Noto Sans Bold"],
          "text-size": 13,
          "text-allow-overlap": true,
        },
        paint: {
          "text-color": "#ffffff",
        },
      });

      const currentLocations = locationsRef.current;

      if (!savedCamera && currentLocations.length > 0) {
        const bounds = new maplibregl.LngLatBounds();
        for (const location of currentLocations) {
          bounds.extend([location.lng, location.lat]);
        }
        map.fitBounds(bounds, {
          padding: { top: 56, bottom: 72, left: 40, right: 40 },
          maxZoom: 12,
          duration: 0,
        });
      }

      if (shouldRestore) {
        const savedSpiderfyId = useMapStore.getState().spiderfyLocationId;
        if (savedSpiderfyId) {
          const location = currentLocations.find(
            (item) => item.id === savedSpiderfyId,
          );
          if (location && location.sightings.length >= 2) {
            setSpiderfy(location);
          }
        }
      }

      setMapInstance(map);
      setReady(true);
    });

    map.on("moveend", () => {
      const center = map.getCenter();
      useMapStore.getState().setCamera({
        center: [center.lng, center.lat],
        zoom: map.getZoom(),
      });
    });

    map.on("click", CLUSTER_LAYER, async (event) => {
      const feature = event.features?.[0];
      if (!feature || feature.geometry.type !== "Point") return;

      const clusterId = feature.properties?.cluster_id;
      if (clusterId == null) return;

      const source = map.getSource(SOURCE_ID) as GeoJSONSource;
      const zoom = await source.getClusterExpansionZoom(clusterId);
      const [lng, lat] = feature.geometry.coordinates;

      setSpiderfy(null);
      map.easeTo({
        center: [lng, lat],
        zoom,
        duration: reducedMotionRef.current ? 0 : 500,
      });
    });

    map.on("click", POINT_LAYER, (event) => {
      event.originalEvent.stopPropagation();
      const feature = event.features?.[0];
      if (!feature) return;

      const locationId = readLocationId(feature);
      if (!locationId) return;

      const location = locationsRef.current.find((item) => item.id === locationId);
      if (!location || location.sightings.length < 2) return;

      setSpiderfy(location);
      map.easeTo({
        center: [location.lng, location.lat],
        duration: reducedMotionRef.current ? 0 : 350,
      });
    });

    map.on("click", (event) => {
      const hits = map.queryRenderedFeatures(event.point, {
        layers: [CLUSTER_LAYER, POINT_LAYER],
      });
      if (hits.length === 0 && spiderfyRef.current) {
        setSpiderfy(null);
      }
    });

    map.on("mouseenter", CLUSTER_LAYER, setPointer);
    map.on("mouseleave", CLUSTER_LAYER, clearPointer);
    map.on("mouseenter", POINT_LAYER, setPointer);
    map.on("mouseleave", POINT_LAYER, clearPointer);

    const observer = new ResizeObserver(() => {
      map.resize();
    });
    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
      setMapInstance(null);
      mapRef.current = null;
      map.remove();
    };
    // Mapa montado una vez; datos y navegación vía refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;

    const source = map.getSource(SOURCE_ID) as GeoJSONSource | undefined;
    source?.setData(toGeoJson(locations));
  }, [locations, ready]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready || !map.getLayer(POINT_LAYER)) return;

    const hiddenId = spiderfy?.id ?? null;
    map.setFilter(POINT_LAYER, multiPointFilter(hiddenId));
    map.setFilter(POINT_COUNT_LAYER, multiPointFilter(hiddenId));
  }, [spiderfy, ready]);

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="map-canvas h-full w-full" />

      <SingleFishMarkers
        map={mapInstance}
        locations={locations}
        hiddenLocationId={spiderfy?.id}
        onSelectSighting={openSighting}
      />

      <SpiderfyLayer
        map={mapInstance}
        location={spiderfy}
        reducedMotion={reducedMotion}
        onSelectSighting={openSighting}
        onClose={() => setSpiderfy(null)}
      />

      {!ready ? (
        <div className="absolute inset-0 flex items-center justify-center bg-foam-white/80">
          <p className="text-sm font-semibold text-deep-teal">Cargando mapa…</p>
        </div>
      ) : null}

      {error ? (
        <div className="absolute inset-x-3 top-3 z-10 rounded-2xl border border-coral/40 bg-shell/95 px-4 py-3 text-sm font-medium text-coral shadow-lg">
          {error}
        </div>
      ) : null}

      {spiderfy ? (
        <div className="pointer-events-none absolute inset-x-3 top-3 z-10 overflow-hidden rounded-2xl border-2 border-white/90 bg-shell/95 shadow-lg shadow-coral/20 backdrop-blur-md">
          <div className="rainbow-border h-1" />
          <div className="px-3.5 py-2.5">
            <p className="truncate text-sm font-bold text-ink">{spiderfy.label}</p>
            <p className="text-xs font-medium text-deep-teal/90">
              Toca una miniatura para ver la ficha
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
