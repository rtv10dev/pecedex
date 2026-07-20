"use client";

import dynamic from "next/dynamic";

const LocationMapPicker = dynamic(
  () =>
    import("@/components/admin/LocationMapPicker").then(
      (mod) => mod.LocationMapPicker,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-64 w-full items-center justify-center rounded-2xl border-2 border-tang/20 bg-foam-white/80">
        <p className="text-sm font-semibold text-deep-teal">Cargando mapa…</p>
      </div>
    ),
  },
);

interface LocationMapPickerLazyProps {
  lat: number | null;
  lng: number | null;
  onPick: (coords: { lat: number; lng: number }) => void;
}

export function LocationMapPickerLazy(props: LocationMapPickerLazyProps) {
  return <LocationMapPicker {...props} />;
}
