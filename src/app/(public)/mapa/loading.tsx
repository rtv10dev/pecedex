import { Header } from "@/components/layout/Header";
import { MapSkeleton } from "@/components/ui/Skeleton";

export default function MapLoading() {
  return (
    <>
      <Header title="Mapa" subtitle="Cargando…" />
      <main className="relative mx-auto flex w-full max-w-lg flex-1 flex-col px-3 pb-2 pt-3">
        <MapSkeleton />
      </main>
    </>
  );
}
