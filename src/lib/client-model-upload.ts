"use client";

import { upload } from "@vercel/blob/client";

function blobAccess(): "public" | "private" {
  return process.env.NEXT_PUBLIC_BLOB_ACCESS === "public" ? "public" : "private";
}

function isGlbFile(file: File): boolean {
  const name = file.name.toLowerCase();
  return (
    name.endsWith(".glb") ||
    file.type === "model/gltf-binary" ||
    file.type === "application/octet-stream"
  );
}

/**
 * Sube un .glb directo a Vercel Blob (bypass del límite ~4.5 MB de Server Actions).
 */
export async function uploadGlbToBlob(file: File): Promise<{ pathname: string }> {
  if (!isGlbFile(file)) {
    throw new Error("El archivo debe ser un modelo .glb.");
  }
  if (file.size > 25 * 1024 * 1024) {
    throw new Error("El modelo supera 25 MB.");
  }

  const id = crypto.randomUUID().replace(/-/g, "");
  const pathname = `uploads/models/${id}/model.glb`;

  const blob = await upload(pathname, file, {
    access: blobAccess(),
    handleUploadUrl: "/api/blob/upload",
    multipart: true,
    contentType: "model/gltf-binary",
  });

  return { pathname: blob.pathname };
}
