import Image from "next/image";
import { FishModelViewerLazy } from "@/components/fish/FishModelViewerLazy";
import { hasDisplayableModel3d } from "@/lib/model3d/display";

interface FishHeroProps {
  displayMode: "PHOTO_ROTATOR" | "MODEL_3D";
  model3dUrl: string | null;
  model3dStatus: "PENDING" | "PROCESSING" | "READY" | "FAILED";
  model3dSource?: string | null;
  photoUrl: string;
  alt: string;
}

export function FishHero({
  displayMode,
  model3dUrl,
  model3dStatus,
  model3dSource,
  photoUrl,
  alt,
}: FishHeroProps) {
  const useModel = hasDisplayableModel3d({
    displayMode,
    model3dStatus,
    model3dUrl,
    model3dSource,
  });

  if (useModel && model3dUrl) {
    return (
      <FishModelViewerLazy
        modelUrl={model3dUrl}
        fallbackPhotoUrl={photoUrl}
        alt={alt}
      />
    );
  }

  return (
    <div className="relative h-full w-full">
      <Image
        src={photoUrl}
        alt={alt}
        fill
        className="object-cover"
        priority
        sizes="(max-width: 512px) 100vw, 512px"
      />
    </div>
  );
}
