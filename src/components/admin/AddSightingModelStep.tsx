"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Box, Loader2, Search } from "lucide-react";
import {
  attachCandidateAction,
  searchFreeModelsAction,
  type Model3dActionState,
  type SearchModelsState,
} from "@/app/admin/model3d-actions";
import { GlbUploadButton } from "@/components/admin/GlbUploadButton";
import { ModelCandidatePicker } from "@/components/admin/ModelCandidatePicker";

interface AddSightingModelStepProps {
  sightingId: string;
  commonName: string;
  scientificName: string;
  modelAlreadyReused: boolean;
}

const searchInitial: SearchModelsState = {};
const actionInitial: Model3dActionState = {};

export function AddSightingModelStep({
  sightingId,
  commonName,
  scientificName,
  modelAlreadyReused,
}: AddSightingModelStepProps) {
  const router = useRouter();
  const detailHref = `/pez/${sightingId}?from=galeria`;
  const [uploadState, setUploadState] = useState<Model3dActionState>({});

  const [searchState, searchAction, searchPending] = useActionState(
    searchFreeModelsAction,
    searchInitial,
  );
  const [attachState, attachAction, attachPending] = useActionState(
    attachCandidateAction,
    actionInitial,
  );

  const pending = searchPending || attachPending;
  const candidates = searchState.candidates ?? [];

  useEffect(() => {
    if (attachState.success || uploadState.success) {
      router.push(detailHref);
    }
  }, [attachState.success, uploadState.success, router, detailHref]);

  const message =
    attachState.error || uploadState.error || searchState.error;

  return (
    <section className="overflow-hidden rounded-3xl border-2 border-white/80 bg-shell/95 shadow-xl shadow-parrot/10">
      <div className="rainbow-border h-1.5" />
      <div className="space-y-4 p-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-tang">
            Paso opcional
          </p>
          <h2 className="text-lg font-bold text-ink">Modelo 3D</h2>
          <p className="mt-1 text-sm text-slate">
            {commonName} ya está guardado. ¿Buscas un modelo gratis ahora? Puedes
            hacerlo después en la ficha.
          </p>
          <p className="mt-0.5 text-xs italic text-mist">{scientificName}</p>
        </div>

        {modelAlreadyReused ? (
          <p className="rounded-2xl bg-parrot/15 px-3 py-2 text-xs font-semibold text-deep-teal">
            Ya reutilizamos un 3D de esta especie. Puedes ver la ficha o buscar
            otro modelo.
          </p>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <form action={searchAction}>
            <input type="hidden" name="sightingId" value={sightingId} />
            <button
              type="submit"
              disabled={pending}
              className="inline-flex items-center gap-1.5 rounded-full bg-tang px-3 py-1.5 text-xs font-bold text-white disabled:opacity-60"
            >
              {searchPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Search className="h-3.5 w-3.5" />
              )}
              Buscar ahora
            </button>
          </form>

          <GlbUploadButton
            sightingId={sightingId}
            disabled={pending}
            onResult={setUploadState}
          />

          <button
            type="button"
            disabled={pending}
            onClick={() => router.push(detailHref)}
            className="inline-flex items-center gap-1.5 rounded-full bg-shell px-3 py-1.5 text-xs font-bold text-mist disabled:opacity-60"
          >
            <Box className="h-3.5 w-3.5" />
            Ahora no
          </button>
        </div>

        {searchState.hint ? (
          <p className="rounded-2xl bg-foam-white/80 px-3 py-2 text-xs font-medium text-deep-teal">
            {searchState.hint}
          </p>
        ) : null}

        <ModelCandidatePicker
          sightingId={sightingId}
          candidates={candidates}
          pending={pending}
          attachPending={attachPending}
          onAttach={attachAction}
        />

        {message ? (
          <p
            className={`text-xs font-semibold ${
              attachState.error || uploadState.error || searchState.error
                ? "text-coral"
                : "text-deep-teal"
            }`}
          >
            {message}
          </p>
        ) : (
          <p className="text-xs text-mist">
            Pasa entre opciones con las flechas y confirma solo si la miniatura
            encaja con la especie.
          </p>
        )}
      </div>
    </section>
  );
}
