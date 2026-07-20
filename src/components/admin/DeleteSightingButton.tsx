"use client";

import { useActionState, useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import {
  deleteSightingAction,
  type DeleteSightingState,
} from "@/app/admin/sighting-actions";

interface DeleteSightingButtonProps {
  sightingId: string;
  commonName: string;
}

const initial: DeleteSightingState = {};

/** Borrado de avistamiento (solo admin), con confirmación. */
export function DeleteSightingButton({
  sightingId,
  commonName,
}: DeleteSightingButtonProps) {
  const [confirming, setConfirming] = useState(false);
  const [state, action, pending] = useActionState(
    deleteSightingAction,
    initial,
  );

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-coral/10 px-4 py-2.5 text-sm font-bold text-coral transition active:scale-[0.98]"
      >
        <Trash2 className="h-4 w-4" />
        Borrar avistamiento
      </button>
    );
  }

  return (
    <div className="space-y-3 rounded-2xl border border-coral/25 bg-coral/5 p-3">
      <p className="text-sm font-semibold text-ink">
        ¿Borrar «{commonName}»? Se elimina la ficha, la foto y el modelo 3D de
        este avistamiento. No se puede deshacer.
      </p>
      <div className="flex flex-wrap gap-2">
        <form action={action}>
          <input type="hidden" name="sightingId" value={sightingId} />
          <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center gap-1.5 rounded-full bg-coral px-3 py-1.5 text-xs font-bold text-white disabled:opacity-60"
          >
            {pending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Trash2 className="h-3.5 w-3.5" />
            )}
            Sí, borrar
          </button>
        </form>
        <button
          type="button"
          disabled={pending}
          onClick={() => setConfirming(false)}
          className="rounded-full bg-shell px-3 py-1.5 text-xs font-bold text-mist disabled:opacity-60"
        >
          Cancelar
        </button>
      </div>
      {state.error ? (
        <p className="text-xs font-semibold text-coral">{state.error}</p>
      ) : null}
    </div>
  );
}
