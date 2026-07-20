import type { Map as MapLibreMap } from "maplibre-gl";
import type { MapSighting } from "@/lib/sightings";

export type SpiderLeaf = {
  sighting: MapSighting;
  lng: number;
  lat: number;
};

/** Offsets en píxeles (estilo OverlappingMarkerSpiderfier). */
export function computeSpiderOffsets(count: number): { x: number; y: number }[] {
  if (count <= 0) return [];

  const radius = Math.min(50 + count * 8, 120);
  const startAngle = -Math.PI / 2;

  if (count === 1) {
    return [{ x: 0, y: -radius }];
  }

  if (count <= 9) {
    const step = (2 * Math.PI) / count;
    return Array.from({ length: count }, (_, i) => {
      const angle = startAngle + i * step;
      return {
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
      };
    });
  }

  // Espiral para ubicaciones con muchos avistamientos
  const separation = 38;
  const lengthFactor = 7;
  let angle = 0;
  let length = radius * 0.7;

  return Array.from({ length: count }, () => {
    angle += separation / length + 0.15;
    length += (lengthFactor * Math.PI * 2) / angle;
    return {
      x: Math.cos(angle) * length,
      y: Math.sin(angle) * length,
    };
  });
}

export function computeSpiderLeaves(
  map: MapLibreMap,
  center: { lng: number; lat: number },
  sightings: MapSighting[],
): SpiderLeaf[] {
  const centerPoint = map.project([center.lng, center.lat]);
  const offsets = computeSpiderOffsets(sightings.length);

  return sightings.map((sighting, index) => {
    const offset = offsets[index] ?? { x: 0, y: 0 };
    const lngLat = map.unproject([
      centerPoint.x + offset.x,
      centerPoint.y + offset.y,
    ]);

    return {
      sighting,
      lng: lngLat.lng,
      lat: lngLat.lat,
    };
  });
}

export function leavesToLegGeoJson(
  center: { lng: number; lat: number },
  leaves: SpiderLeaf[],
): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: leaves.map((leaf) => ({
      type: "Feature",
      properties: { id: leaf.sighting.id },
      geometry: {
        type: "LineString",
        coordinates: [
          [center.lng, center.lat],
          [leaf.lng, leaf.lat],
        ],
      },
    })),
  };
}
