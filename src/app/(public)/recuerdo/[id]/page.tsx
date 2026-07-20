import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { ArrowLeft, Calendar } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { DeleteMemoryButton } from "@/components/admin/DeleteMemoryButton";
import { getAdminSession } from "@/lib/auth/session";
import { getMemoryById } from "@/lib/memories";
import { APP_NAME } from "@/lib/constants";

interface MemoryDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: MemoryDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const memory = await getMemoryById(id);
  if (!memory) return { title: "Recuerdo" };
  return {
    title: "Recuerdo",
    description: memory.description,
    openGraph: {
      title: `Recuerdo · ${APP_NAME}`,
      description: memory.description,
      images: [{ url: memory.photoUrl }],
    },
  };
}

export default async function MemoryDetailPage({
  params,
}: MemoryDetailPageProps) {
  const { id } = await params;
  const memory = await getMemoryById(id);
  if (!memory) notFound();

  const admin = await getAdminSession();
  const dateLabel = memory.takenAt ?? memory.createdAt;
  const shortLabel =
    memory.description.length > 60
      ? `${memory.description.slice(0, 57)}…`
      : memory.description;

  return (
    <>
      <Header title="Recuerdo" subtitle={shortLabel} />
      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-4">
        <Link
          href="/recuerdos"
          className="mb-4 inline-flex items-center gap-2 rounded-full bg-shell/80 px-3 py-1.5 text-sm font-bold text-anemone shadow-sm backdrop-blur-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a recuerdos
        </Link>

        <div className="overflow-hidden rounded-3xl border-2 border-white/80 bg-shell shadow-xl shadow-anemone/20">
          <div className="rainbow-border h-1.5" />
          <div className="relative aspect-square">
            <Image
              src={memory.photoUrl}
              alt={memory.description}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, 512px"
              priority
            />
          </div>
          <div className="space-y-3 bg-gradient-to-b from-foam-white to-shell p-5">
            <div className="flex items-start gap-3 rounded-2xl bg-gradient-to-r from-clownfish/15 to-mango/10 px-4 py-3">
              <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-xl bg-white/80 shadow-sm">
                <Calendar className="h-4 w-4 text-clownfish" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-mist">
                  {memory.takenAt ? "Fecha" : "Subido"}
                </p>
                <p className="font-semibold leading-snug text-ink">
                  {dateLabel.toLocaleDateString("es-ES", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>
            <p className="rounded-2xl bg-white/70 px-4 py-3 text-sm leading-relaxed text-slate">
              {memory.description}
            </p>
          </div>
        </div>

        {admin ? (
          <section className="mt-4 overflow-hidden rounded-3xl border-2 border-white/80 bg-shell/95 p-4 shadow-xl shadow-coral/10">
            <p className="mb-3 text-xs font-bold uppercase tracking-wide text-coral">
              Zona admin
            </p>
            <DeleteMemoryButton memoryId={memory.id} label={shortLabel} />
          </section>
        ) : null}
      </main>
    </>
  );
}
