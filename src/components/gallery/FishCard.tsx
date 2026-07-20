"use client";

import Link from "next/link";
import Image from "next/image";
import { MapPin } from "lucide-react";
import type { SightingListItem } from "@/lib/sightings";
import { cn } from "@/lib/utils";
import { useGalleryStore } from "@/stores/galleryStore";

const STRIPE_STYLES = [
  "from-coral via-clownfish to-mango",
  "from-parrot via-biolum to-lagoon",
  "from-tang via-anemone to-coral",
  "from-clownfish via-mango to-parrot",
  "from-anemone via-tang to-biolum",
] as const;

const PIN_COLORS = [
  "text-coral",
  "text-tang",
  "text-parrot",
  "text-clownfish",
  "text-anemone",
] as const;

interface FishCardProps {
  sighting: SightingListItem;
  index?: number;
  className?: string;
}

export function FishCard({ sighting, index = 0, className }: FishCardProps) {
  const stripe = STRIPE_STYLES[index % STRIPE_STYLES.length];
  const pinColor = PIN_COLORS[index % PIN_COLORS.length];

  return (
    <Link
      href={`/pez/${sighting.id}?from=galeria`}
      onClick={() => {
        useGalleryStore.getState().setScrollY(window.scrollY);
      }}
      className={cn(
        "group block overflow-hidden rounded-3xl border-2 border-white/80 bg-shell shadow-[0_8px_28px_rgba(14,165,233,0.28)] transition-all active:scale-[0.98] hover:-translate-y-1 hover:shadow-[0_12px_36px_rgba(251,146,60,0.35)]",
        className,
      )}
    >
      <div className={cn("h-2 bg-gradient-to-r", stripe)} />
      <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-lagoon/20 via-anemone/10 to-clownfish/20">
        <div className="fish-card-sway absolute inset-[-8%]">
          <Image
            src={sighting.photoThumbUrl}
            alt={sighting.species.commonName}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, 50vw"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-deep-teal/25 via-transparent to-white/10" />
        {sighting.model3dStatus === "PROCESSING" ? (
          <span className="absolute left-2 top-2 rounded-full bg-clownfish/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm">
            Generando…
          </span>
        ) : sighting.displayMode === "MODEL_3D" &&
          sighting.model3dStatus === "READY" ? (
          <span className="absolute left-2 top-2 rounded-full bg-deep-teal/85 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm">
            3D
          </span>
        ) : null}
      </div>
      <div className="bg-gradient-to-br from-shell to-foam-white p-4">
        <h3 className="font-bold text-ink">{sighting.species.commonName}</h3>
        <p className="mt-0.5 text-xs italic text-mist">
          {sighting.species.scientificName}
        </p>
        <p className="mt-2 flex items-center gap-1.5 text-sm font-medium text-slate">
          <MapPin className={cn("h-3.5 w-3.5 shrink-0", pinColor)} />
          <span className="truncate">{sighting.location.label}</span>
        </p>
      </div>
    </Link>
  );
}
