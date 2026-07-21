import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/session";

export const runtime = "nodejs";

/**
 * Emite tokens para subir .glb desde el navegador (evita el límite 413 de Vercel).
 */
export async function POST(request: Request): Promise<NextResponse> {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { error: "Blob no configurado." },
      { status: 503 },
    );
  }

  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        if (
          !pathname.startsWith("uploads/models/") ||
          !pathname.endsWith("/model.glb") ||
          pathname.includes("..")
        ) {
          throw new Error("Ruta de modelo no válida.");
        }

        return {
          allowedContentTypes: [
            "model/gltf-binary",
            "application/octet-stream",
            "application/gltf-buffer",
          ],
          maximumSizeInBytes: 50 * 1024 * 1024,
          addRandomSuffix: false,
          allowOverwrite: false,
        };
      },
      onUploadCompleted: async () => {
        // La ficha se actualiza con confirmBlobModelAction desde el cliente.
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    console.error("[api/blob/upload]", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "No se pudo preparar la subida.",
      },
      { status: 400 },
    );
  }
}
