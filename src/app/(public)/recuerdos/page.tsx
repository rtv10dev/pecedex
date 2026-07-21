import Link from "next/link";
import type { Metadata } from "next";
import { Camera, Plus } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { MemoryCard } from "@/components/memories/MemoryCard";
import { getAdminSession } from "@/lib/auth/session";
import { getMemories } from "@/lib/memories";

export const metadata: Metadata = {
  title: "Recuerdos",
  description: "Fotos de Aurora y Rafa con descripción y fecha.",
};

export default async function MemoriesPage() {
  const [memories, admin] = await Promise.all([
    getMemories(),
    getAdminSession(),
  ]);

  return (
    <>
      <Header
        title="Recuerdos"
        subtitle={
          memories.length > 0
            ? `${memories.length} recuerdo${memories.length === 1 ? "" : "s"}`
            : "Momentos fuera del agua"
        }
      />
      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-4">
        {admin ? (
          <div className="mb-4 flex justify-end">
            <Link
              href="/admin/recuerdo"
              className="inline-flex items-center gap-1.5 rounded-full bg-anemone px-3 py-1.5 text-sm font-bold text-white shadow-sm"
            >
              <Plus className="h-4 w-4" />
              Añadir
            </Link>
          </div>
        ) : null}

        {memories.length === 0 ? (
          <EmptyMemories isAdmin={Boolean(admin)} />
        ) : (
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {memories.map((memory, index) => (
              <li key={memory.id} className="h-full">
                <MemoryCard memory={memory} index={index} />
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  );
}

function EmptyMemories({ isAdmin }: { isAdmin: boolean }) {
  return (
    <div className="mt-8 overflow-hidden rounded-3xl border-2 border-white/80 bg-shell/90 text-center shadow-xl shadow-anemone/20 backdrop-blur-sm">
      <div className="rainbow-border h-1.5" />
      <div className="p-8">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-anemone/30 via-coral/30 to-clownfish/30">
          <Camera className="h-8 w-8 text-anemone" />
        </div>
        <h2 className="text-lg font-bold text-ink">Aún no hay recuerdos</h2>
        <p className="mt-2 text-sm text-slate">
          Cuando subáis una foto con su historia, aparecerá aquí.
        </p>
        {isAdmin ? (
          <Link
            href="/admin/recuerdo"
            className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-anemone px-4 py-2 text-sm font-bold text-white shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Añadir el primero
          </Link>
        ) : null}
      </div>
    </div>
  );
}
