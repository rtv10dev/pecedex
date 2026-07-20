import { Header } from "@/components/layout/Header";
import { GallerySkeleton } from "@/components/ui/Skeleton";
import { REEF_TITLE } from "@/lib/constants";

export default function PublicLoading() {
  return (
    <>
      <Header title={REEF_TITLE} subtitle="Cargando…" />
      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-4">
        <GallerySkeleton />
      </main>
    </>
  );
}
