import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { FishOff, Plus } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { SortControls } from "@/components/gallery/SortControls";
import { FishCard } from "@/components/gallery/FishCard";
import { GalleryScrollMemory } from "@/components/gallery/GalleryScrollMemory";
import { getSightings } from "@/lib/sightings";
import { REEF_TITLE, type SortBy } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Galería",
  description: "Colección de peces avistados, ordenados por registro o ubicación.",
};

interface GalleryPageProps {
  searchParams: Promise<{ orden?: string }>;
}

export default async function GalleryPage({ searchParams }: GalleryPageProps) {
  const params = await searchParams;
  const sortBy: SortBy =
    params.orden === "location" ? "location" : "registeredAt";
  const sightings = await getSightings(sortBy);

  return (
    <>
      <Header
        title={REEF_TITLE}
        subtitle={
          sightings.length > 0
            ? `${sightings.length} avistamiento${sightings.length === 1 ? "" : "s"}`
            : "Empieza vuestra colección"
        }
      />
      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-4">
        <GalleryScrollMemory />
        <Suspense fallback={<div className="h-10" />}>
          <SortControls />
        </Suspense>

        {sightings.length === 0 ? (
          <EmptyGallery />
        ) : (
          <ul className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {sightings.map((sighting, index) => (
              <li
                key={sighting.id}
                className="fish-card-float"
                style={{ animationDelay: `${index * 0.15}s` }}
              >
                <FishCard sighting={sighting} index={index} />
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  );
}

function EmptyGallery() {
  return (
    <div className="mt-8 overflow-hidden rounded-3xl border-2 border-white/80 bg-shell/90 text-center shadow-xl shadow-clownfish/20 backdrop-blur-sm">
      <div className="rainbow-border h-1.5" />
      <div className="p-8">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-coral/30 via-clownfish/30 to-mango/30">
          <FishOff className="h-8 w-8 text-coral" />
        </div>
        <h2 className="text-lg font-bold text-ink">Aún no habéis registrado ningún pez</h2>
        <p className="mt-2 text-sm text-slate">
          Cuando registréis el primer avistamiento, aparecerá aquí con su foto y
          ubicación.
        </p>
        <Link
          href="/admin/anadir"
          className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-tang px-4 py-2 text-sm font-bold text-white shadow-sm"
        >
          <Plus className="h-4 w-4" />
          Añadir el primero
        </Link>
      </div>
    </div>
  );
}
