"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import type { Area } from "react-easy-crop";
import { Crop, LoaderCircle } from "lucide-react";
import { PhotoCropEditor } from "@/components/admin/PhotoCropEditor";
import { cropImageToFile } from "@/lib/client-crop";
import {
  updateSightingThumbAction,
  type UpdateThumbState,
} from "@/app/admin/sighting-actions";
import {
  updateMemoryThumbAction,
  type UpdateMemoryThumbState,
} from "@/app/admin/memory-actions";

type Kind = "sighting" | "memory";

interface EditGalleryThumbPanelProps {
  kind: Kind;
  id: string;
  photoUrl: string;
  previewTitle: string;
  previewSubtitle?: string;
  previewFooter?: string;
  stripeClassName?: string;
}

const sightingInitial: UpdateThumbState = {};
const memoryInitial: UpdateMemoryThumbState = {};

export function EditGalleryThumbPanel({
  kind,
  id,
  photoUrl,
  previewTitle,
  previewSubtitle,
  previewFooter,
  stripeClassName,
}: EditGalleryThumbPanelProps) {
  const [open, setOpen] = useState(false);
  const cropAreaRef = useRef<Area | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sightingState, sightingAction, sightingPending] = useActionState(
    updateSightingThumbAction,
    sightingInitial,
  );
  const [memoryState, memoryAction, memoryPending] = useActionState(
    updateMemoryThumbAction,
    memoryInitial,
  );

  const state = kind === "sighting" ? sightingState : memoryState;
  const actionPending = kind === "sighting" ? sightingPending : memoryPending;
  const [, startTransition] = useTransition();
  const [preparing, setPreparing] = useState(false);

  useEffect(() => {
    if (state.ok) {
      setOpen(false);
      setError(null);
    }
  }, [state.ok]);

  async function handleSave() {
    setError(null);
    if (!cropAreaRef.current) {
      setError("Ajusta el encuadre un momento y vuelve a guardar.");
      return;
    }

    setPreparing(true);
    try {
      const thumb = await cropImageToFile(photoUrl, cropAreaRef.current, {
        fileName: "thumb.jpg",
      });
      const fd = new FormData();
      if (kind === "sighting") {
        fd.set("sightingId", id);
        fd.set("thumb", thumb);
        startTransition(() => {
          sightingAction(fd);
        });
      } else {
        fd.set("memoryId", id);
        fd.set("thumb", thumb);
        startTransition(() => {
          memoryAction(fd);
        });
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo generar el encuadre.",
      );
    } finally {
      setPreparing(false);
    }
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-tang/25 bg-foam-white px-4 py-2.5 text-sm font-bold text-deep-teal transition hover:border-tang/50"
      >
        <Crop className="h-4 w-4" />
        {open ? "Cerrar encuadre" : "Editar encuadre de galería"}
      </button>

      {open ? (
        <div className="space-y-3 rounded-2xl border border-lagoon/20 bg-foam-white/80 p-3">
          <PhotoCropEditor
            key={photoUrl}
            imageSrc={photoUrl}
            onCropAreaChange={(area) => {
              cropAreaRef.current = area;
            }}
            preview={{
              title: previewTitle,
              subtitle: previewSubtitle,
              footer: previewFooter,
              stripeClassName,
            }}
          />

          {(error || state.error) && (
            <p
              role="alert"
              className="rounded-xl border border-coral/30 bg-coral/10 px-3 py-2 text-sm font-medium text-coral"
            >
              {error ?? state.error}
            </p>
          )}

          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={preparing || actionPending}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-tang px-4 py-3 text-sm font-bold text-white shadow-md disabled:opacity-60"
          >
            {preparing || actionPending ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : null}
            {preparing || actionPending ? "Guardando…" : "Guardar encuadre"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
