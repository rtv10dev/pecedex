"use client";

import { useCallback, useEffect, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import {
  GALLERY_CROP_ASPECT,
  normalizeGalleryCropArea,
  resolveImageSrcForCanvas,
} from "@/lib/client-crop";
import { cn } from "@/lib/utils";

export type GalleryPreviewMeta = {
  title: string;
  subtitle?: string;
  footer?: string;
  stripeClassName?: string;
};

interface PhotoCropEditorProps {
  imageSrc: string;
  onCropAreaChange: (area: Area) => void;
  preview?: GalleryPreviewMeta;
  className?: string;
}

const DEFAULT_STRIPE = "from-coral via-clownfish to-mango";

/**
 * Encuadre 4:3 (como la card de galería).
 * Default: centrado (crop 0,0 + zoom 1 de react-easy-crop).
 */
export function PhotoCropEditor({
  imageSrc,
  onCropAreaChange,
  preview,
  className,
}: PhotoCropEditorProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [resolvedSrc, setResolvedSrc] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    let revoke: (() => void) | undefined;
    setResolvedSrc(null);
    setLoadError(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);

    void resolveImageSrcForCanvas(imageSrc)
      .then((resolved) => {
        if (!alive) {
          resolved.revoke?.();
          return;
        }
        revoke = resolved.revoke;
        setResolvedSrc(resolved.src);
      })
      .catch((error) => {
        if (!alive) return;
        setLoadError(
          error instanceof Error
            ? error.message
            : "No se pudo cargar la imagen.",
        );
      });

    return () => {
      alive = false;
      revoke?.();
    };
  }, [imageSrc]);

  const onCropComplete = useCallback(
    (_croppedArea: Area, croppedAreaPixels: Area) => {
      onCropAreaChange(croppedAreaPixels);
      if (!resolvedSrc) return;
      void updatePreview(resolvedSrc, croppedAreaPixels).then(setPreviewUrl);
    },
    [resolvedSrc, onCropAreaChange],
  );

  return (
    <div className={cn("space-y-3", className)}>
      <div>
        <p className="text-sm font-bold text-ink">Encuadre para la galería</p>
        <p className="text-xs text-slate">
          Arrastra y haz zoom. Por defecto queda centrado.
        </p>
      </div>

      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-deep-teal/90">
        {resolvedSrc ? (
          <Cropper
            image={resolvedSrc}
            crop={crop}
            zoom={zoom}
            aspect={GALLERY_CROP_ASPECT}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
            showGrid={false}
            classes={{
              containerClassName: "rounded-2xl",
            }}
          />
        ) : (
          <div className="flex h-full items-center justify-center px-4 text-center text-sm font-medium text-white/80">
            {loadError ?? "Cargando imagen…"}
          </div>
        )}
      </div>

      <label className="block">
        <span className="mb-1 block text-xs font-semibold text-mist">Zoom</span>
        <input
          type="range"
          min={1}
          max={3}
          step={0.02}
          value={zoom}
          disabled={!resolvedSrc}
          onChange={(e) => setZoom(Number(e.target.value))}
          className="w-full accent-tang disabled:opacity-50"
        />
      </label>

      {preview ? (
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-mist">
            Así se verá en la galería
          </p>
          <div className="mx-auto max-w-[220px] overflow-hidden rounded-2xl border-2 border-white/80 bg-shell shadow-md shadow-lagoon/20">
            <div
              className={cn(
                "h-2 bg-gradient-to-r",
                preview.stripeClassName ?? DEFAULT_STRIPE,
              )}
            />
            <div className="relative aspect-[4/3] overflow-hidden bg-lagoon/20">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl ?? resolvedSrc ?? imageSrc}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-deep-teal/25 via-transparent to-white/10" />
            </div>
            <div className="space-y-0.5 p-2.5">
              <p className="line-clamp-2 text-xs font-bold leading-snug text-ink">
                {preview.title || "Sin nombre"}
              </p>
              {preview.subtitle ? (
                <p className="truncate text-[10px] italic text-mist">
                  {preview.subtitle}
                </p>
              ) : null}
              {preview.footer ? (
                <p className="truncate text-[10px] font-medium text-slate">
                  {preview.footer}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

async function updatePreview(imageSrc: string, area: Area): Promise<string> {
  const crop = normalizeGalleryCropArea(area);

  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("preview"));
    img.src = imageSrc;
  });

  const canvas = document.createElement("canvas");
  canvas.width = crop.width;
  canvas.height = crop.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return imageSrc;
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
  return canvas.toDataURL("image/jpeg", 0.92);
}
