"use client";

import { Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";
import {
  Box3,
  TOUCH,
  Vector3,
  type Group,
  type Object3D,
  type PerspectiveCamera,
  type SkinnedMesh,
} from "three";
import { clone as cloneSkinned } from "three/addons/utils/SkeletonUtils.js";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { RotateCcw } from "lucide-react";
import { CanvasErrorBoundary } from "@/components/fish/CanvasErrorBoundary";
import { OceanModelSpinner } from "@/components/fish/OceanModelSpinner";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { cn } from "@/lib/utils";

interface FishModelViewerProps {
  modelUrl: string;
  fallbackPhotoUrl: string;
  alt: string;
  className?: string;
}

/** Tamaño objetivo del modelo en unidades del mundo (cualquier GLB se normaliza a esto). */
const TARGET_SIZE = 2.1;
/** Margen extra respecto al FOV. */
const FIT_MARGIN = 1.15;
const DEFAULT_FRAME_DISTANCE = 4.8;
/** Zoom out / zoom in relativos a la distancia de encuadre. */
const MAX_DISTANCE_FACTOR = 5;
const MIN_DISTANCE_FACTOR = 0.08;
const MIN_DIM = 1e-4;

function prepareSkinned(root: Object3D) {
  root.updateMatrixWorld(true);
  root.traverse((obj) => {
    const mesh = obj as SkinnedMesh;
    if (!mesh.isMesh) return;
    if (mesh.isSkinnedMesh) {
      mesh.skeleton?.update();
      mesh.computeBoundingBox();
      mesh.computeBoundingSphere();
    } else {
      mesh.geometry?.computeBoundingBox();
      mesh.geometry?.computeBoundingSphere();
    }
  });
  root.updateMatrixWorld(true);
}

/**
 * Bbox real de lo visible en mundo.
 * SkinnedMesh.computeBoundingBox() está en espacio local del mesh: hay que
 * aplicar matrixWorld (si no, tras escalar el padre la cámara cree que mide 40u).
 */
function visibleMeshesBox(root: Object3D): Box3 {
  const box = new Box3();
  root.updateMatrixWorld(true);
  root.traverse((obj) => {
    const mesh = obj as SkinnedMesh;
    if (!mesh.isMesh) return;

    if (mesh.isSkinnedMesh) {
      mesh.skeleton?.update();
      mesh.computeBoundingBox();
      if (mesh.boundingBox && !mesh.boundingBox.isEmpty()) {
        const meshBox = mesh.boundingBox.clone();
        meshBox.applyMatrix4(mesh.matrixWorld);
        box.union(meshBox);
      }
      return;
    }

    if (!mesh.geometry) return;
    if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox();
    if (!mesh.geometry.boundingBox) return;
    const meshBox = mesh.geometry.boundingBox.clone();
    meshBox.applyMatrix4(mesh.matrixWorld);
    box.union(meshBox);
  });

  if (box.isEmpty()) {
    return new Box3().setFromObject(root);
  }
  return box;
}

/** Distancia de cámara para que el AABB quepa en el FOV. */
function frameDistanceForBox(camera: PerspectiveCamera, box: Box3) {
  const size = box.getSize(new Vector3());
  const vFov = (camera.fov * Math.PI) / 180;
  const aspect = Math.max(camera.aspect || 1, 0.05);
  const halfH = Math.max(size.y, 0.01) / 2;
  const halfW = Math.max(size.x, 0.01) / 2;
  // Un poco de profundidad para peces alargados en Z
  const halfD = Math.max(size.z, 0.01) / 2;
  const distForHeight = halfH / Math.tan(vFov / 2);
  const distForWidth = halfW / (Math.tan(vFov / 2) * aspect);
  const distForDepth = (halfD * 0.55) / Math.tan(vFov / 2);
  return Math.max(distForHeight, distForWidth, distForDepth, 0.5) * FIT_MARGIN;
}

function applyOrbitFrame(
  orbit: OrbitControlsImpl,
  camera: PerspectiveCamera,
  distance: number,
  lookY: number,
) {
  // Límites holgados ANTES de colocar la cámara, si no update() la acerca.
  orbit.minDistance = 0.02;
  orbit.maxDistance = 500;
  orbit.target.set(0, 0, 0);
  camera.position.set(0, lookY, distance);
  camera.lookAt(0, 0, 0);
  orbit.update();

  orbit.minDistance = Math.max(distance * MIN_DISTANCE_FACTOR, 0.15);
  orbit.maxDistance = Math.max(distance * MAX_DISTANCE_FACTOR, distance + 6);
  orbit.update();
}

function FittedModel({
  modelUrl,
  fitToken,
  onReady,
}: {
  modelUrl: string;
  fitToken: number;
  onReady?: () => void;
}) {
  const { scene } = useGLTF(modelUrl);
  const clone = useMemo(() => {
    // clone() normal rompe SkinnedMesh; SkeletonUtils mantiene el skeleton.
    const next = cloneSkinned(scene);
    next.position.set(0, 0, 0);
    next.rotation.set(0, 0, 0);
    next.scale.set(1, 1, 1);
    next.traverse((obj) => {
      const mesh = obj as SkinnedMesh;
      if (mesh.isSkinnedMesh) {
        mesh.frustumCulled = false;
      }
    });
    return next;
  }, [scene]);
  const scaleRef = useRef<Group>(null);
  const centerRef = useRef<Group>(null);
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;
  const { camera, controls, size: viewSize, invalidate } = useThree();

  useLayoutEffect(() => {
    const scaleGroup = scaleRef.current;
    const centerGroup = centerRef.current;
    if (!scaleGroup || !centerGroup) return;

    let cancelled = false;
    let attempts = 0;
    let raf = 0;
    let timeoutId = 0;
    let announcedReady = false;

    const announceReady = () => {
      if (announcedReady || cancelled) return;
      announcedReady = true;
      onReadyRef.current?.();
    };

    const applyFit = () => {
      if (cancelled) return false;

      scaleGroup.position.set(0, 0, 0);
      scaleGroup.rotation.set(0, 0, 0);
      scaleGroup.scale.setScalar(1);
      centerGroup.position.set(0, 0, 0);
      centerGroup.rotation.set(0, 0, 0);
      centerGroup.scale.setScalar(1);

      prepareSkinned(scaleGroup);

      const box = visibleMeshesBox(centerGroup);
      if (box.isEmpty()) return false;

      const size = box.getSize(new Vector3());
      const center = box.getCenter(new Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);

      if (!Number.isFinite(maxDim) || maxDim < MIN_DIM) return false;

      centerGroup.position.set(-center.x, -center.y, -center.z);
      scaleGroup.scale.setScalar(TARGET_SIZE / maxDim);
      scaleGroup.updateMatrixWorld(true);
      prepareSkinned(scaleGroup);

      const framed = visibleMeshesBox(scaleGroup);
      if (framed.isEmpty()) return false;
      const framedSize = framed.getSize(new Vector3());

      const perspective = camera as PerspectiveCamera;
      if (viewSize.width > 0 && viewSize.height > 0) {
        perspective.aspect = viewSize.width / viewSize.height;
      }
      const distance = frameDistanceForBox(perspective, framed);
      const lookY = framedSize.y * 0.02;

      perspective.near = Math.max(distance / 150, 0.01);
      perspective.far = Math.max(distance * 150, 500);
      perspective.updateProjectionMatrix();

      const orbit = controls as OrbitControlsImpl | null;
      if (orbit) {
        applyOrbitFrame(orbit, perspective, distance, lookY);
      } else {
        perspective.position.set(0, lookY, distance);
        perspective.lookAt(0, 0, 0);
      }

      invalidate();
      announceReady();
      return true;
    };

    const scheduleRetry = () => {
      attempts += 1;
      if (cancelled || attempts > 20) {
        // Aunque el fit falle, no dejar el spinner infinito.
        announceReady();
        return;
      }
      raf = requestAnimationFrame(() => {
        if (applyFit()) {
          raf = requestAnimationFrame(() => {
            applyFit();
          });
          return;
        }
        timeoutId = window.setTimeout(scheduleRetry, attempts < 6 ? 0 : 50);
      });
    };

    if (!applyFit()) {
      scheduleRetry();
    } else {
      raf = requestAnimationFrame(() => {
        applyFit();
      });
    }

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      window.clearTimeout(timeoutId);
    };
  }, [clone, modelUrl, fitToken, camera, controls, viewSize.width, viewSize.height, invalidate]);

  return (
    <group ref={scaleRef}>
      <group ref={centerRef}>
        <primitive object={clone} />
      </group>
    </group>
  );
}

function InteractiveControls({ autoRotate }: { autoRotate: boolean }) {
  return (
    <OrbitControls
      makeDefault
      enableDamping
      dampingFactor={0.08}
      enablePan
      enableZoom
      enableRotate
      autoRotate={autoRotate}
      autoRotateSpeed={1.15}
      minDistance={0.05}
      maxDistance={500}
      minPolarAngle={0.15}
      maxPolarAngle={Math.PI - 0.15}
      touches={{
        ONE: TOUCH.ROTATE,
        TWO: TOUCH.DOLLY_PAN,
      }}
    />
  );
}

function StaticPhoto({
  photoUrl,
  alt,
  className,
}: {
  photoUrl: string;
  alt: string;
  className?: string;
}) {
  return (
    <div className={cn("relative h-full w-full", className)}>
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

export function FishModelViewer({
  modelUrl,
  fallbackPhotoUrl,
  alt,
  className,
}: FishModelViewerProps) {
  const reducedMotion = useReducedMotion();
  const [webglOk, setWebglOk] = useState(true);
  const [fitToken, setFitToken] = useState(0);
  const [modelReady, setModelReady] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mobile =
      window.matchMedia("(max-width: 768px)").matches ||
      /iPhone|iPad|iPod/i.test(navigator.userAgent);
    setIsMobile(mobile);

    try {
      const canvas = document.createElement("canvas");
      const gl =
        canvas.getContext("webgl2", { failIfMajorPerformanceCaveat: false }) ||
        canvas.getContext("webgl", { failIfMajorPerformanceCaveat: false }) ||
        canvas.getContext("experimental-webgl");
      if (!gl) setWebglOk(false);
    } catch {
      setWebglOk(false);
    }
  }, []);

  useEffect(() => {
    setModelReady(false);
    try {
      useGLTF.preload(modelUrl);
    } catch {
      // ignore
    }
  }, [modelUrl]);

  if (!webglOk) {
    return (
      <StaticPhoto
        photoUrl={fallbackPhotoUrl}
        alt={alt}
        className={className}
      />
    );
  }

  return (
    <div
      className={cn(
        "relative h-full w-full [transform:translate3d(0,0,0)] [-webkit-transform:translate3d(0,0,0)]",
        className,
      )}
    >
      <CanvasErrorBoundary
        fallback={
          <StaticPhoto photoUrl={fallbackPhotoUrl} alt={alt} />
        }
      >
        <Canvas
          className="absolute inset-0 touch-none [transform:translate3d(0,0,0)]"
          style={{ WebkitTransform: "translate3d(0,0,0)" }}
          camera={{
            position: [0, TARGET_SIZE * 0.06, DEFAULT_FRAME_DISTANCE],
            fov: 40,
            near: 0.05,
            far: 200,
          }}
          dpr={isMobile ? 1 : [1, 1.5]}
          gl={{
            // alpha:false + fondo sólido: Safari iOS compone mejor el canvas
            antialias: !isMobile,
            alpha: false,
            powerPreference: "default",
            failIfMajorPerformanceCaveat: false,
            preserveDrawingBuffer: true,
          }}
          onCreated={({ gl }) => {
            gl.setClearColor(0x0284c7, 1);
            if (isMobile) gl.setPixelRatio(1);
          }}
        >
          <color attach="background" args={["#0284c7"]} />
          <fog attach="fog" args={["#0284c7", 20, 55]} />
          <ambientLight intensity={0.95} />
          <directionalLight
            position={[4, 5, 4]}
            intensity={1.5}
            color="#fff7ed"
          />
          <directionalLight
            position={[-3, 1, -2]}
            intensity={0.55}
            color="#f472b6"
          />
          <pointLight position={[0, -1.5, 2]} intensity={0.5} color="#2dd4bf" />
          <InteractiveControls autoRotate={!reducedMotion} />
          <Suspense fallback={null}>
            <FittedModel
              modelUrl={modelUrl}
              fitToken={fitToken}
              onReady={() => setModelReady(true)}
            />
          </Suspense>
        </Canvas>
      </CanvasErrorBoundary>

      {!modelReady ? (
        <div className="absolute inset-0 z-20">
          <OceanModelSpinner />
        </div>
      ) : null}

      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,transparent_35%,rgba(3,105,161,0.35)_100%)]"
      />

      {modelReady ? (
        <>
          <div className="pointer-events-none absolute left-3 top-3 z-10 max-w-[70%]">
            <p className="rounded-full bg-deep-teal/75 px-3 py-1 text-[11px] font-semibold text-white/95 shadow-sm backdrop-blur-sm">
              Arrastra para girar · pellizca para zoom · dos dedos para mover
            </p>
          </div>

          <button
            type="button"
            onClick={() => setFitToken((token) => token + 1)}
            className="absolute right-3 top-3 z-10 inline-flex items-center gap-1 rounded-full bg-shell/90 px-2.5 py-1.5 text-[11px] font-bold text-deep-teal shadow-md backdrop-blur-sm active:scale-95"
            aria-label="Encajar modelo en la vista"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Encajar
          </button>
        </>
      ) : null}
    </div>
  );
}
