"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { deleteUploadByPublicUrl, saveMemoryPhoto } from "@/lib/storage";

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
    const saved = await saveMemoryPhoto(photo);
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
