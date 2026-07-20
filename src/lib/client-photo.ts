/** Comprime/normaliza a JPEG en el navegador (evita HEIC y el límite ~4.5 MB de Vercel). */
export async function normalizePhotoForUpload(
  file: File,
  options?: { maxEdge?: number; quality?: number },
): Promise<File> {
  const maxEdge = options?.maxEdge ?? 1600;
  const quality = options?.quality ?? 0.82;

  // Ya es un JPEG pequeño: no hace falta reprocesar
  if (
    (file.type === "image/jpeg" || file.type === "image/jpg") &&
    file.size <= 3.5 * 1024 * 1024
  ) {
    return file;
  }

  const bitmap = await createImageBitmap(file);
  try {
    const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("No se pudo preparar la imagen.");
    }
    ctx.drawImage(bitmap, 0, 0, width, height);

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (result) => {
          if (result) resolve(result);
          else reject(new Error("No se pudo convertir la imagen."));
        },
        "image/jpeg",
        quality,
      );
    });

    const base = file.name.replace(/\.[^.]+$/, "") || "foto";
    return new File([blob], `${base}.jpg`, { type: "image/jpeg" });
  } finally {
    bitmap.close();
  }
}
