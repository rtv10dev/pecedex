"use client";

import { Suspense, useLayoutEffect, useMemo, useRef } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import {
  Box3,
  Vector3,
  type Group,
  type PerspectiveCamera,
  type SkinnedMesh,
} from "three";
import { clone as cloneSkinned } from "three/addons/utils/SkeletonUtils.js";

const TARGET = 1.9;
const FIT_MARGIN = 1.12;

function measureVisibleBox(root: Group): Box3 {
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
  return box;
}

function FittedPreview({ modelUrl }: { modelUrl: string }) {
  const { scene } = useGLTF(modelUrl);
  const clone = useMemo(() => {
    const next = cloneSkinned(scene);
    next.position.set(0, 0, 0);
    next.rotation.set(0, 0, 0);
    next.scale.set(1, 1, 1);
    next.traverse((obj) => {
      const mesh = obj as SkinnedMesh;
      if (mesh.isSkinnedMesh) mesh.frustumCulled = false;
    });
    return next;
  }, [scene]);
  const scaleRef = useRef<Group>(null);
  const centerRef = useRef<Group>(null);
  const { camera, size } = useThree();

  useLayoutEffect(() => {
    const scaleGroup = scaleRef.current;
    const centerGroup = centerRef.current;
    if (!scaleGroup || !centerGroup) return;

    scaleGroup.scale.setScalar(1);
    centerGroup.position.set(0, 0, 0);

    let box = measureVisibleBox(scaleGroup);
    if (box.isEmpty()) return;

    const dims = box.getSize(new Vector3());
    const center = box.getCenter(new Vector3());
    const maxDim = Math.max(dims.x, dims.y, dims.z, 1e-4);
    centerGroup.position.set(-center.x, -center.y, -center.z);
    scaleGroup.scale.setScalar(TARGET / maxDim);

    box = measureVisibleBox(scaleGroup);
    if (box.isEmpty()) return;

    const framedSize = box.getSize(new Vector3());
    const perspective = camera as PerspectiveCamera;
    if (size.width > 0 && size.height > 0) {
      perspective.aspect = size.width / size.height;
    }
    const vFov = (perspective.fov * Math.PI) / 180;
    const aspect = Math.max(perspective.aspect || 1, 0.05);
    const halfH = Math.max(framedSize.y, 0.01) / 2;
    const halfW = Math.max(framedSize.x, 0.01) / 2;
    const distance =
      Math.max(
        halfH / Math.tan(vFov / 2),
        halfW / (Math.tan(vFov / 2) * aspect),
        0.5,
      ) * FIT_MARGIN;

    perspective.near = Math.max(distance / 100, 0.01);
    perspective.far = Math.max(distance * 100, 200);
    perspective.updateProjectionMatrix();
    perspective.position.set(0, framedSize.y * 0.02, distance);
    perspective.lookAt(0, 0, 0);
  }, [clone, modelUrl, camera, size.width, size.height]);

  return (
    <group ref={scaleRef} rotation={[0.12, 0.5, 0]}>
      <group ref={centerRef}>
        <primitive object={clone} />
      </group>
    </group>
  );
}

/** Miniatura WebGL de un .glb local (reutilizar / catálogo). */
export function ModelGlbThumb({ modelUrl }: { modelUrl: string }) {
  return (
    <div className="absolute inset-0 bg-gradient-to-br from-sky-600 to-cyan-800">
      <Canvas
        className="pointer-events-none h-full w-full"
        camera={{ position: [0, 0.15, 4.2], fov: 40, near: 0.05, far: 200 }}
        dpr={[1, 1.25]}
        gl={{ antialias: true, alpha: true, powerPreference: "low-power" }}
        onCreated={({ gl }) => {
          gl.setClearColor(0x000000, 0);
        }}
      >
        <ambientLight intensity={1} />
        <directionalLight position={[3, 4, 2]} intensity={1.4} color="#fff7ed" />
        <directionalLight position={[-2, 1, -1]} intensity={0.5} color="#67e8f9" />
        <Suspense fallback={null}>
          <FittedPreview modelUrl={modelUrl} />
        </Suspense>
      </Canvas>
      <p className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-deep-teal/70 px-2 py-0.5 text-[10px] font-bold text-white/95 backdrop-blur-sm">
        Vista del modelo 3D
      </p>
    </div>
  );
}
