import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, Calendar, MapPin, Sparkles } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { FishHero } from "@/components/fish/FishHero";
import { Model3dAdminPanel } from "@/components/admin/Model3dAdminPanel";
import { DeleteSightingButton } from "@/components/admin/DeleteSightingButton";
import { getAdminSession } from "@/lib/auth/session";
import { findCuratedModel } from "@/lib/model3d/catalog";
import { prisma } from "@/lib/db";
import { APP_NAME } from "@/lib/constants";

interface FishDetailPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string }>;
}

export async function generateMetadata({
  params,
}: FishDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  try {
    const sighting = await prisma.sighting.findUnique({
      where: { id },
      select: {
        photoUrl: true,
        species: { select: { commonName: true, scientificName: true } },
        location: { select: { label: true } },
      },
    });
    if (!sighting) {
      return { title: "Avistamiento" };
    }
    return {
      title: sighting.species.commonName,
      description: `${sighting.species.scientificName} · ${sighting.location.label}`,
      openGraph: {
        title: `${sighting.species.commonName} · ${APP_NAME}`,
        description: `${sighting.species.scientificName} visto en ${sighting.location.label}`,
        images: [{ url: sighting.photoUrl }],
      },
    };
  } catch {
    return { title: "Avistamiento" };
  }
}

export default async function FishDetailPage({
  params,
  searchParams,
}: FishDetailPageProps) {
  const { id } = await params;
  const { from } = await searchParams;
  const fromMap = from === "mapa";
  const backHref = fromMap ? "/mapa" : "/";
  const backLabel = fromMap ? "Volver al mapa" : "Volver a la galería";

  let sighting;
  try {
    sighting = await prisma.sighting.findUnique({
      where: { id },
      include: {
        species: true,
        location: true,
      },
    });
  } catch {
    notFound();
  }

  if (!sighting) {
    notFound();
  }

  const admin = await getAdminSession();
  const hasCuratedMatch = Boolean(
    findCuratedModel(sighting.species.scientificName),
  );
  const dateLabel = sighting.sightedAt ?? sighting.registeredAt;

  return (
    <>
      <Header title={sighting.species.commonName} subtitle={sighting.location.label} />
      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-4">
        <Link
          href={backHref}
          scroll={false}
          className="mb-4 inline-flex items-center gap-2 rounded-full bg-shell/80 px-3 py-1.5 text-sm font-bold text-tang shadow-sm backdrop-blur-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          {backLabel}
        </Link>

        <div className="rounded-3xl border-2 border-white/80 bg-shell shadow-xl shadow-anemone/20">
          <div className="rainbow-border h-1.5 rounded-t-[calc(1.5rem-2px)]" />

          {/*
            Sin overflow-hidden aquí: en Safari iOS el WebGL dentro de
            overflow+border-radius queda en blanco.
          */}
          <div className="relative aspect-square [transform:translate3d(0,0,0)] [-webkit-transform:translate3d(0,0,0)]">
            <FishHero
              displayMode={sighting.displayMode}
              model3dUrl={sighting.model3dUrl}
              model3dStatus={sighting.model3dStatus}
              photoUrl={sighting.photoUrl}
              alt={sighting.species.commonName}
            />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-deep-teal/95 via-reef/45 to-transparent p-6 pt-20">
              <h2 className="text-2xl font-bold text-white drop-shadow-md">
                {sighting.species.commonName}
              </h2>
              <p className="text-sm italic text-foam-white/90">
                {sighting.species.scientificName}
              </p>
            </div>
          </div>

          <div className="space-y-3 rounded-b-[calc(1.5rem-2px)] bg-gradient-to-b from-foam-white to-shell p-5">
            <InfoRow
              icon={<MapPin className="h-4 w-4 text-tang" />}
              label="Ubicación"
              value={sighting.location.label}
              accent="from-tang/15 to-lagoon/10"
            />
            <InfoRow
              icon={<Calendar className="h-4 w-4 text-clownfish" />}
              label={sighting.sightedAt ? "Avistado" : "Registrado"}
              value={dateLabel.toLocaleDateString("es-ES", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
              accent="from-clownfish/15 to-mango/10"
            />
            {sighting.notes ? (
              <InfoRow
                icon={<Sparkles className="h-4 w-4 text-anemone" />}
                label="Anécdota"
                value={sighting.notes}
                accent="from-anemone/15 to-coral/10"
              />
            ) : null}
            {sighting.species.description ? (
              <p className="rounded-2xl bg-white/70 px-4 py-3 text-sm leading-relaxed text-slate">
                {sighting.species.description}
              </p>
            ) : null}
          </div>
        </div>

        {admin ? (
          <>
            <Model3dAdminPanel
              sightingId={sighting.id}
              model3dStatus={sighting.model3dStatus}
              model3dSource={sighting.model3dSource}
              hasCuratedMatch={hasCuratedMatch}
              scientificName={sighting.species.scientificName}
              commonName={sighting.species.commonName}
            />
            <section className="mt-4 overflow-hidden rounded-3xl border-2 border-white/80 bg-shell/95 p-4 shadow-xl shadow-coral/10">
              <p className="mb-3 text-xs font-bold uppercase tracking-wide text-coral">
                Zona admin
              </p>
              <DeleteSightingButton
                sightingId={sighting.id}
                commonName={sighting.species.commonName}
              />
            </section>
          </>
        ) : null}
      </main>
    </>
  );
}

function InfoRow({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div
      className={`flex items-start gap-3 rounded-2xl bg-gradient-to-r ${accent} px-4 py-3`}
    >
      <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-xl bg-white/80 shadow-sm">
        {icon}
      </div>
      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-mist">
          {label}
        </p>
        <p className="font-semibold text-ink leading-snug">{value}</p>
      </div>
    </div>
  );
}
