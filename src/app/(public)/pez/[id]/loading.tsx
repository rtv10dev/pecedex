import { Header } from "@/components/layout/Header";
import { FishDetailSkeleton } from "@/components/ui/Skeleton";

export default function FishDetailLoading() {
  return (
    <>
      <Header title="Avistamiento" subtitle="Cargando…" />
      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-4">
        <FishDetailSkeleton />
      </main>
    </>
  );
}
