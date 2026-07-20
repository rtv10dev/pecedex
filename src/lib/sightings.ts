import type { SortBy } from "@/lib/constants";
import { prisma } from "@/lib/db";

export type SightingListItem = {
  id: string;
  photoThumbUrl: string;
  photoUrl: string;
  registeredAt: Date;
  sightedAt: Date | null;
  displayMode: "PHOTO_ROTATOR" | "MODEL_3D";
  model3dStatus: "PENDING" | "PROCESSING" | "READY" | "FAILED";
  species: {
    commonName: string;
    scientificName: string;
  };
  location: {
    label: string;
  };
};

export async function getSightings(
  sortBy: SortBy = "registeredAt",
): Promise<SightingListItem[]> {
  try {
    const sightings = await prisma.sighting.findMany({
      include: {
        species: {
          select: {
            commonName: true,
            scientificName: true,
          },
        },
        location: {
          select: {
            label: true,
          },
        },
      },
      orderBy:
        sortBy === "location"
          ? [{ location: { label: "asc" } }, { registeredAt: "desc" }]
          : { registeredAt: "desc" },
    });

    return sightings;
  } catch {
    return [];
  }
}

export async function getSightingCount(): Promise<number> {
  try {
    return await prisma.sighting.count();
  } catch {
    return 0;
  }
}

export type MapSighting = {
  id: string;
  photoThumbUrl: string;
  commonName: string;
};

export type MapLocation = {
  id: string;
  label: string;
  lat: number;
  lng: number;
  count: number;
  sightings: MapSighting[];
};

export async function getMapLocations(): Promise<MapLocation[]> {
  try {
    const locations = await prisma.location.findMany({
      where: {
        sightings: { some: {} },
      },
      select: {
        id: true,
        label: true,
        lat: true,
        lng: true,
        sightings: {
          select: {
            id: true,
            photoThumbUrl: true,
            species: {
              select: { commonName: true },
            },
          },
          orderBy: { registeredAt: "desc" },
        },
      },
    });

    return locations.map((location) => ({
      id: location.id,
      label: location.label,
      lat: location.lat,
      lng: location.lng,
      count: location.sightings.length,
      sightings: location.sightings.map((sighting) => ({
        id: sighting.id,
        photoThumbUrl: sighting.photoThumbUrl,
        commonName: sighting.species.commonName,
      })),
    }));
  } catch {
    return [];
  }
}
