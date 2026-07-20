"use server";

import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { identifySpeciesFromImage } from "@/lib/identify";
import {
  reverseGeocode,
  searchPlaces,
  type GeocodeResult,
} from "@/lib/geocode";
import { tryAutoReuseSpeciesModel } from "@/lib/model3d/attach";
import {
  deleteUploadByPublicUrl,
  isManagedUploadUrl,
  saveSightingPhoto,
  saveTempIdentifyPhoto,
} from "@/lib/storage";
import { redirect } from "next/navigation";

export type IdentifyState = {
  error?: string;
  suggestion?: {
    commonName: string;
    scientificName: string;
    description: string;
    family: string;
    habitat: string;
    confidence: number;
    notes: string;
  };
  photoPreviewUrl?: string;
};

export type CreateSightingState = {
  error?: string;
  /** Si hay id, el formulario pasa al paso opcional de modelo 3D. */
  sightingId?: string;
  commonName?: string;
  scientificName?: string;
  modelAlreadyReused?: boolean;
};

export async function identifySightingAction(
  _prev: IdentifyState,
  formData: FormData,
): Promise<IdentifyState> {
  await requireAdminSession();

  const photo = formData.get("photo");
  if (!(photo instanceof File) || photo.size === 0) {
    return { error: "Elige una foto del pez." };
  }

  try {
    const temp = await saveTempIdentifyPhoto(photo);
    const suggestion = await identifySpeciesFromImage(temp.bytes, temp.mimeType);

    return {
      suggestion,
      photoPreviewUrl: temp.publicUrl,
    };
  } catch {
    return {
      error: "Ha ocurrido un error. Vuelve a intentarlo de nuevo.",
    };
  }
}

export async function searchLocationsAction(
  query: string,
): Promise<{ results: GeocodeResult[]; error?: string }> {
  await requireAdminSession();

  try {
    const results = await searchPlaces(query);
    return { results };
  } catch (error) {
    return {
      results: [],
      error:
        error instanceof Error ? error.message : "Error buscando ubicaciones.",
    };
  }
}

export async function reverseGeocodeAction(
  lat: number,
  lng: number,
): Promise<{ label: string | null; error?: string }> {
  await requireAdminSession();

  try {
    const label = await reverseGeocode(lat, lng);
    return { label };
  } catch (error) {
    return {
      label: null,
      error:
        error instanceof Error ? error.message : "No se pudo obtener el lugar.",
    };
  }
}

export async function createSightingAction(
  _prev: CreateSightingState,
  formData: FormData,
): Promise<CreateSightingState> {
  await requireAdminSession();

  const photo = formData.get("photo");
  const commonName = String(formData.get("commonName") ?? "").trim();
  const scientificName = String(formData.get("scientificName") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const family = String(formData.get("family") ?? "").trim();
  const habitat = String(formData.get("habitat") ?? "").trim();
  const locationLabel = String(formData.get("locationLabel") ?? "").trim();
  const lat = Number(formData.get("lat"));
  const lng = Number(formData.get("lng"));
  const sightedAtRaw = String(formData.get("sightedAt") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();
  const confidence = Number(formData.get("confidence") || 0);

  if (!(photo instanceof File) || photo.size === 0) {
    return { error: "Falta la foto del avistamiento." };
  }
  if (!commonName || !scientificName) {
    return { error: "Nombre común y científico son obligatorios." };
  }
  if (!locationLabel || Number.isNaN(lat) || Number.isNaN(lng)) {
    return { error: "Elige una ubicación de la lista (con coordenadas)." };
  }

  let sightedAt: Date | null = null;
  if (sightedAtRaw) {
    const parsed = new Date(sightedAtRaw);
    if (Number.isNaN(parsed.getTime())) {
      return { error: "Fecha de avistamiento no válida." };
    }
    sightedAt = parsed;
  }

  let sightingId: string;

  try {
    const saved = await saveSightingPhoto(photo);

    const species = await prisma.species.upsert({
      where: { scientificName },
      create: {
        scientificName,
        commonName,
        description: description || null,
        family: family || null,
        habitat: habitat || null,
      },
      update: {
        commonName,
        description: description || null,
        family: family || null,
        habitat: habitat || null,
      },
    });

    let location = await prisma.location.findFirst({
      where: {
        label: locationLabel,
        lat: { gte: lat - 0.00005, lte: lat + 0.00005 },
        lng: { gte: lng - 0.00005, lte: lng + 0.00005 },
      },
    });

    if (!location) {
      location = await prisma.location.create({
        data: {
          label: locationLabel,
          lat,
          lng,
          geocodeSource: "google_or_manual",
        },
      });
    }

    const sighting = await prisma.sighting.create({
      data: {
        speciesId: species.id,
        locationId: location.id,
        photoUrl: saved.photoUrl,
        photoThumbUrl: saved.photoThumbUrl,
        sightedAt,
        notes: notes || null,
        displayMode: "PHOTO_ROTATOR",
        model3dStatus: "PENDING",
        identificationMeta: {
          confidence,
          source: "gemini",
        },
      },
    });

    sightingId = sighting.id;
    const reused = await tryAutoReuseSpeciesModel(sightingId, species.id);

    revalidatePath("/");
    revalidatePath("/mapa");
    revalidatePath(`/pez/${sightingId}`);

    return {
      sightingId,
      commonName,
      scientificName,
      modelAlreadyReused: reused,
    };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "No se pudo guardar el avistamiento.",
    };
  }
}

export type DeleteSightingState = {
  error?: string;
};

/** Borra un avistamiento (admin). Limpia fotos/modelos de uploads y especies/ubicaciones huérfanas. */
export async function deleteSightingAction(
  _prev: DeleteSightingState,
  formData: FormData,
): Promise<DeleteSightingState> {
  await requireAdminSession();

  const sightingId = String(formData.get("sightingId") ?? "").trim();
  if (!sightingId) {
    return { error: "Falta el avistamiento." };
  }

  const sighting = await prisma.sighting.findUnique({
    where: { id: sightingId },
    select: {
      id: true,
      photoUrl: true,
      photoThumbUrl: true,
      model3dUrl: true,
      speciesId: true,
      locationId: true,
    },
  });

  if (!sighting) {
    return { error: "Avistamiento no encontrado." };
  }

  const modelUrl = sighting.model3dUrl;
  const modelStillUsed =
    modelUrl && isManagedUploadUrl(modelUrl)
      ? (await prisma.sighting.count({
          where: {
            model3dUrl: modelUrl,
            id: { not: sighting.id },
          },
        })) > 0
      : true;

  await prisma.sighting.delete({ where: { id: sighting.id } });

  const otherSpecies = await prisma.sighting.count({
    where: { speciesId: sighting.speciesId },
  });
  if (otherSpecies === 0) {
    await prisma.species.delete({ where: { id: sighting.speciesId } }).catch(() => {});
  }

  const otherLocations = await prisma.sighting.count({
    where: { locationId: sighting.locationId },
  });
  if (otherLocations === 0) {
    await prisma.location
      .delete({ where: { id: sighting.locationId } })
      .catch(() => {});
  }

  // Foto: en local borra la carpeta; en Blob hay que borrar full y thumb por URL
  await deleteUploadByPublicUrl(sighting.photoUrl);
  if (sighting.photoThumbUrl && sighting.photoThumbUrl !== sighting.photoUrl) {
    await deleteUploadByPublicUrl(sighting.photoThumbUrl);
  }

  if (modelUrl && isManagedUploadUrl(modelUrl) && !modelStillUsed) {
    await deleteUploadByPublicUrl(modelUrl);
  }

  revalidatePath("/");
  revalidatePath("/mapa");
  revalidatePath(`/pez/${sightingId}`);

  redirect("/");
}
