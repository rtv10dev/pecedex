"use client";

import { useActionState, useState } from "react";
import { Box, Loader2, Search, Trash2 } from "lucide-react";
import {
  attachCandidateAction,
  clearModel3dAction,
  searchFreeModelsAction,
  type Model3dActionState,
  type SearchModelsState,
} from "@/app/admin/model3d-actions";
import { GlbUploadButton } from "@/components/admin/GlbUploadButton";
import { ModelCandidatePicker } from "@/components/admin/ModelCandidatePicker";

interface Model3dAdminPanelProps {
  sightingId: string;
  model3dStatus: "PENDING" | "PROCESSING" | "READY" | "FAILED";
  model3dSource: string | null;
  scientificName: string;
  commonName: string;
}

const initialAction: Model3dActionState = {};
const initialSearch: SearchModelsState = {};

function statusLabel(
  status: Model3dAdminPanelProps["model3dStatus"],
): string {
  switch (status) {
    case "READY":
      return "Modelo 3D listo";
    case "PROCESSING":
      return "Procesando modelo…";
    case "FAILED":
      return "Falló el último intento";
    default:
      return "Sin modelo (foto fija)";
  }
}

export function Model3dAdminPanel({
  sightingId,
  model3dStatus,
  model3dSource,
  scientificName,
  commonName,
}: Model3dAdminPanelProps) {
  const [uploadState, setUploadState] = useState<Model3dActionState>({});
  const [searchState, searchAction, searchPending] = useActionState(
    searchFreeModelsAction,
    initialSearch,
  );
  const [attachState, attachAction, attachPending] = useActionState(
    attachCandidateAction,
    initialAction,
  );
  const [clearState, clearAction, clearPending] = useActionState(
    clearModel3dAction,
    initialAction,
  );

  const pending = searchPending || attachPending || clearPending;

  const message =
    attachState.success ||
    attachState.error ||
    uploadState.success ||
    uploadState.error ||
    clearState.success ||
    clearState.error ||
    searchState.error;

  const isError = Boolean(
    attachState.error ||
      uploadState.error ||
      clearState.error ||
      searchState.error,
  );

  const candidates = searchState.candidates ?? [];

  return (
    <section className="mt-4 overflow-hidden rounded-3xl border-2 border-white/80 bg-shell/95 shadow-xl shadow-parrot/10">
      <div className="rainbow-border h-1.5" />
      <div className="space-y-3 p-4">
        <div className="flex items-start gap-2">
          <Box className="mt-0.5 h-4 w-4 text-tang" />
          <div>
            <h2 className="font-bold text-ink">Modelo 3D (admin)</h2>
            <p className="text-xs text-mist">
              {model3dSource?.startsWith("curated")
                ? "Sin modelo (foto fija)"
                : statusLabel(model3dStatus)}
              {model3dSource && !model3dSource.startsWith("curated")
                ? ` · ${model3dSource}`
                : ""}
            </p>
            <p className="mt-0.5 text-xs italic text-mist">
              {commonName} · {scientificName}
            </p>
          </div>
        </div>

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
              Buscar modelos gratis
            </button>
          </form>

          <GlbUploadButton
            sightingId={sightingId}
            disabled={pending}
            onResult={setUploadState}
          />

          {model3dStatus === "READY" ? (
            <form action={clearAction}>
              <input type="hidden" name="sightingId" value={sightingId} />
              <button
                type="submit"
                disabled={pending}
                className="inline-flex items-center gap-1.5 rounded-full bg-coral/10 px-3 py-1.5 text-xs font-bold text-coral disabled:opacity-60"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Quitar modelo
              </button>
            </form>
          ) : null}
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
              isError ? "text-coral" : "text-deep-teal"
            }`}
          >
            {message}
          </p>
        ) : (
          <p className="text-xs text-mist">
            Busca, pasa entre opciones con las flechas y confirma. Si ninguno
            encaja, sube un .glb.
          </p>
        )}
      </div>
    </section>
  );
}
