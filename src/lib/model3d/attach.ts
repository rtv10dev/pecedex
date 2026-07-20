import { prisma } from "@/lib/db";
import {
  findCuratedModel,
  type CuratedModel,
} from "@/lib/model3d/catalog";
import {
  downloadSketchfabGlb,
  type ModelCandidate,
} from "@/lib/model3d/search";
import {
  copyPublicModelToUploads,
  copyUploadModelToUploads,
  isManagedUploadUrl,
  mediaUrlForBlobPathname,
  saveModel3dBytes,
  saveModel3dFile,
} from "@/lib/storage";

export type AttachModelResult = {
  model3dUrl: string;
  model3dSource: string;
  label: string;
};

async function markReady(
  sightingId: string,
  model3dUrl: string,
  model3dSource: string,
) {
  await prisma.sighting.update({
    where: { id: sightingId },
    data: {
      model3dUrl,
      model3dSource,
      model3dStatus: "READY",
      displayMode: "MODEL_3D",
    },
  });
}

async function markFailed(sightingId: string) {
  await prisma.sighting
    .update({
      where: { id: sightingId },
      data: { model3dStatus: "FAILED" },
    })
    .catch(() => {});
}

/** Otro avistamiento de la misma especie con modelo listo. */
export async function findReusableSpeciesModel(
  speciesId: string,
  excludeSightingId?: string,
): Promise<{
  model3dUrl: string;
  model3dSource: string | null;
} | null> {
  const existing = await prisma.sighting.findFirst({
    where: {
      speciesId,
      model3dStatus: "READY",
      model3dUrl: { not: null },
      ...(excludeSightingId ? { id: { not: excludeSightingId } } : {}),
    },
    select: { model3dUrl: true, model3dSource: true },
    orderBy: { registeredAt: "asc" },
  });

  if (!existing?.model3dUrl) return null;
  return {
    model3dUrl: existing.model3dUrl,
    model3dSource: existing.model3dSource,
  };
}

export function curatedAsCandidate(
  scientificName: string,
): ModelCandidate | null {
  const curated = findCuratedModel(scientificName);
  if (!curated) return null;
  return {
    id: `curated:${curated.scientificName}`,
    source: "curated",
    title: curated.label,
    author: "Catálogo Pecedex",
    thumbUrl: null,
    viewerUrl: curated.modelUrl,
    license: "Local / uso propio",
    curatedUrl: curated.modelUrl,
  };
}

export function reuseAsCandidate(
  model3dUrl: string,
  label: string,
): ModelCandidate {
  return {
    id: `reuse:${model3dUrl}`,
    source: "species_reuse",
    title: label,
    author: "Ya en tu colección",
    thumbUrl: null,
    viewerUrl: model3dUrl,
    license: "Reutilizado",
    reuseUrl: model3dUrl,
  };
}

export async function attachCuratedModel(
  sightingId: string,
  scientificName: string,
): Promise<AttachModelResult> {
  const curated: CuratedModel | null = findCuratedModel(scientificName);

  if (!curated) {
    throw new Error(
      "No hay modelo curado para esta especie. Busca en Sketchfab o sube un .glb.",
    );
  }

  await prisma.sighting.update({
    where: { id: sightingId },
    data: { model3dStatus: "PROCESSING" },
  });

  try {
    const model3dUrl = await copyPublicModelToUploads(curated.modelUrl);
    await markReady(sightingId, model3dUrl, curated.source);
    return {
      model3dUrl,
      model3dSource: curated.source,
      label: curated.label,
    };
  } catch (error) {
    await markFailed(sightingId);
    throw error;
  }
}

export async function attachUploadedModel(
  sightingId: string,
  file: File,
): Promise<AttachModelResult> {
  await prisma.sighting.update({
    where: { id: sightingId },
    data: { model3dStatus: "PROCESSING" },
  });

  try {
    const model3dUrl = await saveModel3dFile(file);
    await markReady(sightingId, model3dUrl, "upload");
    return {
      model3dUrl,
      model3dSource: "upload",
      label: file.name,
    };
  } catch (error) {
    await markFailed(sightingId);
    throw error;
  }
}

/** Adjunta un .glb ya subido a Blob (subida directa desde el cliente). */
export async function attachBlobPathnameModel(
  sightingId: string,
  pathname: string,
  label = "model.glb",
): Promise<AttachModelResult> {
  if (
    !pathname.startsWith("uploads/models/") ||
    !pathname.endsWith("/model.glb") ||
    pathname.includes("..")
  ) {
    throw new Error("Ruta de modelo no válida.");
  }

  await prisma.sighting.update({
    where: { id: sightingId },
    data: { model3dStatus: "PROCESSING" },
  });

  try {
    const { get } = await import("@vercel/blob");
    const access =
      process.env.BLOB_ACCESS?.trim().toLowerCase() === "public"
        ? "public"
        : "private";
    const result = await get(pathname, { access });
    if (!result?.stream) {
      throw new Error("No se encontró el modelo subido.");
    }

    const reader = result.stream.getReader();
    const first = await reader.read();
    await reader.cancel().catch(() => {});
    const chunk = first.value;
    if (!chunk || chunk.byteLength < 12) {
      const { del } = await import("@vercel/blob");
      await del(pathname).catch(() => {});
      throw new Error("El archivo no parece un GLB válido.");
    }
    const magic = String.fromCharCode(
      chunk[0]!,
      chunk[1]!,
      chunk[2]!,
      chunk[3]!,
    );
    if (magic !== "glTF") {
      const { del } = await import("@vercel/blob");
      await del(pathname).catch(() => {});
      throw new Error("El archivo no parece un GLB válido.");
    }

    const model3dUrl = mediaUrlForBlobPathname(pathname);
    await markReady(sightingId, model3dUrl, "upload");
    return {
      model3dUrl,
      model3dSource: "upload",
      label,
    };
  } catch (error) {
    await markFailed(sightingId);
    throw error;
  }
}

export async function attachCandidateModel(
  sightingId: string,
  candidate: {
    source: ModelCandidate["source"];
    sketchfabUid?: string;
    curatedUrl?: string;
    reuseUrl?: string;
    title: string;
  },
): Promise<AttachModelResult> {
  await prisma.sighting.update({
    where: { id: sightingId },
    data: { model3dStatus: "PROCESSING" },
  });

  try {
    if (candidate.source === "species_reuse" && candidate.reuseUrl) {
      const reuseUrl = candidate.reuseUrl;
      const model3dUrl = reuseUrl.startsWith("/models/")
        ? await copyPublicModelToUploads(reuseUrl)
        : isManagedUploadUrl(reuseUrl)
          ? await copyUploadModelToUploads(reuseUrl)
          : reuseUrl;
      await markReady(sightingId, model3dUrl, "species_reuse");
      return {
        model3dUrl,
        model3dSource: "species_reuse",
        label: candidate.title,
      };
    }

    if (candidate.source === "curated" && candidate.curatedUrl) {
      const model3dUrl = await copyPublicModelToUploads(candidate.curatedUrl);
      await markReady(sightingId, model3dUrl, "curated_confirmed");
      return {
        model3dUrl,
        model3dSource: "curated_confirmed",
        label: candidate.title,
      };
    }

    if (candidate.source === "sketchfab" && candidate.sketchfabUid) {
      const { bytes, contentType } = await downloadSketchfabGlb(
        candidate.sketchfabUid,
      );
      if (
        contentType.includes("zip") ||
        bytes.toString("ascii", 0, 2) === "PK"
      ) {
        throw new Error(
          "Sketchfab devolvió un ZIP (glTF). Descarga el .glb desde Sketchfab y súbelo con «Subir .glb».",
        );
      }
      const model3dUrl = await saveModel3dBytes(bytes);
      const source = `sketchfab:${candidate.sketchfabUid}`;
      await markReady(sightingId, model3dUrl, source);
      return {
        model3dUrl,
        model3dSource: source,
        label: candidate.title,
      };
    }

    throw new Error("Candidato no válido.");
  } catch (error) {
    await markFailed(sightingId);
    throw error;
  }
}

export async function clearModel3d(sightingId: string): Promise<void> {
  await prisma.sighting.update({
    where: { id: sightingId },
    data: {
      model3dUrl: null,
      model3dSource: null,
      model3dStatus: "PENDING",
      displayMode: "PHOTO_ROTATOR",
    },
  });
}

/** Tras crear: reutiliza modelo de la misma especie si ya existe. */
export async function tryAutoReuseSpeciesModel(
  sightingId: string,
  speciesId: string,
): Promise<boolean> {
  const reusable = await findReusableSpeciesModel(speciesId, sightingId);
  if (!reusable) return false;
  try {
    await attachCandidateModel(sightingId, {
      source: "species_reuse",
      reuseUrl: reusable.model3dUrl,
      title: "Modelo de la misma especie",
    });
    return true;
  } catch {
    return false;
  }
}
