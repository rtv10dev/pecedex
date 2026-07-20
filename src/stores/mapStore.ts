import { create } from "zustand";

export type MapCamera = {
  center: [number, number];
  zoom: number;
};

interface MapState {
  camera: MapCamera | null;
  spiderfyLocationId: string | null;
  /** Solo true al ir al detalle desde el mapa; al volver se restaura la cámara. */
  restoreOnNextVisit: boolean;
  setCamera: (camera: MapCamera) => void;
  setSpiderfyLocationId: (id: string | null) => void;
  markRestoreOnNextVisit: () => void;
  consumeRestoreOnNextVisit: () => boolean;
}

export const useMapStore = create<MapState>()((set, get) => ({
  camera: null,
  spiderfyLocationId: null,
  restoreOnNextVisit: false,
  setCamera: (camera) => set({ camera }),
  setSpiderfyLocationId: (spiderfyLocationId) => set({ spiderfyLocationId }),
  markRestoreOnNextVisit: () => set({ restoreOnNextVisit: true }),
  consumeRestoreOnNextVisit: () => {
    const shouldRestore = get().restoreOnNextVisit;
    if (shouldRestore) {
      set({ restoreOnNextVisit: false });
    }
    return shouldRestore;
  },
}));
