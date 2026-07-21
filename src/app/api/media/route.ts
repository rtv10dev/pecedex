import { get } from "@vercel/blob";

export const runtime = "nodejs";

/**
 * Sirve archivos del Blob store privado (fotos / modelos).
 * URL: /api/media?path=uploads/.../full.webp
 */
export async function GET(request: Request) {
  const pathParam = new URL(request.url).searchParams.get("path");
  if (
    !pathParam ||
    pathParam.includes("..") ||
    pathParam.startsWith("/") ||
    pathParam.includes("\0")
  ) {
    return new Response("Bad request", { status: 400 });
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return new Response("Blob not configured", { status: 503 });
  }

  const access =
    process.env.BLOB_ACCESS?.trim().toLowerCase() === "public"
      ? "public"
      : "private";

  try {
    const result = await get(pathParam, { access });
    if (!result?.stream) {
      return new Response("Not found", { status: 404 });
    }

    const contentType =
      result.blob?.contentType ?? "application/octet-stream";

    return new Response(result.stream, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
        // Permite canvas/crop same-site y next/image
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    console.error("[api/media]", error);
    return new Response("Not found", { status: 404 });
  }
}
