"use client";

import { useEffect } from "react";
import { useGalleryStore } from "@/stores/galleryStore";

export function GalleryScrollMemory() {
  useEffect(() => {
    const savedY = useGalleryStore.getState().scrollY;

    const restore = () => {
      if (savedY > 0) {
        window.scrollTo({ top: savedY, left: 0, behavior: "auto" });
      }
    };

    restore();
    const frame = requestAnimationFrame(restore);
    const early = window.setTimeout(restore, 50);
    const late = window.setTimeout(restore, 200);

    const onScroll = () => {
      useGalleryStore.getState().setScrollY(window.scrollY);
    };

    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(early);
      window.clearTimeout(late);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return null;
}
