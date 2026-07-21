"use client";

import Link from "next/link";
import Image from "next/image";
import type { MemoryListItem } from "@/lib/memories";
import { cn } from "@/lib/utils";

const STRIPE_STYLES = [
  "from-anemone via-coral to-clownfish",
  "from-tang via-lagoon to-biolum",
  "from-parrot via-mango to-coral",
  "from-clownfish via-anemone to-tang",
] as const;

interface MemoryCardProps {
  memory: MemoryListItem;
  index?: number;
  className?: string;
}

export function MemoryCard({ memory, index = 0, className }: MemoryCardProps) {
  const stripe = STRIPE_STYLES[index % STRIPE_STYLES.length];
  const dateLabel = memory.takenAt ?? memory.createdAt;

  return (
    <Link
      href={`/recuerdo/${memory.id}`}
      className={cn(
        "group flex h-full flex-col overflow-hidden rounded-3xl border-2 border-white/80 bg-shell shadow-[0_8px_28px_rgba(244,114,182,0.22)] transition-all active:scale-[0.98] hover:-translate-y-1 hover:shadow-[0_12px_36px_rgba(251,113,133,0.3)]",
        className,
      )}
    >
      <div className={cn("h-2 shrink-0 bg-gradient-to-r", stripe)} />
      <div className="relative aspect-[4/3] shrink-0 overflow-hidden bg-gradient-to-br from-anemone/15 via-coral/10 to-clownfish/15">
        <Image
          src={memory.photoThumbUrl}
          alt={memory.description}
          fill
          className="object-cover transition duration-500 group-hover:scale-[1.03]"
          sizes="(max-width: 640px) 100vw, 50vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-deep-teal/35 via-transparent to-white/10" />
      </div>
      <div className="flex min-h-[4.5rem] flex-1 flex-col bg-gradient-to-br from-shell to-foam-white p-4">
        <p className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold leading-snug text-ink">
          {memory.description}
        </p>
        <p className="mt-auto pt-2 text-xs font-medium text-mist">
          {dateLabel.toLocaleDateString("es-ES", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>
      </div>
    </Link>
  );
}
