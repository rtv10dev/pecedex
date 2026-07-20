"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Loader2,
} from "lucide-react";
import type { ModelCandidate } from "@/lib/model3d/search";

const ModelGlbThumb = dynamic(
  () =>
    import("@/components/admin/ModelGlbThumb").then((mod) => mod.ModelGlbThumb),
  {
    ssr: false,
    loading: () => (
      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-sky-600 to-cyan-800 text-xs font-bold text-white/80">
        Cargando modelo…
      </div>
    ),
  },
);

function sourceBadge(source: ModelCandidate["source"]): string {
  switch (source) {
    case "sketchfab":
      return "Sketchfab";
    case "curated":
      return "Catálogo";
    case "species_reuse":
      return "Tu colección";
  }
}

function candidateModelUrl(candidate: ModelCandidate): string | null {
  return candidate.reuseUrl || candidate.curatedUrl || null;
}

interface ModelCandidatePickerProps {
  sightingId: string;
  candidates: ModelCandidate[];
  pending?: boolean;
  attachPending?: boolean;
  onAttach: (formData: FormData) => void;
}

/** Selector de candidatos 3D: una opción a la vez, con flechas para pasar. */
export function ModelCandidatePicker({
  sightingId,
  candidates,
  pending,
  attachPending,
  onAttach,
}: ModelCandidatePickerProps) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
  }, [candidates]);

  if (candidates.length === 0) return null;

  const safeIndex = Math.min(index, candidates.length - 1);
  const candidate = candidates[safeIndex];
  const total = candidates.length;
  const canPrev = safeIndex > 0;
  const canNext = safeIndex < total - 1;
  const localModelUrl = candidateModelUrl(candidate);

  return (
    <div className="overflow-hidden rounded-2xl border border-tang/15 bg-white/80">
      <div className="relative aspect-[16/10] bg-gradient-to-br from-lagoon/20 to-tang/10">
        {localModelUrl ? (
          <ModelGlbThumb key={localModelUrl} modelUrl={localModelUrl} />
        ) : candidate.thumbUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={candidate.thumbUrl}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs font-bold text-mist">
            Sin miniatura
          </div>
        )}

        <span className="absolute left-2 top-2 z-10 rounded-full bg-deep-teal/85 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
          {sourceBadge(candidate.source)}
        </span>

        <span className="absolute right-2 top-2 z-10 rounded-full bg-shell/90 px-2 py-0.5 text-[10px] font-bold text-deep-teal backdrop-blur-sm">
          {safeIndex + 1} / {total}
        </span>

        {total > 1 ? (
          <>
            <button
              type="button"
              disabled={!canPrev || pending}
              onClick={() => setIndex((i) => Math.max(0, i - 1))}
              className="absolute left-2 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-shell/90 text-deep-teal shadow-md backdrop-blur-sm disabled:opacity-35"
              aria-label="Modelo anterior"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              disabled={!canNext || pending}
              onClick={() => setIndex((i) => Math.min(total - 1, i + 1))}
              className="absolute right-2 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-shell/90 text-deep-teal shadow-md backdrop-blur-sm disabled:opacity-35"
              aria-label="Siguiente modelo"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        ) : null}
      </div>

      <div className="space-y-3 p-3">
        <div>
          <p className="line-clamp-2 text-sm font-bold text-ink">
            {candidate.title}
          </p>
          <p className="text-[11px] text-mist">
            {candidate.author}
            {candidate.license ? ` · ${candidate.license}` : ""}
          </p>
        </div>

        {total > 1 ? (
          <div className="flex items-center justify-center gap-1.5">
            {candidates.map((item, i) => (
              <button
                key={item.id}
                type="button"
                disabled={pending}
                onClick={() => setIndex(i)}
                aria-label={`Ver opción ${i + 1}`}
                aria-current={i === safeIndex}
                className={`h-2 rounded-full transition-all ${
                  i === safeIndex
                    ? "w-5 bg-tang"
                    : "w-2 bg-tang/25 hover:bg-tang/45"
                }`}
              />
            ))}
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-2">
          <form action={onAttach}>
            <input type="hidden" name="sightingId" value={sightingId} />
            <input type="hidden" name="source" value={candidate.source} />
            <input type="hidden" name="title" value={candidate.title} />
            {candidate.sketchfabUid ? (
              <input
                type="hidden"
                name="sketchfabUid"
                value={candidate.sketchfabUid}
              />
            ) : null}
            {candidate.curatedUrl ? (
              <input
                type="hidden"
                name="curatedUrl"
                value={candidate.curatedUrl}
              />
            ) : null}
            {candidate.reuseUrl ? (
              <input
                type="hidden"
                name="reuseUrl"
                value={candidate.reuseUrl}
              />
            ) : null}
            <button
              type="submit"
              disabled={pending}
              className="rounded-full bg-tang px-3 py-1.5 text-xs font-bold text-white disabled:opacity-60"
            >
              {attachPending ? (
                <Loader2 className="inline h-3.5 w-3.5 animate-spin" />
              ) : (
                "Usar este"
              )}
            </button>
          </form>

          {candidate.viewerUrl && candidate.source === "sketchfab" ? (
            <a
              href={candidate.viewerUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 rounded-full bg-shell px-3 py-1.5 text-xs font-bold text-deep-teal"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Ver en Sketchfab
            </a>
          ) : null}

          {total > 1 ? (
            <div className="ml-auto flex gap-1">
              <button
                type="button"
                disabled={!canPrev || pending}
                onClick={() => setIndex((i) => Math.max(0, i - 1))}
                className="rounded-full bg-shell px-2.5 py-1.5 text-[11px] font-bold text-deep-teal disabled:opacity-40"
              >
                Anterior
              </button>
              <button
                type="button"
                disabled={!canNext || pending}
                onClick={() => setIndex((i) => Math.min(total - 1, i + 1))}
                className="rounded-full bg-shell px-2.5 py-1.5 text-[11px] font-bold text-deep-teal disabled:opacity-40"
              >
                Siguiente
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
