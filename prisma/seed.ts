import "dotenv/config";
import { createRequire } from "node:module";
import path from "node:path";
import { PrismaClient } from "../src/generated/prisma/client";

const require = createRequire(import.meta.url);

const databaseUrl = process.env.DATABASE_URL ?? "file:./dev.db";

function createSeedClient() {
  if (/^postgres(ql)?:/i.test(databaseUrl)) {
    const { PrismaPg } = require("@prisma/adapter-pg") as typeof import("@prisma/adapter-pg");
    const { Pool } = require("pg") as typeof import("pg");
    const pool = new Pool({ connectionString: databaseUrl });
    return new PrismaClient({ adapter: new PrismaPg(pool) });
  }

  const { PrismaBetterSqlite3 } = require(
    "@prisma/adapter-better-sqlite3",
  ) as typeof import("@prisma/adapter-better-sqlite3");
  const relative = databaseUrl.replace(/^file:/, "");
  const dbPath = path.isAbsolute(relative)
    ? relative
    : path.join(process.cwd(), relative);
  return new PrismaClient({
    adapter: new PrismaBetterSqlite3({ url: dbPath }),
  });
}

const prisma = createSeedClient();

type SeedFish = {
  scientificName: string;
  commonName: string;
  description: string;
  family: string;
  habitat: string;
  locationLabel: string;
  lat: number;
  lng: number;
  photoUrl: string;
  photoThumbUrl: string;
  sightedAt: Date | null;
  /** Si se define, el avistamiento arranca con modelo 3D listo. */
  model3dUrl?: string;
  model3dSource?: string;
};

const PLACEHOLDER_FISH: SeedFish[] = [
  // Playas cercanas en Tenerife: ubicaciones distintas → no se spiderfean juntas
  {
    scientificName: "Zebrasoma flavescens",
    commonName: "Pez cirujano amarillo",
    description:
      "Pez tropical de cuerpo ovalado y color amarillo intenso, muy común en arrecifes del Indo-Pacífico.",
    family: "Acanthuridae",
    habitat: "Arrecifes coralinos",
    locationLabel: "Playa de las Teresitas, Tenerife",
    lat: 28.5075,
    lng: -16.1858,
    photoUrl:
      "https://images.unsplash.com/photo-1573314229938-9e9a5df033a9?w=800&q=80",
    photoThumbUrl:
      "https://images.unsplash.com/photo-1573314229938-9e9a5df033a9?w=400&q=80",
    sightedAt: new Date("2025-06-12"),
    model3dUrl: "/models/curated/fish-yellow.glb",
    model3dSource: "curated_yellow",
  },
  {
    scientificName: "Chaetodon auriga",
    commonName: "Pez mariposa hilo",
    description:
      "Mariposa de arrecife con franja ocular y un filamento largo en la aleta dorsal.",
    family: "Chaetodontidae",
    habitat: "Arrecifes coralinos",
    locationLabel: "Radazul, Tenerife",
    lat: 28.4033,
    lng: -16.325,
    photoUrl:
      "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&q=80",
    photoThumbUrl:
      "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&q=80",
    sightedAt: new Date("2025-06-14"),
    model3dUrl: "/models/curated/fish-pink.glb",
    model3dSource: "curated_pink",
  },
  // Misma playa con varios peces → sí spiderfy
  {
    scientificName: "Scaridae sp.",
    commonName: "Pez loro",
    description:
      "Pez de pico fuerte que pasta algas sobre el coral; colores vivos según la especie.",
    family: "Scaridae",
    habitat: "Arrecifes coralinos",
    locationLabel: "Los Cristianos, Tenerife",
    lat: 28.0502,
    lng: -16.7169,
    photoUrl:
      "https://images.unsplash.com/photo-1682687220063-4742bd7fd538?w=800&q=80",
    photoThumbUrl:
      "https://images.unsplash.com/photo-1682687220063-4742bd7fd538?w=400&q=80",
    sightedAt: new Date("2025-06-18"),
    model3dUrl: "/models/curated/fish-teal.glb",
    model3dSource: "curated_teal",
  },
  {
    scientificName: "Pomacanthus imperator",
    commonName: "Pez ángel emperador",
    description:
      "Ángel de arrecife con franjas azul y amarillo; juvenil y adulto cambian de patrón.",
    family: "Pomacanthidae",
    habitat: "Arrecifes y cuevas",
    locationLabel: "Los Cristianos, Tenerife",
    lat: 28.0502,
    lng: -16.7169,
    photoUrl:
      "https://images.unsplash.com/photo-1544552866-d3ed42536cfd?w=800&q=80",
    photoThumbUrl:
      "https://images.unsplash.com/photo-1544552866-d3ed42536cfd?w=400&q=80",
    sightedAt: new Date("2025-06-20"),
    model3dUrl: "/models/curated/fish-teal.glb",
    model3dSource: "curated_teal",
  },
  {
    scientificName: "Muraena helena",
    commonName: "Morena mediterránea",
    description:
      "Anguila de piel moteada que se esconde en grietas rocosas durante el día.",
    family: "Muraenidae",
    habitat: "Fondos rocosos",
    locationLabel: "Los Cristianos, Tenerife",
    lat: 28.0502,
    lng: -16.7169,
    photoUrl:
      "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&q=80",
    photoThumbUrl:
      "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400&q=80",
    sightedAt: new Date("2025-06-22"),
  },
  {
    scientificName: "Amphiprion ocellaris",
    commonName: "Pez payaso",
    description:
      "Pez naranja con bandas blancas, famoso por su simbiosis con anémonas.",
    family: "Pomacentridae",
    habitat: "Anémonas en arrecifes",
    locationLabel: "Lanzarote, España",
    lat: 29.0469,
    lng: -13.5896,
    photoUrl:
      "https://images.unsplash.com/photo-1573551701016-d173344231b0?w=800&q=80",
    photoThumbUrl:
      "https://images.unsplash.com/photo-1573551701016-d173344231b0?w=400&q=80",
    sightedAt: new Date("2025-08-03"),
    model3dUrl: "/models/curated/fish-orange.glb",
    model3dSource: "curated_orange",
  },
  {
    scientificName: "Pterois volitans",
    commonName: "Pez león",
    description:
      "Pez venenoso con aletas espinosas radiantes, de aspecto espectacular.",
    family: "Scorpaenidae",
    habitat: "Arrecifes y lagunas",
    locationLabel: "Mallorca, España",
    lat: 39.6953,
    lng: 3.0176,
    photoUrl:
      "https://images.unsplash.com/photo-1721982318707-14939452a32e?w=800&q=80",
    photoThumbUrl:
      "https://images.unsplash.com/photo-1721982318707-14939452a32e?w=400&q=80",
    sightedAt: null,
    model3dUrl: "/models/curated/fish-violet.glb",
    model3dSource: "curated_violet",
  },
  {
    scientificName: "Acanthurus leucosternon",
    commonName: "Cirujano de polvo azul",
    description:
      "Cirujano de cuerpo azul eléctrico con cara blanca y aleta dorsal amarilla.",
    family: "Acanthuridae",
    habitat: "Arrecifes poco profundos",
    locationLabel: "La Graciosa, España",
    lat: 29.2515,
    lng: -13.5037,
    photoUrl:
      "https://images.unsplash.com/photo-1535591273668-578e31182c4f?w=800&q=80",
    photoThumbUrl:
      "https://images.unsplash.com/photo-1535591273668-578e31182c4f?w=400&q=80",
    sightedAt: new Date("2025-09-01"),
    model3dUrl: "/models/curated/fish-blue.glb",
    model3dSource: "curated_blue",
  },
  {
    scientificName: "Balistoides conspicillum",
    commonName: "Pez ballesta payaso",
    description:
      "Ballesta con manchas blancas sobre fondo negro y hocico amarillo.",
    family: "Balistidae",
    habitat: "Arrecifes y lagunas",
    locationLabel: "Lanzarote, España",
    lat: 29.0469,
    lng: -13.5896,
    photoUrl:
      "https://images.unsplash.com/photo-1582967788606-a171f1080aae?w=800&q=80",
    photoThumbUrl:
      "https://images.unsplash.com/photo-1582967788606-a171f1080aae?w=400&q=80",
    sightedAt: new Date("2025-08-05"),
    model3dUrl: "/models/curated/fish-orange.glb",
    model3dSource: "curated_orange",
  },
  {
    scientificName: "Hippocampus kuda",
    commonName: "Caballito de mar",
    description:
      "Caballito de cuerpo alargado que se ancla a algas y corales con la cola.",
    family: "Syngnathidae",
    habitat: "Praderas y arrecifes costeros",
    locationLabel: "Menorca, España",
    lat: 39.9496,
    lng: 4.1104,
    photoUrl:
      "https://images.unsplash.com/photo-1551244072-5d12893278ab?w=800&q=80",
    photoThumbUrl:
      "https://images.unsplash.com/photo-1551244072-5d12893278ab?w=400&q=80",
    sightedAt: new Date("2025-07-20"),
  },
];

async function main() {
  console.log("Sembrando Pecedex...");

  await prisma.sighting.deleteMany();
  await prisma.species.deleteMany();
  await prisma.location.deleteMany();

  const locationCache = new Map<string, string>();

  for (const fish of PLACEHOLDER_FISH) {
    let locationId = locationCache.get(fish.locationLabel);

    if (!locationId) {
      const location = await prisma.location.create({
        data: {
          label: fish.locationLabel,
          lat: fish.lat,
          lng: fish.lng,
          geocodeSource: "seed",
        },
      });
      locationId = location.id;
      locationCache.set(fish.locationLabel, locationId);
    }

    const species = await prisma.species.create({
      data: {
        scientificName: fish.scientificName,
        commonName: fish.commonName,
        description: fish.description,
        family: fish.family,
        habitat: fish.habitat,
      },
    });

    const withModel = Boolean(fish.model3dUrl);

    await prisma.sighting.create({
      data: {
        speciesId: species.id,
        locationId,
        photoUrl: fish.photoUrl,
        photoThumbUrl: fish.photoThumbUrl,
        sightedAt: fish.sightedAt,
        model3dStatus: withModel ? "READY" : "PENDING",
        displayMode: withModel ? "MODEL_3D" : "PHOTO_ROTATOR",
        model3dUrl: fish.model3dUrl ?? null,
        model3dSource: fish.model3dSource ?? null,
      },
    });
  }

  const with3d = PLACEHOLDER_FISH.filter((f) => f.model3dUrl).length;
  console.log(
    `✓ ${PLACEHOLDER_FISH.length} avistamientos en ${locationCache.size} ubicaciones (${with3d} con modelo 3D)`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
