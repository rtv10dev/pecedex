import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomBytes } from "node:crypto";
import sharp from "sharp";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

export type SavedPhoto = {
  photoUrl: string;
  photoThumbUrl: string;
};

export async function saveSightingPhoto(file: File): Promise<SavedPhoto> {
  return savePhotoUpload(file);
}

/** Misma pipeline de imagen que avistamientos (full + thumb webp). */
export async function saveMemoryPhoto(file: File): Promise<SavedPhoto> {
  return savePhotoUpload(file, "memories");
}

async function savePhotoUpload(
  file: File,
  subdir?: string,
): Promise<SavedPhoto> {
  if (!file.type.startsWith("image/")) {
    throw new Error("El archivo debe ser una imagen.");
  }

  const maxBytes = 12 * 1024 * 1024;
  if (file.size > maxBytes) {
    throw new Error("La imagen supera 12 MB.");
  }

  const id = randomBytes(12).toString("hex");
  const dir = subdir
    ? path.join(UPLOAD_DIR, subdir, id)
    : path.join(UPLOAD_DIR, id);
  await mkdir(dir, { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());
  const image = sharp(buffer).rotate();

  const fullName = "full.webp";
  const thumbName = "thumb.webp";

  await image
    .clone()
    .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82 })
    .toFile(path.join(dir, fullName));

  await image
    .clone()
    .resize({ width: 480, height: 480, fit: "cover" })
    .webp({ quality: 78 })
    .toFile(path.join(dir, thumbName));

  const publicBase = subdir ? `/uploads/${subdir}/${id}` : `/uploads/${id}`;

  return {
    photoUrl: `${publicBase}/${fullName}`,
    photoThumbUrl: `${publicBase}/${thumbName}`,
  };
}

/** Guarda una copia temporal para identificación (se puede reutilizar al crear). */
export async function saveTempIdentifyPhoto(file: File): Promise<{
  absPath: string;
  publicUrl: string;
  mimeType: string;
  bytes: Buffer;
}> {
  if (!file.type.startsWith("image/")) {
    throw new Error("El archivo debe ser una imagen.");
  }

  const maxBytes = 12 * 1024 * 1024;
  if (file.size > maxBytes) {
    throw new Error("La imagen supera 12 MB.");
  }

  const id = randomBytes(12).toString("hex");
  const dir = path.join(UPLOAD_DIR, "tmp", id);
  await mkdir(dir, { recursive: true });

  const bytes = Buffer.from(await file.arrayBuffer());
  const normalized = await sharp(bytes)
    .rotate()
    .resize({ width: 1024, height: 1024, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 80 })
    .toBuffer();

  const fileName = "identify.jpg";
  const absPath = path.join(dir, fileName);
  await writeFile(absPath, normalized);

  return {
    absPath,
    publicUrl: `/uploads/tmp/${id}/${fileName}`,
    mimeType: "image/jpeg",
    bytes: normalized,
  };
}

const MODEL_MAX_BYTES = 25 * 1024 * 1024;

function isGlbFile(file: File): boolean {
  const name = file.name.toLowerCase();
  return (
    name.endsWith(".glb") ||
    file.type === "model/gltf-binary" ||
    file.type === "application/octet-stream"
  );
}

/** Guarda un .glb subido por el admin. */
export async function saveModel3dFile(file: File): Promise<string> {
  if (!isGlbFile(file)) {
    throw new Error("El archivo debe ser un modelo .glb.");
  }
  if (file.size > MODEL_MAX_BYTES) {
    throw new Error("El modelo supera 25 MB.");
  }

  const id = randomBytes(12).toString("hex");
  const dir = path.join(UPLOAD_DIR, "models", id);
  await mkdir(dir, { recursive: true });

  const bytes = Buffer.from(await file.arrayBuffer());
  // Cabecera glTF binario: "glTF"
  if (bytes.length < 12 || bytes.toString("ascii", 0, 4) !== "glTF") {
    throw new Error("El archivo no parece un GLB válido.");
  }

  const fileName = "model.glb";
  await writeFile(path.join(dir, fileName), bytes);
  return `/uploads/models/${id}/${fileName}`;
}

/** Guarda bytes de un .glb ya validados. */
export async function saveModel3dBytes(bytes: Buffer): Promise<string> {
  if (bytes.length > MODEL_MAX_BYTES) {
    throw new Error("El modelo supera 25 MB.");
  }
  if (bytes.length < 12 || bytes.toString("ascii", 0, 4) !== "glTF") {
    throw new Error(
      "El archivo no es un GLB válido (si Sketchfab dio un ZIP, descarga el .glb a mano y súbelo).",
    );
  }

  const id = randomBytes(12).toString("hex");
  const dir = path.join(UPLOAD_DIR, "models", id);
  await mkdir(dir, { recursive: true });
  const fileName = "model.glb";
  await writeFile(path.join(dir, fileName), bytes);
  return `/uploads/models/${id}/${fileName}`;
}

/** Copia un modelo curado (ruta pública local) a uploads para no depender del catálogo. */
export async function copyPublicModelToUploads(
  publicModelUrl: string,
): Promise<string> {
  if (!publicModelUrl.startsWith("/models/")) {
    throw new Error("Solo se pueden copiar modelos del catálogo local.");
  }

  const abs = path.join(process.cwd(), "public", publicModelUrl);
  const { readFile } = await import("node:fs/promises");
  const bytes = await readFile(abs);
  return saveModel3dBytes(bytes);
}

/** Copia un GLB ya servido desde /uploads (p. ej. reutilizar de otra ficha). */
export async function copyUploadModelToUploads(
  publicModelUrl: string,
): Promise<string> {
  if (!publicModelUrl.startsWith("/uploads/models/")) {
    throw new Error("Solo se pueden reutilizar modelos de uploads.");
  }

  const abs = path.join(process.cwd(), "public", publicModelUrl);
  const { readFile } = await import("node:fs/promises");
  const bytes = await readFile(abs);
  return saveModel3dBytes(bytes);
}

function isSafeUploadRelative(publicUrl: string): boolean {
  if (!publicUrl.startsWith("/uploads/")) return false;
  if (publicUrl.includes("..") || publicUrl.includes("\0")) return false;
  return true;
}

/** Borra un directorio de uploads asociado a una URL pública (/uploads/...). */
export async function deleteUploadByPublicUrl(
  publicUrl: string | null | undefined,
): Promise<void> {
  if (!publicUrl || !isSafeUploadRelative(publicUrl)) return;

  const { rm } = await import("node:fs/promises");
  const absFile = path.join(process.cwd(), "public", publicUrl);
  const absDir = path.dirname(absFile);
  const uploadsRoot = path.join(process.cwd(), "public", "uploads");
  const resolved = path.resolve(absDir);
  if (!resolved.startsWith(path.resolve(uploadsRoot) + path.sep)) {
    return;
  }

  await rm(resolved, { recursive: true, force: true }).catch(() => {});
}

