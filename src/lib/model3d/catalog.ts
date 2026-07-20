/**
 * Catálogo local de modelos low-poly por nombre científico.
 * Si no hay match, el admin puede buscar en Sketchfab o subir un .glb.
 */
export type CuratedModel = {
  scientificName: string;
  /** Ruta pública bajo /public */
  modelUrl: string;
  source: string;
  label: string;
};

const BY_SCIENTIFIC: Record<string, CuratedModel> = {
  "zebrasoma flavescens": {
    scientificName: "Zebrasoma flavescens",
    modelUrl: "/models/curated/fish-yellow.glb",
    source: "curated_yellow",
    label: "Cirujano amarillo",
  },
  "amphiprion ocellaris": {
    scientificName: "Amphiprion ocellaris",
    modelUrl: "/models/curated/fish-orange.glb",
    source: "curated_orange",
    label: "Pez payaso",
  },
  "pterois volitans": {
    scientificName: "Pterois volitans",
    modelUrl: "/models/curated/fish-violet.glb",
    source: "curated_violet",
    label: "Pez león",
  },
  "acanthurus leucosternon": {
    scientificName: "Acanthurus leucosternon",
    modelUrl: "/models/curated/fish-blue.glb",
    source: "curated_blue",
    label: "Cirujano azul",
  },
  "pomacanthus imperator": {
    scientificName: "Pomacanthus imperator",
    modelUrl: "/models/curated/fish-teal.glb",
    source: "curated_teal",
    label: "Ángel emperador",
  },
  "chaetodon auriga": {
    scientificName: "Chaetodon auriga",
    modelUrl: "/models/curated/fish-pink.glb",
    source: "curated_pink",
    label: "Mariposa hilo",
  },
  "balistoides conspicillum": {
    scientificName: "Balistoides conspicillum",
    modelUrl: "/models/curated/fish-orange.glb",
    source: "curated_orange",
    label: "Ballesta payaso",
  },
  "scaridae sp.": {
    scientificName: "Scaridae sp.",
    modelUrl: "/models/curated/fish-teal.glb",
    source: "curated_teal",
    label: "Pez loro",
  },
};

export function findCuratedModel(
  scientificName: string,
): CuratedModel | null {
  const key = scientificName.trim().toLowerCase();
  if (!key) return null;
  return BY_SCIENTIFIC[key] ?? null;
}

export function listCuratedModels(): CuratedModel[] {
  const seen = new Set<string>();
  const list: CuratedModel[] = [];
  for (const model of Object.values(BY_SCIENTIFIC)) {
    const key = `${model.modelUrl}:${model.label}`;
    if (seen.has(key)) continue;
    seen.add(key);
    list.push(model);
  }
  return list;
}
