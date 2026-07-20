import Link from "next/link";
import type { Metadata } from "next";
import { MapPinned, Plus } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { MapViewLazy } from "@/components/map/MapViewLazy";
import { getMapLocations } from "@/lib/sightings";

export const metadata: Metadata = {
  title: "Mapa",
  description:
    "Mapa de avistamientos con clusters y spiderfy por ubicación.",
};

export default async function MapPage() {
  const locations = await getMapLocations();
  const totalSightings = locations.reduce((sum, loc) => sum + loc.count, 0);

  return (
    <>
      <Header
        title="Mapa"
        subtitle={
          locations.length > 0
            ? `${totalSightings} avistamiento${totalSightings === 1 ? "" : "s"} · ${locations.length} lugar${locations.length === 1 ? "" : "es"}`
            : "Vuestros avistamientos por ubicación"
        }
      />
      <main className="relative mx-auto flex w-full max-w-lg flex-1 flex-col px-3 pb-2 pt-3 sm:max-w-2xl md:max-w-3xl lg:max-w-5xl xl:max-w-6xl lg:px-4">
        {locations.length === 0 ? (
          <EmptyMap />
        ) : (
          <div className="relative h-[calc(100dvh-10.5rem)] min-h-[20rem] overflow-hidden rounded-3xl border-2 border-white/80 shadow-xl shadow-parrot/20 md:h-[calc(100dvh-11rem)] lg:rounded-[1.75rem]">
            <MapViewLazy locations={locations} />
          </div>
        )}
      </main>
    </>
  );
}

function EmptyMap() {
  return (
    <div className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center py-12">
      <div className="w-full overflow-hidden rounded-3xl border-2 border-white/80 bg-shell/90 text-center shadow-xl shadow-parrot/20 backdrop-blur-sm">
        <div className="rainbow-border h-1.5" />
        <div className="p-8">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-parrot/40 via-biolum/40 to-tang/40">
            <MapPinned className="h-8 w-8 text-deep-teal" />
          </div>
          <h2 className="text-lg font-bold text-ink">Sin ubicaciones aún</h2>
          <p className="mt-2 text-sm text-slate">
            Cuando registréis avistamientos con lugar, aparecerán aquí agrupados
            en el mapa.
          </p>
          <Link
            href="/admin/anadir"
            className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-tang px-4 py-2 text-sm font-bold text-white shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Registrar avistamiento
          </Link>
        </div>
      </div>
    </div>
  );
}
