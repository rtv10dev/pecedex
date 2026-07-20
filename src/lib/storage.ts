import { mkdir, writeFile, readFile, rm } from "node:fs/promises";
import path from "node:path";
import { randomBytes } from "node:crypto";
import sharp from "sharp";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

export type SavedPhoto = {
  photoUrl: string;
  photoThumbUrl: string;
};

function useBlobStorage() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

/** Tu store es privado → "private". Si creas uno público, pon BLOB_ACCESS=public. */
function blobAccessMode(): "public" | "private" {
  const mode = process.env.BLOB_ACCESS?.trim().toLowerCase();
  if (mode === "public") return "public";
  return "private";
}

function isBlobUrl(url: string) {
  return /^https?:\/\//i.test(url) && url.includes("blob.vercel-storage.com");
}

function isMediaProxyUrl(url: string) {
  return url.startsWith("/api/media");
}

/** Pathname dentro del Blob store a partir de URL pública de Pecedex. */
export function blobPathnameFromPublicUrl(publicUrl: string): string | null {
  if (isMediaProxyUrl(publicUrl)) {
    try {
      const pathParam = new URL(publicUrl, "http://local.invalid").searchParams.get(
        "path",
      );
      if (!pathParam || pathParam.includes("..") || pathParam.startsWith("/")) {
        return null;
      }
      return pathParam;
    } catch {
      return null;
    }
  }
  if (isBlobUrl(publicUrl)) {
    try {
      return decodeURIComponent(
        new URL(publicUrl).pathname.replace(/^\/+/, ""),
      );
    } catch {
      return null;
    }
  }
  return null;
}

function toAppMediaUrl(pathname: string): string {
  return `/api/media?path=${encodeURIComponent(pathname)}`;
}

/** Copia a un ArrayBuffer “normal” (evita SharedArrayBuffer en fetch de Blob/undici). */
function toPlainBuffer(input: ArrayBuffer | Buffer | Uint8Array): Buffer {
  const view =
    input instanceof Buffer
      ? input
      : input instanceof Uint8Array
        ? input
        : new Uint8Array(input);
  const copy = new Uint8Array(view.byteLength);
  copy.set(view);
  return Buffer.from(copy.buffer, copy.byteOffset, copy.byteLength);
}

async function fileToPlainBuffer(file: File): Promise<Buffer> {
  return toPlainBuffer(await file.arrayBuffer());
}

/** URLs que gestiona Pecedex (local /uploads, proxy /api/media o Vercel Blob). */
export function isManagedUploadUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  return (
    url.startsWith("/uploads/") || isMediaProxyUrl(url) || isBlobUrl(url)
  );
}

async function putPublicBytes(
  pathname: string,
  bytes: Buffer,
  contentType: string,
): Promise<string> {
  const plain = toPlainBuffer(bytes);

  if (useBlobStorage()) {
    const { put } = await import("@vercel/blob");
    const access = blobAccessMode();
    const blob = await put(pathname, plain, {
      access,
      contentType,
      addRandomSuffix: false,
    });
    // Store privado: servir vía /api/media. Público: URL directa de Blob.
    return access === "private" ? toAppMediaUrl(blob.pathname) : blob.url;
  }

  // En Vercel el filesystem es de solo lectura: hace falta Blob.
  if (process.env.VERCEL) {
    throw new Error(
      "Falta BLOB_READ_WRITE_TOKEN. En Vercel → Storage → Blob, conecta el store o crea un token de lectura/escritura.",
    );
  }

  const abs = path.join(process.cwd(), "public", pathname);
  await mkdir(path.dirname(abs), { recursive: true });
  await writeFile(abs, plain);
  return `/${pathname.replace(/^\/+/, "")}`;
}

async function readManagedBytes(publicUrl: string): Promise<Buffer> {
  const blobPath = blobPathnameFromPublicUrl(publicUrl);
  if (blobPath && useBlobStorage()) {
    const { get } = await import("@vercel/blob");
    const result = await get(blobPath, { access: blobAccessMode() });
    if (!result?.stream) {
      throw new Error("No se pudo leer el archivo remoto.");
    }
    return toPlainBuffer(await new Response(result.stream).arrayBuffer());
  }

  if (isBlobUrl(publicUrl)) {
    const res = await fetch(publicUrl);
    if (!res.ok) {
      throw new Error("No se pudo leer el archivo remoto.");
    }
    return toPlainBuffer(await res.arrayBuffer());
  }

  if (!publicUrl.startsWith("/")) {
    throw new Error("URL de archivo no válida.");
  }
  return readFile(path.join(process.cwd(), "public", publicUrl));
}

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
  const buffer = await fileToPlainBuffer(file);
  const image = sharp(buffer).rotate();

  const fullName = "full.webp";
  const thumbName = "thumb.webp";

  const fullBytes = await image
    .clone()
    .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer();

  const thumbBytes = await image
    .clone()
    .resize({ width: 480, height: 480, fit: "cover" })
    .webp({ quality: 78 })
    .toBuffer();

  const basePath = subdir ? `uploads/${subdir}/${id}` : `uploads/${id}`;

  const photoUrl = await putPublicBytes(
    `${basePath}/${fullName}`,
    fullBytes,
    "image/webp",
  );
  const photoThumbUrl = await putPublicBytes(
    `${basePath}/${thumbName}`,
    thumbBytes,
    "image/webp",
  );

  return { photoUrl, photoThumbUrl };
}

/** Prepara bytes JPEG en memoria para Gemini (sin subir a Blob/disco). */
export async function saveTempIdentifyPhoto(file: File): Promise<{
  absPath: string | null;
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

  const source = await fileToPlainBuffer(file);
  const normalized = toPlainBuffer(
    await sharp(source)
      .rotate()
      .resize({ width: 1024, height: 1024, fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toBuffer(),
  );

  // Solo memoria: el cliente ya tiene preview y Gemini usa `bytes`.
  return {
    absPath: null,
    publicUrl: "",
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

function assertGlbBytes(bytes: Buffer) {
  if (bytes.length < 12 || bytes.toString("ascii", 0, 4) !== "glTF") {
    throw new Error("El archivo no parece un GLB válido.");
  }
}

/** Guarda un .glb subido por el admin. */
export async function saveModel3dFile(file: File): Promise<string> {
  if (!isGlbFile(file)) {
    throw new Error("El archivo debe ser un modelo .glb.");
  }
  if (file.size > MODEL_MAX_BYTES) {
    throw new Error("El modelo supera 25 MB.");
  }

  const bytes = await fileToPlainBuffer(file);
  assertGlbBytes(bytes);
  return saveModel3dBytes(bytes);
}

/** Guarda bytes de un .glb ya validados. */
export async function saveModel3dBytes(bytes: Buffer): Promise<string> {
  const plain = toPlainBuffer(bytes);
  if (plain.length > MODEL_MAX_BYTES) {
    throw new Error("El modelo supera 25 MB.");
  }
  assertGlbBytes(plain);

  const id = randomBytes(12).toString("hex");
  return putPublicBytes(
    `uploads/models/${id}/model.glb`,
    plain,
    "model/gltf-binary",
  );
}

/** Copia un modelo curado (ruta pública local) a uploads para no depender del catálogo. */
export async function copyPublicModelToUploads(
  publicModelUrl: string,
): Promise<string> {
  if (!publicModelUrl.startsWith("/models/")) {
    throw new Error("Solo se pueden copiar modelos del catálogo local.");
  }

  const abs = path.join(process.cwd(), "public", publicModelUrl);
  const bytes = await readFile(abs);
  return saveModel3dBytes(bytes);
}

/** Copia un GLB ya servido desde /uploads o Blob (p. ej. reutilizar de otra ficha). */
export async function copyUploadModelToUploads(
  publicModelUrl: string,
): Promise<string> {
  if (!isManagedUploadUrl(publicModelUrl)) {
    throw new Error("Solo se pueden reutilizar modelos de uploads.");
  }

  const bytes = await readManagedBytes(publicModelUrl);
  return saveModel3dBytes(bytes);
}

function isSafeUploadRelative(publicUrl: string): boolean {
  if (!publicUrl.startsWith("/uploads/")) return false;
  if (publicUrl.includes("..") || publicUrl.includes("\0")) return false;
  return true;
}

/** Borra un archivo gestionado (local /uploads o Vercel Blob). */
export async function deleteUploadByPublicUrl(
  publicUrl: string | null | undefined,
): Promise<void> {
  if (!publicUrl || !isManagedUploadUrl(publicUrl)) return;

  const blobPath = blobPathnameFromPublicUrl(publicUrl);
  if (blobPath && useBlobStorage()) {
    const { del } = await import("@vercel/blob");
    await del(blobPath).catch(() => {});
    return;
  }

  if (isBlobUrl(publicUrl)) {
    const { del } = await import("@vercel/blob");
    await del(publicUrl).catch(() => {});
    return;
  }

  if (!isSafeUploadRelative(publicUrl)) return;

  const absFile = path.join(process.cwd(), "public", publicUrl);
  const absDir = path.dirname(absFile);
  const uploadsRoot = path.join(process.cwd(), "public", "uploads");
  const resolved = path.resolve(absDir);
  if (!resolved.startsWith(path.resolve(uploadsRoot) + path.sep)) {
    return;
  }

  await rm(resolved, { recursive: true, force: true }).catch(() => {});
}
