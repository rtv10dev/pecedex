"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { OceanModelSpinner } from "@/components/fish/OceanModelSpinner";

interface FishModelViewerLazyProps {
  modelUrl: string;
  fallbackPhotoUrl: string;
  alt: string;
}

const FishModelViewer = dynamic(
  () =>
    import("@/components/fish/FishModelViewer").then(
      (mod) => mod.FishModelViewer,
    ),
  {
    ssr: false,
    loading: () => <OceanModelSpinner />,
  },
);

export function FishModelViewerLazy({
  modelUrl,
  fallbackPhotoUrl,
  alt,
}: FishModelViewerLazyProps) {
  const [secure, setSecure] = useState<boolean | null>(null);

  useEffect(() => {
    setSecure(window.isSecureContext);
  }, []);

  if (secure === null) {
    return (
      <div className="relative h-full w-full">
        <OceanModelSpinner />
      </div>
    );
  }

  if (!secure) {
    const httpsUrl =
      typeof window !== "undefined"
        ? `https://${window.location.hostname}:3000`
        : "https://192.168.1.50:3000";
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-deep-teal/90 p-5 text-center">
        <p className="text-base font-bold text-white">
          El 3D necesita HTTPS en el móvil
        </p>
        <p className="max-w-sm text-sm text-foam-white/90">
          Con <code className="text-white">http://</code> + IP Safari no carga
          el visor. Abre:
        </p>
        <p className="break-all rounded-2xl bg-ink/40 px-3 py-2 text-sm font-bold text-mango">
          {httpsUrl}
        </p>
        <p className="text-xs text-foam-white/70">
          En el PC: <code className="text-white">npm run dev:https</code>
        </p>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      <FishModelViewer
        modelUrl={modelUrl}
        fallbackPhotoUrl={fallbackPhotoUrl}
        alt={alt}
      />
    </div>
  );
}
