export type ModelCandidate = {
  id: string;
  source: "sketchfab" | "curated" | "species_reuse";
  title: string;
  author: string;
  thumbUrl: string | null;
  viewerUrl: string | null;
  license: string | null;
  /** UID de Sketchfab (si source=sketchfab). */
  sketchfabUid?: string;
  /** Ruta pública local (si source=curated). */
  curatedUrl?: string;
  /** GLB ya en uploads (si source=species_reuse). */
  reuseUrl?: string;
};

type SketchfabSearchHit = {
  uid?: string;
  name?: string;
  viewerUrl?: string;
  isDownloadable?: boolean;
  thumbnails?: { images?: Array<{ url?: string; width?: number }> };
  user?: { displayName?: string; username?: string };
  license?: { label?: string; slug?: string };
};

/**
 * Busca modelos descargables en Sketchfab (CC).
 * La API de búsqueda es pública; la descarga requiere SKETCHFAB_API_TOKEN.
 */
export async function searchSketchfabModels(
  query: string,
  limit = 8,
): Promise<ModelCandidate[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  const url = new URL("https://api.sketchfab.com/v3/search");
  url.searchParams.set("type", "models");
  url.searchParams.set("q", `${q} fish`);
  url.searchParams.set("downloadable", "true");
  url.searchParams.set("archives_flavours", "false");
  url.searchParams.set("count", String(limit));

  const headers: HeadersInit = {
    Accept: "application/json",
  };
  const token = process.env.SKETCHFAB_API_TOKEN?.trim();
  if (token) {
    headers.Authorization = `Token ${token}`;
  }

  const response = await fetch(url, {
    headers,
    next: { revalidate: 0 },
  });

  if (!response.ok) {
    throw new Error(
      `Sketchfab no respondió (${response.status}). Prueba más tarde o sube un .glb.`,
    );
  }

  const data = (await response.json()) as {
    results?: SketchfabSearchHit[];
  };

  const results = data.results ?? [];
  return results
    .filter((hit) => hit.uid && hit.isDownloadable !== false)
    .map((hit) => {
      const images = hit.thumbnails?.images ?? [];
      const sorted = [...images].sort(
        (a, b) => (b.width ?? 0) - (a.width ?? 0),
      );
      const thumb =
        sorted.find((img) => (img.width ?? 0) >= 256)?.url ??
        sorted[0]?.url ??
        null;

      return {
        id: `sketchfab:${hit.uid}`,
        source: "sketchfab" as const,
        title: hit.name?.trim() || "Modelo Sketchfab",
        author:
          hit.user?.displayName?.trim() ||
          hit.user?.username?.trim() ||
          "Autor desconocido",
        thumbUrl: thumb,
        viewerUrl: hit.viewerUrl ?? `https://sketchfab.com/3d-models/${hit.uid}`,
        license: hit.license?.label ?? hit.license?.slug ?? "Creative Commons",
        sketchfabUid: hit.uid,
      };
    });
}

/** Descarga GLB (o ZIP glTF) de un modelo Sketchfab downloadable. */
export async function downloadSketchfabGlb(
  uid: string,
): Promise<{ bytes: Buffer; contentType: string }> {
  const token = process.env.SKETCHFAB_API_TOKEN?.trim();
  if (!token) {
    throw new Error(
      "Falta SKETCHFAB_API_TOKEN en .env para descargar. Puedes abrir el modelo en Sketchfab, bajar el .glb y subirlo aquí.",
    );
  }

  const response = await fetch(
    `https://api.sketchfab.com/v3/models/${uid}/download`,
    {
      headers: {
        Authorization: `Token ${token}`,
        Accept: "application/json",
      },
    },
  );

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    if (response.status === 401 || response.status === 403) {
      throw new Error(
        "Sketchfab no autorizó la descarga. Revisa el token o descarga el .glb a mano y súbelo.",
      );
    }
    throw new Error(
      `No se pudo pedir la descarga (${response.status}). ${detail.slice(0, 120)}`,
    );
  }

  const payload = (await response.json()) as {
    glb?: { url?: string };
    gltf?: { url?: string };
  };

  const fileUrl = payload.glb?.url ?? payload.gltf?.url;
  if (!fileUrl) {
    throw new Error(
      "Sketchfab no devolvió archivo descargable. Ábrelo en la web y súbelo como .glb.",
    );
  }

  const fileRes = await fetch(fileUrl);
  if (!fileRes.ok) {
    throw new Error("Falló la descarga del archivo desde Sketchfab.");
  }

  const bytes = Buffer.from(await fileRes.arrayBuffer());
  const contentType =
    fileRes.headers.get("content-type") ??
    (payload.glb?.url ? "model/gltf-binary" : "application/zip");

  return { bytes, contentType };
}
