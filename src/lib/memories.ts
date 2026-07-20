import { prisma } from "@/lib/db";

export type MemoryListItem = {
  id: string;
  photoUrl: string;
  photoThumbUrl: string;
  description: string;
  takenAt: Date | null;
  createdAt: Date;
};

export async function getMemories(): Promise<MemoryListItem[]> {
  try {
    const memories = await prisma.memory.findMany();
    return memories.sort((a, b) => {
      const aDate = (a.takenAt ?? a.createdAt).getTime();
      const bDate = (b.takenAt ?? b.createdAt).getTime();
      return bDate - aDate;
    });
  } catch {
    return [];
  }
}

export async function getMemoryById(
  id: string,
): Promise<MemoryListItem | null> {
  try {
    return await prisma.memory.findUnique({ where: { id } });
  } catch {
    return null;
  }
}
