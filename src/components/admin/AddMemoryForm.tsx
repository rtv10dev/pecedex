"use client";

import { useActionState, useRef, useState } from "react";
import Image from "next/image";
import { Camera, LoaderCircle } from "lucide-react";
import {
  createMemoryAction,
  type CreateMemoryState,
} from "@/app/admin/memory-actions";

const initial: CreateMemoryState = {};

export function AddMemoryForm() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [hasPhoto, setHasPhoto] = useState(false);
  const [state, action, pending] = useActionState(createMemoryAction, initial);

  return (
    <form action={action} className="space-y-4">
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
              const file = e.target.files?.[0];
              if (!file) {
                setHasPhoto(false);
                setPreviewUrl(null);
                return;
              }
              setHasPhoto(true);
              setPreviewUrl(URL.createObjectURL(file));
            }}
            required
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={pending}
            className="relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-anemone/35 bg-foam-white text-mist transition hover:border-anemone/60 disabled:opacity-60"
          >
            {previewUrl ? (
              <Image
                src={previewUrl}
                alt="Vista previa"
                fill
                unoptimized
                className="object-cover"
              />
            ) : (
              <span className="flex flex-col items-center gap-2 px-4 text-center">
                <Camera className="h-8 w-8 text-anemone" />
                <span className="text-sm font-semibold text-slate">
                  Elige o haz una foto
                </span>
              </span>
            )}
          </button>
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
              placeholder="Ese día en la playa…"
              disabled={pending}
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
              disabled={pending}
              className="w-full rounded-2xl border-2 border-coral/15 bg-foam-white px-4 py-3 text-ink focus:border-coral focus:outline-none focus:ring-2 focus:ring-coral/25 disabled:opacity-60"
            />
          </label>
        </div>
      </section>

      {state.error ? (
        <p
          role="alert"
          className="rounded-2xl border border-coral/30 bg-coral/10 px-3 py-2 text-sm font-medium text-coral"
        >
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending || !hasPhoto}
        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-anemone via-coral to-clownfish px-4 py-3.5 font-bold text-white shadow-lg shadow-coral/30 transition active:scale-[0.99] disabled:opacity-60"
      >
        {pending ? <LoaderCircle className="h-5 w-5 animate-spin" /> : null}
        {pending ? "Guardando…" : "Guardar recuerdo"}
      </button>
    </form>
  );
}
