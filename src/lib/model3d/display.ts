/**
 * ¿Mostrar visor 3D? Ignora los GLB genéricos del catálogo curado
 * (deben verse como foto).
 */
export function hasDisplayableModel3d(opts: {
  displayMode: string;
  model3dStatus: string;
  model3dUrl: string | null | undefined;
  model3dSource?: string | null;
}): boolean {
  if (
    opts.displayMode !== "MODEL_3D" ||
    opts.model3dStatus !== "READY" ||
    !opts.model3dUrl
  ) {
    return false;
  }
  if (isCuratedDefaultModel(opts.model3dUrl, opts.model3dSource)) {
    return false;
  }
  return true;
}

export function isCuratedDefaultModel(
  model3dUrl: string | null | undefined,
  model3dSource?: string | null,
): boolean {
  if (!model3dUrl && !model3dSource) return false;
  if (model3dUrl?.includes("/models/curated/")) return true;
  if (model3dSource?.startsWith("curated")) return true;
  return false;
}
