import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { SortBy } from "@/lib/constants";

interface GalleryState {
  sortBy: SortBy;
  scrollY: number;
  setSortBy: (sortBy: SortBy) => void;
  setScrollY: (scrollY: number) => void;
}

export const useGalleryStore = create<GalleryState>()(
  persist(
    (set) => ({
      sortBy: "registeredAt",
      scrollY: 0,
      setSortBy: (sortBy) => set({ sortBy }),
      setScrollY: (scrollY) => set({ scrollY }),
    }),
    {
      name: "pecedex-gallery",
      partialize: (state) => ({ sortBy: state.sortBy }),
    },
  ),
);
