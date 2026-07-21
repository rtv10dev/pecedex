import type { Area } from "react-easy-crop";

export const GALLERY_CROP_ASPECT = 4 / 3;

/** Redondea el área igual en preview y al guardar (sin re-recortar). */
export function normalizeGalleryCropArea(area: Area): Area {
  return {
    x: Math.max(0, Math.round(area.x)),
    y: Math.max(0, Math.round(area.y)),
    width: Math.max(1, Math.round(area.width)),
    height: Math.max(1, Math.round(area.height)),
  };
}

/** Recorta la imagen en el navegador (área de react-easy-crop) → JPEG File. */
export async function cropImageToFile(
  imageSrc: string,
  area: Area,
  options?: { fileName?: string; mimeType?: string; quality?: number },
): Promise<File> {
  const mimeType = options?.mimeType ?? "image/jpeg";
  const quality = options?.quality ?? 0.92;
  const fileName = options?.fileName ?? "thumb.jpg";
  const crop = normalizeGalleryCropArea(area);

  const image = await loadImage(imageSrc);
  const canvas = document.createElement("canvas");
  canvas.width = crop.width;
  canvas.height = crop.height;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("No se pudo preparar el encuadre.");
  }

  ctx.drawImage(
    image,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    crop.width,
    crop.height,
  );

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => {
        if (result) resolve(result);
        else reject(new Error("No se pudo generar la miniatura."));
      },
      mimeType,
      quality,
    );
  });

  return new File([blob], fileName, { type: mimeType });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", () =>
      reject(new Error("No se pudo cargar la imagen para encuadrar.")),
    );
    if (!src.startsWith("blob:") && !src.startsWith("data:")) {
      image.crossOrigin = "anonymous";
    }
    image.src = src;
  });
}
