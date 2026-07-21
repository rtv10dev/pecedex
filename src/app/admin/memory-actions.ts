"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { deleteUploadByPublicUrl, replaceGalleryThumb, saveMemoryPhoto } from "@/lib/storage";

export type CreateMemoryState = {
  error?: string;
};

export type DeleteMemoryState = {
  error?: string;
};

export async function createMemoryAction(
  _prev: CreateMemoryState,
  formData: FormData,
): Promise<CreateMemoryState> {
  await requireAdminSession();

  const photo = formData.get("photo");
  const description = String(formData.get("description") ?? "").trim();
  const takenAtRaw = String(formData.get("takenAt") ?? "").trim();

  if (!(photo instanceof File) || photo.size === 0) {
    return { error: "Elige una foto." };
  }
  if (!description) {
    return { error: "Añade una descripción." };
  }

  let takenAt: Date | null = null;
  if (takenAtRaw) {
    const parsed = new Date(takenAtRaw);
    if (Number.isNaN(parsed.getTime())) {
      return { error: "Fecha no válida." };
    }
    takenAt = parsed;
  }

  let memoryId: string;

  try {
    const thumb = formData.get("thumb");
    const thumbFile =
      thumb instanceof File && thumb.size > 0 ? thumb : null;
    const saved = await saveMemoryPhoto(photo, thumbFile);
    const memory = await prisma.memory.create({
      data: {
        photoUrl: saved.photoUrl,
        photoThumbUrl: saved.photoThumbUrl,
        description,
        takenAt,
      },
    });
    memoryId = memory.id;
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "No se pudo guardar el recuerdo.",
    };
  }

  revalidatePath("/recuerdos");
  revalidatePath(`/recuerdo/${memoryId}`);
  redirect(`/recuerdo/${memoryId}`);
}

export async function deleteMemoryAction(
  _prev: DeleteMemoryState,
  formData: FormData,
): Promise<DeleteMemoryState> {
  await requireAdminSession();

  const memoryId = String(formData.get("memoryId") ?? "").trim();
  if (!memoryId) {
    return { error: "Falta el recuerdo." };
  }

  const memory = await prisma.memory.findUnique({ where: { id: memoryId } });
  if (!memory) {
    return { error: "Recuerdo no encontrado." };
  }

  try {
    await prisma.memory.delete({ where: { id: memoryId } });
    await deleteUploadByPublicUrl(memory.photoUrl);
    if (memory.photoThumbUrl && memory.photoThumbUrl !== memory.photoUrl) {
      await deleteUploadByPublicUrl(memory.photoThumbUrl);
    }
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "No se pudo borrar el recuerdo.",
    };
  }

  revalidatePath("/recuerdos");
  redirect("/recuerdos");
}

export type UpdateMemoryThumbState = {
  error?: string;
  ok?: boolean;
};

export async function updateMemoryThumbAction(
  _prev: UpdateMemoryThumbState,
  formData: FormData,
): Promise<UpdateMemoryThumbState> {
  await requireAdminSession();

  const memoryId = String(formData.get("memoryId") ?? "").trim();
  const thumb = formData.get("thumb");

  if (!memoryId) {
    return { error: "Falta el recuerdo." };
  }
  if (!(thumb instanceof File) || thumb.size === 0) {
    return { error: "Falta el encuadre." };
  }

  const memory = await prisma.memory.findUnique({
    where: { id: memoryId },
    select: { id: true, photoUrl: true },
  });
  if (!memory) {
    return { error: "Recuerdo no encontrado." };
  }

  try {
    const photoThumbUrl = await replaceGalleryThumb(memory.photoUrl, thumb);
    await prisma.memory.update({
      where: { id: memory.id },
      data: { photoThumbUrl },
    });
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "No se pudo guardar el encuadre.",
    };
  }

  revalidatePath("/recuerdos");
  revalidatePath(`/recuerdo/${memoryId}`);
  return { ok: true };
}
