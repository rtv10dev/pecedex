"use client";

import { useActionState, useRef, useState, useTransition } from "react";
import type { Area } from "react-easy-crop";
import { Camera, LoaderCircle } from "lucide-react";
import {
  createMemoryAction,
  type CreateMemoryState,
} from "@/app/admin/memory-actions";
import { PhotoCropEditor } from "@/components/admin/PhotoCropEditor";
import { cropImageToFile } from "@/lib/client-crop";
import { normalizePhotoForUpload } from "@/lib/client-photo";

const initial: CreateMemoryState = {};

export function AddMemoryForm() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cropAreaRef = useRef<Area | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [hasPhoto, setHasPhoto] = useState(false);
  const [description, setDescription] = useState("");
  const [cropError, setCropError] = useState<string | null>(null);
  const [preparingCrop, setPreparingCrop] = useState(false);
  const [, startTransition] = useTransition();
  const [state, action, pending] = useActionState(createMemoryAction, initial);

  async function onPhotoChange(file: File | null) {
    if (previewUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }
    cropAreaRef.current = null;
    setCropError(null);
    if (!file) {
      setHasPhoto(false);
      setPreviewUrl(null);
      return;
    }
    try {
      const normalized = await normalizePhotoForUpload(file, {
        maxEdge: 1600,
        quality: 0.82,
      });
      const transfer = new DataTransfer();
      transfer.items.add(normalized);
      if (fileInputRef.current) {
        fileInputRef.current.files = transfer.files;
      }
      setHasPhoto(true);
      setPreviewUrl(URL.createObjectURL(normalized));
    } catch {
      setHasPhoto(false);
      setPreviewUrl(null);
      setCropError("No se pudo leer esa foto. Prueba con otra (JPEG/PNG).");
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCropError(null);
    const form = event.currentTarget;
    const formData = new FormData(form);

    void (async () => {
      setPreparingCrop(true);
      try {
        if (previewUrl && cropAreaRef.current) {
          const thumb = await cropImageToFile(previewUrl, cropAreaRef.current, {
            fileName: "thumb.jpg",
          });
          formData.set("thumb", thumb);
        }
        startTransition(() => {
          action(formData);
        });
      } catch (error) {
        setCropError(
          error instanceof Error
            ? error.message
            : "No se pudo preparar el encuadre.",
        );
      } finally {
        setPreparingCrop(false);
      }
    })();
  }

  const busy = pending || preparingCrop;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <section className="overflow-hidden rounded-3xl border-2 border-white/80 bg-shell/95 shadow-xl shadow-anemone/15">
        <div className="h-1.5 bg-gradient-to-r from-anemone via-coral to-clownfish" />
        <div className="space-y-3 p-4">
          <h2 className="font-bold text-ink">Foto</h2>

          <input
            ref={fileInputRef}
            type="file"
            name="photo"
            accept="image/*"
            capture="environment"
            className="sr-only"
            onChange={(e) => {
              void onPhotoChange(e.target.files?.[0] ?? null);
            }}
            required
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={busy}
            className="relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-anemone/35 bg-foam-white text-mist transition hover:border-anemone/60 disabled:opacity-60"
          >
            {previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewUrl}
                alt="Vista previa"
                className="absolute inset-0 h-full w-full object-cover opacity-40"
              />
            ) : null}
            <span className="relative z-10 flex flex-col items-center gap-2 px-4 text-center">
              <Camera className="h-8 w-8 text-anemone" />
              <span className="text-sm font-semibold text-slate">
                {hasPhoto ? "Cambiar foto" : "Elige o haz una foto"}
              </span>
            </span>
          </button>

          {previewUrl ? (
            <PhotoCropEditor
              key={previewUrl}
              imageSrc={previewUrl}
              onCropAreaChange={(area) => {
                cropAreaRef.current = area;
              }}
              preview={{
                title: description || "Nuevo recuerdo",
                stripeClassName: "from-anemone via-coral to-clownfish",
              }}
            />
          ) : null}
        </div>
      </section>

      <section className="overflow-hidden rounded-3xl border-2 border-white/80 bg-shell/95 shadow-xl shadow-coral/10">
        <div className="h-1.5 bg-gradient-to-r from-coral via-clownfish to-mango" />
        <div className="space-y-3 p-4">
          <h2 className="font-bold text-ink">Recuerdo</h2>

          <label className="block">
            <span className="mb-1.5 block text-sm font-bold text-ink">
              Descripción
            </span>
            <textarea
              name="description"
              rows={3}
              maxLength={500}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ese día en la playa…"
              disabled={busy}
              className="w-full rounded-2xl border-2 border-coral/15 bg-foam-white px-4 py-3 text-ink placeholder:text-mist focus:border-coral focus:outline-none focus:ring-2 focus:ring-coral/25 disabled:opacity-60"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-bold text-ink">
              Fecha (opcional)
            </span>
            <input
              type="date"
              name="takenAt"
              disabled={busy}
              className="w-full rounded-2xl border-2 border-coral/15 bg-foam-white px-4 py-3 text-ink focus:border-coral focus:outline-none focus:ring-2 focus:ring-coral/25 disabled:opacity-60"
            />
          </label>
        </div>
      </section>

      {state.error || cropError ? (
        <p
          role="alert"
          className="rounded-2xl border border-coral/30 bg-coral/10 px-3 py-2 text-sm font-medium text-coral"
        >
          {cropError ?? state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={busy || !hasPhoto}
        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-anemone via-coral to-clownfish px-4 py-3.5 font-bold text-white shadow-lg shadow-coral/30 transition active:scale-[0.99] disabled:opacity-60"
      >
        {busy ? <LoaderCircle className="h-5 w-5 animate-spin" /> : null}
        {busy ? "Guardando…" : "Guardar recuerdo"}
      </button>
    </form>
  );
}
