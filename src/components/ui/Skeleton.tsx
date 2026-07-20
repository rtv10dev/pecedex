import { cn } from "@/lib/utils";

export function Skeleton({
  className,
}: {
  className?: string;
}) {
  return (
    <div
      aria-hidden
      className={cn(
        "animate-pulse rounded-2xl bg-gradient-to-r from-lagoon/20 via-foam-white to-parrot/15",
        className,
      )}
    />
  );
}

export function GallerySkeleton() {
  return (
    <div className="mt-4 space-y-4" aria-busy="true" aria-label="Cargando galería">
      <Skeleton className="h-10 w-full rounded-full" />
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <li key={index} className="overflow-hidden rounded-3xl border-2 border-white/70 bg-shell/80">
            <Skeleton className="h-2 w-full rounded-none" />
            <Skeleton className="aspect-[4/3] w-full rounded-none" />
            <div className="space-y-2 p-4">
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function MapSkeleton() {
  return (
    <div
      className="relative h-[calc(100dvh-10.5rem)] overflow-hidden rounded-3xl border-2 border-white/80"
      aria-busy="true"
      aria-label="Cargando mapa"
    >
      <Skeleton className="h-full w-full rounded-3xl" />
      <p className="absolute inset-x-0 bottom-6 text-center text-sm font-bold text-deep-teal">
        Preparando el mapa…
      </p>
    </div>
  );
}

export function FishDetailSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Cargando ficha">
      <Skeleton className="h-9 w-40 rounded-full" />
      <div className="overflow-hidden rounded-3xl border-2 border-white/80 bg-shell">
        <Skeleton className="h-1.5 w-full rounded-none" />
        <Skeleton className="aspect-square w-full rounded-none" />
        <div className="space-y-3 p-5">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    </div>
  );
}
