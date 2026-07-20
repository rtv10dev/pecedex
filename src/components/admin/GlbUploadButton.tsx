"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Upload } from "lucide-react";
import {
  confirmBlobModelAction,
  uploadModel3dAction,
  type Model3dActionState,
} from "@/app/admin/model3d-actions";
import { uploadGlbToBlob } from "@/lib/client-model-upload";

type Props = {
  sightingId: string;
  disabled?: boolean;
  onResult?: (state: Model3dActionState) => void;
};

/**
 * Sube .glb directo a Blob en producción; en local sin Blob usa Server Action.
 */
export function GlbUploadButton({ sightingId, disabled, onResult }: Props) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    try {
      let state: Model3dActionState;
      try {
        const { pathname } = await uploadGlbToBlob(file);
        state = await confirmBlobModelAction(sightingId, pathname, file.name);
      } catch (clientError) {
        if (file.size > 4 * 1024 * 1024) {
          throw clientError;
        }
        const formData = new FormData();
        formData.set("sightingId", sightingId);
        formData.set("model", file);
        state = await uploadModel3dAction({}, formData);
      }
      onResult?.(state);
      if (state.success) {
        router.refresh();
      }
    } catch (error) {
      onResult?.({
        error:
          error instanceof Error
            ? error.message
            : "No se pudo subir el modelo.",
      });
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <>
      <input
        ref={fileRef}
        type="file"
        accept=".glb,model/gltf-binary"
        className="hidden"
        onChange={(event) => {
          void handleFile(event.currentTarget.files?.[0]);
        }}
      />
      <button
        type="button"
        disabled={disabled || busy}
        onClick={() => fileRef.current?.click()}
        className="inline-flex items-center gap-1.5 rounded-full bg-parrot/15 px-3 py-1.5 text-xs font-bold text-deep-teal disabled:opacity-60"
      >
        {busy ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Upload className="h-3.5 w-3.5" />
        )}
        Subir .glb
      </button>
    </>
  );
}
