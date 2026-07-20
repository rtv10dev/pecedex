"use client";

import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";

interface FishModelViewerMvProps {
  modelUrl: string;
  fallbackPhotoUrl: string;
  alt: string;
  className?: string;
}

/**
 * En iOS/Android: iframe a debug-3d.html con <model-viewer>.
 * En http://IP el contexto no es seguro y Safari suele bloquear el 3D;
 * hace falta https (npm run dev:https).
 */
export function FishModelViewerMv({
  modelUrl,
  fallbackPhotoUrl,
  alt,
  className,
}: FishModelViewerMvProps) {
  const [iframeFailed, setIframeFailed] = useState(false);
  const [secure, setSecure] = useState(true);

  useEffect(() => {
    setSecure(window.isSecureContext);
  }, []);

  const debugUrl = useMemo(() => {
    const params = new URLSearchParams({
      src: modelUrl,
      poster: fallbackPhotoUrl,
    });
    return `/debug-3d.html?${params.toString()}`;
  }, [modelUrl, fallbackPhotoUrl]);

  const httpsHint =
    typeof window !== "undefined"
      ? `https://${window.location.hostname}:3000`
      : "https://192.168.1.50:3000";

  if (!secure) {
    return (
      <div
        className={cn(
          "flex h-full w-full flex-col items-center justify-center gap-3 bg-deep-teal/90 p-5 text-center",
          className,
        )}
      >
        <p className="text-base font-bold text-white">
          El 3D no funciona por http + IP
        </p>
        <p className="max-w-sm text-sm text-foam-white/90">
          En el móvil Safari solo trata como seguro{" "}
          <span className="font-semibold">localhost</span> o{" "}
          <span className="font-semibold">https</span>. Abre:
        </p>
        <p className="break-all rounded-2xl bg-ink/40 px-3 py-2 text-sm font-bold text-mango">
          {httpsHint}
        </p>
        <p className="text-xs text-foam-white/70">
          En el PC: <code className="text-white">npm run dev:https</code> y
          acepta el aviso del certificado.
        </p>
        <a
          href={debugUrl}
          className="rounded-full bg-shell px-4 py-2 text-xs font-bold text-deep-teal"
        >
          Ver diagnóstico
        </a>
      </div>
    );
  }

  if (iframeFailed) {
    return (
      <div
        className={cn(
          "flex h-full w-full flex-col items-center justify-center gap-3 bg-coral/20 p-4 text-center",
          className,
        )}
      >
        <p className="text-sm font-bold text-coral">
          No se pudo cargar el visor 3D (iframe).
        </p>
        <a
          href={debugUrl}
          className="rounded-full bg-deep-teal px-4 py-2 text-sm font-bold text-white"
        >
          Abrir página de debug 3D
        </a>
        <p className="break-all text-xs text-slate">{modelUrl}</p>
      </div>
    );
  }

  return (
    <div className={cn("relative h-full w-full bg-[#0284c7]", className)}>
      <iframe
        title={alt}
        src={debugUrl}
        className="absolute inset-0 h-full w-full border-0"
        allow="xr-spatial-tracking; fullscreen"
        onError={() => setIframeFailed(true)}
      />
      <a
        href={debugUrl}
        target="_blank"
        rel="noreferrer"
        className="absolute bottom-3 right-3 z-20 rounded-full bg-ink/80 px-3 py-1.5 text-[11px] font-bold text-white backdrop-blur-sm"
      >
        Debug 3D
      </a>
    </div>
  );
}
