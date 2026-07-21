"use client";

import { useEffect, useId, useState } from "react";
import Image from "next/image";
import { Expand, X } from "lucide-react";

interface FullPhotoButtonProps {
  src: string;
  alt: string;
}

/** Foto con botón para verla a tamaño completo (object-contain). */
export function FullPhotoButton({ src, alt }: FullPhotoButtonProps) {
  const [open, setOpen] = useState(false);
  const titleId = useId();

  useEffect(() => {
    if (!open) return;

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <div className="relative aspect-square">
        <Image
          src={src}
          alt={alt}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 100vw, 512px"
          priority
        />
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-deep-teal/85 px-3 py-2 text-xs font-bold text-white shadow-lg backdrop-blur-sm transition hover:bg-deep-teal active:scale-[0.98]"
          aria-label="Ver foto entera"
        >
          <Expand className="h-3.5 w-3.5" />
          Ver entera
        </button>
      </div>

      {open ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          className="fixed inset-0 z-[100] flex flex-col bg-deep-teal/95"
        >
          <div className="flex shrink-0 items-center justify-between gap-3 px-4 py-3">
            <p id={titleId} className="truncate text-sm font-bold text-white/90">
              Foto completa
            </p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/25"
              aria-label="Cerrar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <button
            type="button"
            className="relative min-h-0 flex-1 cursor-zoom-out"
            onClick={() => setOpen(false)}
            aria-label="Cerrar foto"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={alt}
              className="absolute inset-0 m-auto max-h-full max-w-full object-contain p-2"
            />
          </button>
        </div>
      ) : null}
    </>
  );
}
