"use server";

import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@/lib/auth/session";
import {
  attachBlobPathnameModel,
  attachCandidateModel,
  attachUploadedModel,
  clearModel3d,
  findReusableSpeciesModel,
  reuseAsCandidate,
} from "@/lib/model3d/attach";
import {
  searchSketchfabModels,
  type ModelCandidate,
} from "@/lib/model3d/search";
import { prisma } from "@/lib/db";

export type Model3dActionState = {
  error?: string;
  success?: string;
};

export type SearchModelsState = {
  error?: string;
  candidates?: ModelCandidate[];
  hint?: string;
};

function revalidateSighting(sightingId: string) {
  revalidatePath(`/pez/${sightingId}`);
  revalidatePath("/");
}

export async function searchFreeModelsAction(
  _prev: SearchModelsState,
  formData: FormData,
): Promise<SearchModelsState> {
  await requireAdminSession();

  const sightingId = String(formData.get("sightingId") ?? "");
  if (!sightingId) {
    return { error: "Falta el avistamiento." };
  }

  const sighting = await prisma.sighting.findUnique({
    where: { id: sightingId },
    include: {
      species: {
        select: { id: true, scientificName: true, commonName: true },
      },
    },
  });

  if (!sighting) {
    return { error: "Avistamiento no encontrado." };
  }

  const candidates: ModelCandidate[] = [];

  const reusable = await findReusableSpeciesModel(
    sighting.speciesId,
    sightingId,
  );
  if (reusable) {
    candidates.push(
      reuseAsCandidate(
        reusable.model3dUrl,
        `Reutilizar 3D de ${sighting.species.commonName}`,
      ),
    );
  }

  try {
    const remote = await searchSketchfabModels(
      sighting.species.scientificName || sighting.species.commonName,
      12,
    );
    candidates.push(...remote);
  } catch (error) {
    if (candidates.length === 0) {
      return {
        error:
          error instanceof Error
            ? error.message
            : "No se pudo buscar en Sketchfab.",
        hint: "Puedes subir un .glb manualmente.",
      };
    }
  }

  const hasToken = Boolean(process.env.SKETCHFAB_API_TOKEN?.trim());

  return {
    candidates,
    hint:
      candidates.length === 0
        ? "No hay candidatos libres. Sube un .glb o prueba otra búsqueda más tarde."
        : hasToken
          ? `Hay ${candidates.length} opciones. Pasa entre ellas y confirma solo si la miniatura encaja.`
          : "Revisa cada opción. Para adjuntar desde Sketchfab hace falta SKETCHFAB_API_TOKEN; si no, abre el enlace, descarga el .glb y súbelo.",
  };
}

export async function attachCandidateAction(
  _prev: Model3dActionState,
  formData: FormData,
): Promise<Model3dActionState> {
  await requireAdminSession();

  const sightingId = String(formData.get("sightingId") ?? "");
  const source = String(formData.get("source") ?? "") as ModelCandidate["source"];
  const title = String(formData.get("title") ?? "Modelo");
  const sketchfabUid = String(formData.get("sketchfabUid") ?? "") || undefined;
  const curatedUrl = String(formData.get("curatedUrl") ?? "") || undefined;
  const reuseUrl = String(formData.get("reuseUrl") ?? "") || undefined;

  if (!sightingId || !source) {
    return { error: "Faltan datos del candidato." };
  }

  try {
    const result = await attachCandidateModel(sightingId, {
      source,
      title,
      sketchfabUid,
      curatedUrl,
      reuseUrl,
    });
    revalidateSighting(sightingId);
    return { success: `Modelo confirmado: ${result.label}` };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "No se pudo adjuntar el candidato.",
    };
  }
}

export async function uploadModel3dAction(
  _prev: Model3dActionState,
  formData: FormData,
): Promise<Model3dActionState> {
  await requireAdminSession();

  const sightingId = String(formData.get("sightingId") ?? "");
  const file = formData.get("model");

  if (!sightingId) {
    return { error: "Falta el avistamiento." };
  }
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Elige un archivo .glb." };
  }

  try {
    const result = await attachUploadedModel(sightingId, file);
    revalidateSighting(sightingId);
    return { success: `Modelo subido: ${result.label}` };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "No se pudo subir el modelo.",
    };
  }
}

/** Confirma un .glb ya subido a Blob desde el navegador (sin pasar el archivo por la Server Action). */
export async function confirmBlobModelAction(
  sightingId: string,
  pathname: string,
  label?: string,
): Promise<Model3dActionState> {
  await requireAdminSession();

  if (!sightingId) {
    return { error: "Falta el avistamiento." };
  }
  if (!pathname) {
    return { error: "Falta la ruta del modelo." };
  }

  try {
    const result = await attachBlobPathnameModel(
      sightingId,
      pathname,
      label ?? "model.glb",
    );
    revalidateSighting(sightingId);
    return { success: `Modelo subido: ${result.label}` };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "No se pudo adjuntar el modelo.",
    };
  }
}

export async function clearModel3dAction(
  _prev: Model3dActionState,
  formData: FormData,
): Promise<Model3dActionState> {
  await requireAdminSession();

  const sightingId = String(formData.get("sightingId") ?? "");
  if (!sightingId) {
    return { error: "Falta el avistamiento." };
  }

  try {
    await clearModel3d(sightingId);
    revalidateSighting(sightingId);
    return { success: "Vuelta a la foto." };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "No se pudo quitar el modelo.",
    };
  }
}
